import { describe, expect, it } from "vitest";
import {
  estimateTotals,
  exGstCents,
  formatInvoiceNo,
  linePriceCents,
  marginPct,
  resolveMarkupPct,
} from "./pricing";

const org = { defaultMarkupPct: 25, markupLabourPct: 10 };

describe("resolveMarkupPct", () => {
  it("prefers the line's own markup", () => {
    expect(resolveMarkupPct({ type: "labour", qty: 1, unitCostCents: 100, markupPct: 50 }, org, 30)).toBe(50);
  });
  it("then the estimate markup", () => {
    expect(resolveMarkupPct({ type: "labour", qty: 1, unitCostCents: 100 }, org, 30)).toBe(30);
  });
  it("then the org per-type markup", () => {
    expect(resolveMarkupPct({ type: "labour", qty: 1, unitCostCents: 100 }, org)).toBe(10);
  });
  it("then the org default", () => {
    expect(resolveMarkupPct({ type: "material", qty: 1, unitCostCents: 100 }, org)).toBe(25);
  });
  it("treats a 0% line markup as set, not missing", () => {
    expect(resolveMarkupPct({ type: "material", qty: 1, unitCostCents: 100, markupPct: 0 }, org)).toBe(0);
  });
});

describe("margin vs markup", () => {
  it("25% markup on $1,000 cost is a $1,250 price and 20% margin", () => {
    const price = linePriceCents({ type: "material", qty: 1, unitCostCents: 100_000 }, 25);
    expect(price).toBe(125_000);
    expect(marginPct(100_000, price)).toBeCloseTo(20);
  });
});

describe("estimateTotals", () => {
  const groups = [
    {
      name: "Decking",
      lines: [
        { type: "material" as const, qty: 86, unitCostCents: 2290 }, // 1969.40 cost
        { type: "labour" as const, qty: 10, unitCostCents: 9500 }, // 950.00 cost
      ],
    },
  ];

  it("applies per-type markup and GST once on the total", () => {
    const t = estimateTotals(groups, { org, gstRatePct: 10 });
    expect(t.costCents).toBe(196_940 + 95_000);
    // material 196940 × 1.25 = 246175; labour 95000 × 1.10 = 104500
    expect(t.subtotalCents).toBe(246_175 + 104_500);
    expect(t.gstCents).toBe(35_068);
    expect(t.totalCents).toBe(350_675 + 35_068);
  });

  it("charges no GST when exempt", () => {
    const t = estimateTotals(groups, { org, gstRatePct: 10, gstExempt: true });
    expect(t.gstCents).toBe(0);
    expect(t.totalCents).toBe(t.subtotalCents);
  });
});

describe("helpers", () => {
  it("strips GST from inclusive prices", () => {
    expect(exGstCents(11_000, 10)).toBe(10_000);
  });
  it("pads invoice numbers", () => {
    expect(formatInvoiceNo(87)).toBe("INV-0087");
  });
});
