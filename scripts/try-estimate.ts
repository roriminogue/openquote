// Runs the Quick estimate pipeline once without a database: prompt → stream → price → checks.
// Usage: ANTHROPIC_API_KEY=… npm run ai:try -- "Build a 4x3m merbau deck, 600mm high, two steps"
import { config } from "dotenv";
config({ path: ".env.local" });

import { createAnthropic } from "@ai-sdk/anthropic";
import { costMicroUsd } from "../src/lib/ai/cost";
import { generateEstimateDraft } from "../src/lib/estimate/generate";
import { priceDraft, validateEstimate } from "../src/lib/estimate/price";
import { buildGenerationPrompt } from "../src/lib/estimate/prompt";
import { estimateTotals, formatAud } from "../src/lib/pricing";

async function main() {
  const description = process.argv.slice(2).join(" ") || "Build a 4m x 3m merbau deck, 600mm off the ground, two steps, oil finish";
  const modelId = process.env.AI_MODEL ?? "claude-sonnet-5-5";
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Set ANTHROPIC_API_KEY (in .env.local or the environment).");

  const rateRules = [
    { id: "R1", title: "Qualified carpenter", rateCents: 9500, unit: "hour", type: "labour" as const },
    { id: "R2", title: "Merbau decking 90x19", rateCents: 2290, unit: "lm", type: "material" as const },
  ];
  const { system, prompt } = buildGenerationPrompt({
    description,
    org: { name: "Demo Carpentry", trades: ["carpenter"], finishLevel: "standard", postcode: "3056", gstRegistered: true },
    rateRules,
    instructions: ["Always include a 10% waste allowance on timber."],
  });

  const started = Date.now();
  let partials = 0;
  const { draft, usage } = await generateEstimateDraft({
    model: createAnthropic()(modelId),
    system,
    prompt,
    onPartial: () => {
      if (++partials % 25 === 0) process.stdout.write(".");
    },
  });
  const groups = priceDraft(draft, rateRules);
  const totals = estimateTotals(groups, { org: { defaultMarkupPct: 20 }, gstRatePct: 10 });

  console.log(`\n\n${draft.title}  (${((Date.now() - started) / 1000).toFixed(1)}s, ${partials} partial updates)\n`);
  for (const g of groups) {
    console.log(g.name);
    for (const l of g.lines) {
      const tag = l.source === "rate_rule" ? ` [rate ${l.sourceRef}]` : "";
      console.log(`  ${l.qty} ${l.unit} × ${formatAud(l.unitCostCents)}  ${l.description} (${l.type})${tag}`);
    }
  }
  console.log(`\nCost ${formatAud(totals.costCents)} · Price ex GST ${formatAud(totals.subtotalCents)} · Total ${formatAud(totals.totalCents)}`);
  console.log(`Alternatives: ${draft.alternatives.map((a) => `${a.kind}: ${a.title}`).join("; ")}`);
  const warnings = validateEstimate(description, groups);
  if (warnings.length) console.log(`Warnings:\n  ${warnings.join("\n  ")}`);
  const cost = costMicroUsd(modelId, usage.inputTokens, usage.outputTokens);
  console.log(`Tokens ${usage.inputTokens} in / ${usage.outputTokens} out${cost != null ? ` ≈ US$${(cost / 1e6).toFixed(3)}` : ""}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
