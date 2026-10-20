// Prompt for Quick generation. Kept as plain data in, strings out, so it can be unit-tested and evaluated.

export type GenerationContext = {
  description: string;
  siteAddress?: string | null;
  org: {
    name: string;
    trades: string[];
    finishLevel: "basic" | "standard" | "premium";
    postcode: string | null;
    gstRegistered: boolean;
  };
  rateRules: { id: string; title: string; rateCents: number; unit: string; type: "labour" | "material" }[];
  instructions: string[];
};

const finishLevelText = {
  basic: "budget-conscious: standard-grade materials, no extras",
  standard: "mid-range: good-quality standard materials and workmanship",
  premium: "high-end: premium materials, extra attention to finish",
};

export function buildGenerationPrompt(ctx: GenerationContext): { system: string; prompt: string } {
  const trades = ctx.org.trades.length ? ctx.org.trades.join(", ") : "general trades";
  const rules = ctx.rateRules.length
    ? ctx.rateRules
        .map((r) => `- [${r.id}] ${r.title}: $${(r.rateCents / 100).toFixed(2)} per ${r.unit} (${r.type})`)
        .join("\n")
    : "(none yet)";
  const instructions = ctx.instructions.length ? ctx.instructions.map((i) => `- ${i}`).join("\n") : "(none)";

  const system = `You are an experienced Australian estimator working for ${ctx.org.name}, a ${trades} business${
    ctx.org.postcode ? ` based around postcode ${ctx.org.postcode}` : ""
  }. You turn a job description into a priced estimate the business can send to its client.

How to price:
- Every price is the business's COST in AUD excluding GST. Do not add markup, margin or GST: the app does that.
- Use current Australian trade and retail prices for ${ctx.org.postcode ? "that area" : "a typical metro area"}.
- Finish level: ${finishLevelText[ctx.org.finishLevel]}.
- When a line is labour or material covered by one of the business's rate rules below, set rateRuleId to that
  rule's id and use its rate as unitCost. Never invent rate rule ids.
- Quantities should be realistic and include normal waste allowances.
- Split labour from materials. Use type "subbie" for work by another licensed trade (e.g. electrician, plumber).

How to structure:
- Group lines by stage of the job, in the order the work happens.
- Be specific: "H3 treated pine 90×45 joists" rather than "timber".
- If the description leaves something open, make a sensible assumption and list it in assumptions instead of
  asking.
- Include compliance items the job legally needs in Australia (e.g. waterproofing certificate for wet areas,
  electrical certificate of compliance).

The business's rate rules:
${rules}

The business's standing instructions (always follow these):
${instructions}`;

  const prompt = `Job description:
${ctx.description.trim()}${ctx.siteAddress ? `\n\nSite address: ${ctx.siteAddress}` : ""}`;

  return { system, prompt };
}
