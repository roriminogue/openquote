import { describe, expect, it } from "vitest";
import { buildGenerationPrompt, type GenerationContext } from "./prompt";

const ctx: GenerationContext = {
  description: "  Build a 4x3m merbau deck  ",
  siteAddress: "1 Example St, Brunswick VIC",
  org: { name: "Coastal Carpentry", trades: ["carpenter"], finishLevel: "premium", postcode: "3056", gstRegistered: true },
  rateRules: [{ id: "R1", title: "Qualified carpenter", rateCents: 9500, unit: "hour", type: "labour" }],
  instructions: ["Always add 10% timber waste."],
};

describe("buildGenerationPrompt", () => {
  it("puts business context, rate rules and instructions in the system prompt", () => {
    const { system } = buildGenerationPrompt(ctx);
    expect(system).toContain("Coastal Carpentry, a carpenter business based around postcode 3056");
    expect(system).toContain("- [R1] Qualified carpenter: $95.00 per hour (labour)");
    expect(system).toContain("- Always add 10% timber waste.");
    expect(system).toContain("high-end");
    expect(system).toMatch(/excluding GST/);
  });

  it("puts the job in the user prompt, trimmed, with the site address", () => {
    expect(buildGenerationPrompt(ctx).prompt).toBe(
      "Job description:\nBuild a 4x3m merbau deck\n\nSite address: 1 Example St, Brunswick VIC",
    );
  });

  it("says so when there are no rules or instructions", () => {
    const { system } = buildGenerationPrompt({ ...ctx, rateRules: [], instructions: [] });
    expect(system).toContain("(none yet)");
    expect(system).toContain("(none)");
  });
});
