import { describe, expect, it } from "vitest";
import { EstimateEditInput, parseQty } from "./edit-schema";

const line = { description: "Qualified carpenter", type: "labour", qty: 8, unit: "hour", unitCostCents: 9500, markupPct: null, notes: null, source: "rate_rule", sourceRef: null };

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
