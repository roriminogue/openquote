// Test bench: runs reference jobs through the Quick estimate pipeline (no database) and compares the result with
// earlier runs and published price ranges. Spends real AI credit (about US$0.05–0.10 per job).
// Usage: npm run bench            all jobs
//        npm run bench -- fence   one job
import { config } from "dotenv";
config({ path: ".env.local" });

import { mkdirSync, writeFileSync } from "node:fs";
import { createAnthropic } from "@ai-sdk/anthropic";
import { costMicroUsd } from "../src/lib/ai/cost";
import { generateEstimateDraft } from "../src/lib/estimate/generate";
import { priceDraft, type PricedGroup } from "../src/lib/estimate/price";
import { buildGenerationPrompt } from "../src/lib/estimate/prompt";
import { formatAud } from "../src/lib/pricing";

type Job = {
  key: string;
  description: string;
  /** Published installed price range for the whole job, inc GST, Melbourne 2026. */
  market: [number, number] | null;
  /** Cost before markup from earlier runs, in dollars. */
  before: { sammy: number; openquote: number };
};

const JOBS: Job[] = [
  {
    key: "deck",
    description:
      "Build a 4 × 3 m merbau deck at the back of the house, about 600 mm off the ground, with two steps down to the lawn and an oil finish. Easy side access.",
    market: [5000, 11000],
    before: { sammy: 6586.4, openquote: 8657.7 },
  },
  {
    key: "fence",
    description:
      "Replace 20 m of 1.8 m high timber paling fence along the side boundary. Reuse the existing posts; new treated pine rails, palings and capping. Remove and dispose of the old palings and rails.",
    market: [1500, 3000],
    before: { sammy: 3857, openquote: 4519 },
  },
  {
    key: "bathroom",
    description:
      "Retile a 2.4 × 2 m bathroom floor to ceiling (2.4 m ceiling) with a new walk-in shower and frameless screen, same layout. Remove existing tiles, waterproof, supply mid-range tiles.",
    market: null,
    before: { sammy: 15584.2, openquote: 14879 },
  },
  {
    key: "paint",
    description:
      "Repaint the interior of a 3-bedroom house: walls and ceilings in the three bedrooms, living room, hallway and kitchen. About 120 m² of floor area with 2.7 m ceilings. Two coats, minor patching, Dulux low-sheen on walls and flat white on ceilings.",
    market: [4000, 10000],
    before: { sammy: 10265, openquote: 5080 },
  },
];

const MARKUP = 0.2;

function summarise(groups: PricedGroup[]) {
  const lines = groups.flatMap((g) => g.lines);
  const costCents = lines.reduce((n, l) => n + Math.round(l.qty * l.unitCostCents), 0);
  const hours = lines.filter((l) => l.type === "labour" && /^(h|hr|hrs|hour|hours)$/i.test(l.unit)).reduce((n, l) => n + l.qty, 0);
  const bySource = lines.reduce<Record<string, number>>((m, l) => ({ ...m, [l.source]: (m[l.source] ?? 0) + 1 }), {});
  return { costCents, hours, bySource, lineCount: lines.length };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Set ANTHROPIC_API_KEY (in .env.local or the environment).");
  const modelId = process.env.AI_MODEL ?? "claude-sonnet-5-5";
  const only = process.argv[2];
  const jobs = only ? JOBS.filter((j) => j.key === only) : JOBS;
  const results = [];

  for (const job of jobs) {
    const { system, prompt } = buildGenerationPrompt({
      description: job.description,
      // A business with no rates saved yet: everything comes from the calculators, the price book or the AI.
      org: { name: "Bench Carpentry", trades: ["carpenter"], finishLevel: "standard", postcode: "3056", gstRegistered: true },
      rateRules: [],
      instructions: [],
    });
    const started = Date.now();
    const { draft, usage } = await generateEstimateDraft({ model: createAnthropic()(modelId), system, prompt });
    const groups = priceDraft(draft, []);
    const s = summarise(groups);
    const cost = s.costCents / 100;
    const clientIncGst = cost * (1 + MARKUP) * 1.1;
    const usd = (costMicroUsd(modelId, usage.inputTokens, usage.outputTokens) ?? 0) / 1e6;

    console.log(`\n━━ ${job.key}: ${draft.title}  (${((Date.now() - started) / 1000).toFixed(0)}s, US$${usd.toFixed(3)})`);
    if (draft.fences.length) console.log(`  fence calculator: ${JSON.stringify(draft.fences)}`);
    if (draft.decks.length) console.log(`  deck calculator: ${JSON.stringify(draft.decks)}`);
    for (const g of groups) {
      console.log(`  ${g.name}`);
      for (const l of g.lines) {
        const tag = { ai: "CHECK", rate_rule: "rate", price_book: "book" }[l.source];
        console.log(`    ${String(l.qty).padStart(7)} ${l.unit.padEnd(5)} × ${formatAud(l.unitCostCents).padStart(9)}  [${tag}] ${l.description}`);
      }
    }
    const pct = (a: number, b: number) => `${a > b ? "+" : ""}${Math.round(((a - b) / b) * 100)}%`;
    console.log(`  Cost ${formatAud(s.costCents)} (before: OpenQuote ${pct(cost, job.before.openquote)}, Sammy ${pct(cost, job.before.sammy)})`);
    console.log(
      `  Client price inc GST at ${MARKUP * 100}% markup: ${formatAud(Math.round(clientIncGst * 100))}` +
        (job.market ? ` · market ${formatAud(job.market[0] * 100)}–${formatAud(job.market[1] * 100)} ${clientIncGst < job.market[0] ? "(below)" : clientIncGst > job.market[1] ? "(above)" : "(inside)"}` : ""),
    );
    console.log(`  Labour ${s.hours} h · lines by source ${JSON.stringify(s.bySource)}`);
    results.push({ key: job.key, title: draft.title, model: modelId, usd, cost, clientIncGst, ...s, draft, groups });
  }

  mkdirSync(".bench", { recursive: true });
  const file = `.bench/${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify(results, null, 1));
  console.log(`\nSaved ${file}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
