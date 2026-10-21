import { describe, expect, it } from "vitest";
import { formatQtyUnit, unitLabel } from "./units";

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
