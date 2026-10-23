import { describe, expect, it } from "vitest";
import type { DraftLine } from "./draft";
import { labourRateFrom, priceDraft, toCents, validateEstimate, type RateRule } from "./price";

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
  priceBookId: null,
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

describe("priceDraft with the price book and calculators", () => {
  it("prices a material from the price book, overriding the model's cost and unit", () => {
    const [g] = priceDraft(
      { groups: [{ name: "Fence", lines: [line({ unitCost: 4.5, unit: "ea", priceBookId: "paling_tp_100x12_1800" })] }] },
      [],
    );
    expect(g.lines[0]).toMatchObject({ unitCostCents: 155, unit: "each", source: "price_book", sourceRef: "paling_tp_100x12_1800" });
  });

  it("prefers the business's rate rule, and ignores unknown book ids or book ids on labour", () => {
    const [g] = priceDraft(
      {
        groups: [
          {
            name: "Mixed",
            lines: [
              line({ rateRuleId: "R2", priceBookId: "deck_merbau_90x19" }),
              line({ priceBookId: "nope", unitCost: 3 }),
              line({ type: "labour", priceBookId: "deck_merbau_90x19", unitCost: 70, unit: "hour" }),
            ],
          },
        ],
      },
      rules,
    );
    expect(g.lines.map((l) => l.source)).toEqual(["rate_rule", "ai", "ai"]);
    expect(g.lines[1].unitCostCents).toBe(300);
  });

  it("puts calculator groups first and prices their labour at the business's hourly rate", () => {
    const groups = priceDraft(
      {
        fences: [
          { lengthM: 10, heightM: 1.8, style: "butted", newPosts: true, removeOld: false, gates: 0, capping: false, plinth: false, site: "normal" },
        ],
        decks: [],
        groups: [{ name: "Permits", lines: [line({ type: "other", unitCost: 300 })] }],
      },
      rules,
    );
    expect(groups[0].name).toBe("Posts");
    expect(groups.at(-1)!.name).toBe("Permits");
    const labour = groups.flatMap((g) => g.lines).filter((l) => l.type === "labour");
    expect(labour.every((l) => l.unitCostCents === 9500 && l.source === "rate_rule" && l.sourceRef === "R1")).toBe(true);
  });

  it("falls back to the typical labour rate without an hourly rule", () => {
    expect(labourRateFrom([])).toEqual({ cents: 7500, source: "price_book", ref: "labour:carpenter" });
    expect(labourRateFrom([{ id: "R9", title: "Site visit", rateCents: 15000, unit: "lot", type: "labour" }]).source).toBe("price_book");
  });
});
