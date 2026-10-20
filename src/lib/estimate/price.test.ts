import { describe, expect, it } from "vitest";
import type { DraftLine } from "./draft";
import { priceDraft, toCents, validateEstimate, type RateRule } from "./price";

const rules: RateRule[] = [
  { id: "R1", title: "Qualified carpenter", rateCents: 9500, unit: "hour", type: "labour" },
  { id: "R2", title: "Merbau decking 90x19", rateCents: 2290, unit: "lm", type: "material" },
];

const line = (over: Partial<DraftLine>): DraftLine => ({
  description: "Line",
  type: "material",
  qty: 1,
  unit: "each",
  unitCost: 10,
  rateRuleId: null,
  notes: null,
  ...over,
});

describe("toCents", () => {
  it("rounds to whole cents", () => {
    expect(toCents(10.005)).toBe(1001);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });
});

describe("priceDraft", () => {
  it("prices a line from its rate rule, overriding the model's cost and unit", () => {
    const [g] = priceDraft(
      { groups: [{ name: " Decking ", lines: [line({ type: "labour", unitCost: 60, unit: "hr", rateRuleId: "R1" })] }] },
      rules,
    );
    expect(g.name).toBe("Decking");
    expect(g.lines[0]).toMatchObject({ unitCostCents: 9500, unit: "hour", source: "rate_rule", sourceRef: "R1" });
  });

  it("ignores unknown or type-mismatched rule ids", () => {
    const [g] = priceDraft(
      {
        groups: [
          {
            name: "G",
            lines: [line({ rateRuleId: "R99", unitCost: 12.5 }), line({ type: "labour", rateRuleId: "R2", unitCost: 80 })],
          },
        ],
      },
      rules,
    );
    expect(g.lines.map((l) => [l.source, l.unitCostCents])).toEqual([
      ["ai", 1250],
      ["ai", 8000],
    ]);
  });

  it("rounds quantities to the stored precision and blanks empty notes", () => {
    const [g] = priceDraft({ groups: [{ name: "G", lines: [line({ qty: 1.23456, notes: "  " })] }] }, rules);
    expect(g.lines[0].qty).toBe(1.235);
    expect(g.lines[0].notes).toBeNull();
  });
});

describe("validateEstimate", () => {
  const priced = (description: string, type: DraftLine["type"] = "material", unitCost = 10) =>
    priceDraft({ groups: [{ name: "G", lines: [line({ description, type, unitCost })] }] }, []);

  it("flags zero-cost lines and missing labour", () => {
    expect(validateEstimate("deck", priced("Screws", "material", 0))).toEqual([
      '"Screws" has no cost.',
      "There are no labour or subcontractor lines.",
    ]);
  });

  it("flags wet-area jobs without waterproofing", () => {
    expect(validateEstimate("Retile the bathroom", priced("Tiling labour", "labour"))).toEqual([
      "This looks like wet-area work but there's no waterproofing line.",
    ]);
    expect(validateEstimate("Retile the bathroom", priced("Waterproofing membrane", "labour"))).toEqual([]);
  });
});
