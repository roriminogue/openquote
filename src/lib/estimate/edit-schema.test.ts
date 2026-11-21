import { describe, expect, it } from "vitest";
import { EstimateEditInput, parseQty, pointsFromText, toEditGroups } from "./edit-schema";

const line = { description: "Qualified carpenter", type: "labour" as const, qty: 8, unit: "hour", unitCostCents: 9500, markupPct: null, notes: null, source: "rate_rule" as const, sourceRef: null };

describe("EstimateEditInput", () => {
  it("accepts an edited estimate and trims text", () => {
    const parsed = EstimateEditInput.parse({ title: "  Deck  ", groups: [{ name: " Framing ", lines: [{ ...line, description: " Fix joists " }] }] });
    expect(parsed.title).toBe("Deck");
    expect(parsed.groups[0].name).toBe("Framing");
    expect(parsed.groups[0].lines[0].description).toBe("Fix joists");
  });

  it("explains what's missing", () => {
    const noStages = EstimateEditInput.safeParse({ title: "Deck", groups: [] });
    expect(noStages.error?.issues[0].message).toBe("An estimate needs at least one stage.");
    const blankLine = EstimateEditInput.safeParse({ title: "Deck", groups: [{ name: "Framing", lines: [{ ...line, description: " " }] }] });
    expect(blankLine.error?.issues[0]).toMatchObject({ message: "Every line needs a description.", path: ["groups", 0, "lines", 0, "description"] });
  });

  it("needs at least one line, and accepts the quote's wording", () => {
    const empty = EstimateEditInput.safeParse({ title: "Deck", groups: [{ name: "Framing", lines: [] }] });
    expect(empty.error?.issues[0].message).toBe("Add at least one line.");
    const worded = EstimateEditInput.parse({
      title: "Deck",
      summary: "  A new deck.  ",
      siteAddress: "1 Main St",
      scope: ["Supply and fix decking"],
      exclusions: [],
      alternatives: [{ kind: "upgrade", title: "Hardwood", detail: "About $800 more." }],
      groups: [{ name: "Framing", lines: [line] }],
    });
    expect(worded.summary).toBe("A new deck.");
    expect(worded.alternatives?.[0].kind).toBe("upgrade");
  });

  it("rejects negative numbers", () => {
    expect(EstimateEditInput.safeParse({ title: "Deck", groups: [{ name: "F", lines: [{ ...line, qty: -1 }] }] }).success).toBe(false);
    expect(EstimateEditInput.safeParse({ title: "Deck", groups: [{ name: "F", lines: [{ ...line, unitCostCents: -5 }] }] }).success).toBe(false);
  });
});

describe("parseQty", () => {
  it("reads quantities", () => {
    expect(parseQty("8")).toBe(8);
    expect(parseQty("2.5")).toBe(2.5);
    expect(parseQty("1,250")).toBe(1250);
    expect(parseQty(".5")).toBe(0.5);
  });
  it("rejects anything else", () => {
    expect(parseQty("")).toBeNull();
    expect(parseQty("-2")).toBeNull();
    expect(parseQty("two")).toBeNull();
    expect(parseQty("1.2345")).toBeNull();
  });
});

describe("toEditGroups", () => {
  it("keeps only a line's own markup and drops stages without lines", () => {
    const view = (markupPct: number, defaultMarkupPct: number) => ({ ...line, markupPct, defaultMarkupPct, notes: "About 8 lm" });
    const groups = toEditGroups([
      { name: "Access", lines: [] },
      { name: "Framing", lines: [view(20, 20), view(35, 20)] },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("Framing");
    expect(groups[0].lines.map((l) => l.markupPct)).toEqual([null, 35]);
    expect(groups[0].lines[0].notes).toBe("About 8 lm");
  });
});

describe("pointsFromText", () => {
  it("makes one point per line, without blanks or bullets", () => {
    expect(pointsFromText("- Strip tiles\n\n• Waterproof\n3. Tile walls\n  Remove waste  ")).toEqual([
      "Strip tiles",
      "Waterproof",
      "Tile walls",
      "Remove waste",
    ]);
  });
});
