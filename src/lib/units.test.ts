import { describe, expect, it } from "vitest";
import { formatQtyUnit, keepUnits, unitLabel } from "./units";

describe("keepUnits", () => {
  const nb = " ";
  it("joins numbers to their units, and × to the number after it", () => {
    expect(keepUnits("Fence 6 m × 1.8 m (palings)")).toBe(`Fence 6${nb}m ×${nb}1.8${nb}m (palings)`);
    expect(keepUnits("Deck 600 mm off the ground")).toBe(`Deck 600${nb}mm off the ground`);
    expect(keepUnits("About 20 m² of wall")).toBe(`About 20${nb}m² of wall`);
  });
  it("keeps a bare size like 4 × 3 m on one line", () => {
    expect(keepUnits("Merbau deck 4 × 3 m, 600 mm high")).toBe(`Merbau deck 4${nb}×${nb}3${nb}m, 600${nb}mm high`);
  });
  it("leaves ordinary words alone", () => {
    expect(keepUnits("2 men for 3 days, 4 mates")).toBe("2 men for 3 days, 4 mates");
  });
});

describe("unitLabel", () => {
  it("abbreviates and pluralises hours", () => {
    expect(formatQtyUnit(1, "hour")).toBe("1 hr");
    expect(formatQtyUnit(3, "hour")).toBe("3 hrs");
    expect(formatQtyUnit(2.5, "hours")).toBe("2.5 hrs");
  });

  it("keeps trade abbreviations singular", () => {
    expect(formatQtyUnit(700, "each")).toBe("700 ea");
    expect(formatQtyUnit(12, "lm")).toBe("12 lm");
    expect(formatQtyUnit(4.5, "m2")).toBe("4.5 m²");
    expect(formatQtyUnit(1, "lot")).toBe("1 lot");
    expect(formatQtyUnit(3, "lot")).toBe("3 lot");
  });

  it("pluralises plain nouns", () => {
    expect(formatQtyUnit(36, "bag")).toBe("36 bags");
    expect(formatQtyUnit(1, "bag")).toBe("1 bag");
    expect(formatQtyUnit(2, "box")).toBe("2 boxes");
    expect(unitLabel("sheets", 4)).toBe("sheets");
  });

  it("formats quantities with grouping and up to two decimals", () => {
    expect(formatQtyUnit(1200, "each")).toBe("1,200 ea");
    expect(formatQtyUnit(0.333, "m3")).toBe("0.33 m³");
  });
});
