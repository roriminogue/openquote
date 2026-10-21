import { describe, expect, it } from "vitest";
import { BusinessContextInput, centsToDollars, dollarsToCents, MarkupInput, RateInput } from "./rates-schema";

describe("dollarsToCents", () => {
  it("reads the ways people type money", () => {
    expect(dollarsToCents("95")).toBe(9500);
    expect(dollarsToCents("$95.50")).toBe(9550);
    expect(dollarsToCents("1,250.00")).toBe(125000);
    expect(dollarsToCents(" 22.9 ")).toBe(2290);
    expect(dollarsToCents("0.14")).toBe(14);
  });

  it("rejects anything that isn't an amount", () => {
    expect(dollarsToCents("")).toBeNull();
    expect(dollarsToCents("-5")).toBeNull();
    expect(dollarsToCents("9.999")).toBeNull();
    expect(dollarsToCents("ninety")).toBeNull();
  });

  it("round-trips for display", () => {
    expect(centsToDollars(9500)).toBe("95");
    expect(centsToDollars(2290)).toBe("22.90");
  });
});

describe("RateInput", () => {
  it("parses a rate into cents", () => {
    expect(RateInput.parse({ title: " Qualified carpenter ", rate: "$95", unit: "hour", type: "labour" })).toEqual({
      title: "Qualified carpenter",
      rate: 9500,
      unit: "hour",
      type: "labour",
    });
  });

  it("explains a bad amount", () => {
    const r = RateInput.safeParse({ title: "Apprentice", rate: "45/hr", unit: "hour", type: "labour" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]).toMatchObject({ path: ["rate"], message: "Enter the rate in dollars, like 95 or 22.90." });
  });
});

describe("MarkupInput", () => {
  it("treats blank overrides as 'use the default'", () => {
    expect(
      MarkupInput.parse({
        defaultMarkupPct: "20",
        markupMaterialsPct: "",
        markupLabourPct: "25%",
        markupSubbiePct: " ",
        markupOtherPct: "",
        gstRegistered: true,
      }),
    ).toEqual({ defaultMarkupPct: 20, markupMaterialsPct: null, markupLabourPct: 25, markupSubbiePct: null, markupOtherPct: null, gstRegistered: true });
  });

  it("requires a default and keeps percentages in range", () => {
    expect(MarkupInput.safeParse({ defaultMarkupPct: "", markupMaterialsPct: "", markupLabourPct: "", markupSubbiePct: "", markupOtherPct: "", gstRegistered: false }).success).toBe(false);
    expect(MarkupInput.safeParse({ defaultMarkupPct: "900", markupMaterialsPct: "", markupLabourPct: "", markupSubbiePct: "", markupOtherPct: "", gstRegistered: false }).success).toBe(false);
  });
});

describe("BusinessContextInput", () => {
  it("splits trades and checks the postcode", () => {
    expect(BusinessContextInput.parse({ trades: "Carpenter, deck builder, ", finishLevel: "standard", postcode: "3056" })).toEqual({
      trades: ["carpenter", "deck builder"],
      finishLevel: "standard",
      postcode: "3056",
    });
    expect(BusinessContextInput.safeParse({ trades: "", finishLevel: "basic", postcode: "305" }).success).toBe(false);
  });
});
