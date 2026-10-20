// Deterministic pricing — see SPEC.md §4 "Pricing rules".
// All amounts are integer cents, ex-GST. GST is applied once, on the document total.

export type LineType = "material" | "labour" | "subbie" | "other";

export type MarkupSettings = {
  defaultMarkupPct: number;
  markupMaterialsPct?: number | null;
  markupLabourPct?: number | null;
  markupSubbiePct?: number | null;
  markupOtherPct?: number | null;
};

export type PricedLineInput = {
  type: LineType;
  qty: number;
  unitCostCents: number;
  markupPct?: number | null;
};

export type GroupInput = { name: string; lines: PricedLineInput[] };

const typeMarkupKey: Record<LineType, keyof MarkupSettings> = {
  material: "markupMaterialsPct",
  labour: "markupLabourPct",
  subbie: "markupSubbiePct",
  other: "markupOtherPct",
};

/** Line markup, else estimate-wide markup, else org per-type markup, else org default. */
export function resolveMarkupPct(
  line: PricedLineInput,
  org: MarkupSettings,
  estimateMarkupPct?: number | null,
): number {
  if (line.markupPct != null) return line.markupPct;
  if (estimateMarkupPct != null) return estimateMarkupPct;
  return org[typeMarkupKey[line.type]] ?? org.defaultMarkupPct;
}

export function lineCostCents(line: PricedLineInput): number {
  return Math.round(line.qty * line.unitCostCents);
}

export function linePriceCents(line: PricedLineInput, markupPct: number): number {
  return Math.round(line.qty * line.unitCostCents * (1 + markupPct / 100));
}

/** Margin as a % of price. A 25% markup gives a 20% margin. */
export function marginPct(costCents: number, priceCents: number): number {
  if (priceCents === 0) return 0;
  return ((priceCents - costCents) / priceCents) * 100;
}

export type EstimateTotals = {
  groups: { name: string; costCents: number; priceCents: number }[];
  costCents: number;
  subtotalCents: number; // client price ex-GST
  gstCents: number;
  totalCents: number;
  marginPct: number;
};

export function estimateTotals(
  groups: GroupInput[],
  opts: { org: MarkupSettings; estimateMarkupPct?: number | null; gstRatePct: number; gstExempt?: boolean },
): EstimateTotals {
  const groupTotals = groups.map((g) => {
    let costCents = 0;
    let priceCents = 0;
    for (const line of g.lines) {
      costCents += lineCostCents(line);
      priceCents += linePriceCents(line, resolveMarkupPct(line, opts.org, opts.estimateMarkupPct));
    }
    return { name: g.name, costCents, priceCents };
  });

  const costCents = groupTotals.reduce((s, g) => s + g.costCents, 0);
  const subtotalCents = groupTotals.reduce((s, g) => s + g.priceCents, 0);
  const gstCents = opts.gstExempt ? 0 : Math.round((subtotalCents * opts.gstRatePct) / 100);

  return {
    groups: groupTotals,
    costCents,
    subtotalCents,
    gstCents,
    totalCents: subtotalCents + gstCents,
    marginPct: marginPct(costCents, subtotalCents),
  };
}

/** Strip GST from a GST-inclusive price (e.g. supplier lists): 110.00 → 100.00 at 10%. */
export function exGstCents(incGstCents: number, gstRatePct: number): number {
  return Math.round(incGstCents / (1 + gstRatePct / 100));
}

export const formatEstimateNo = (n: number) => `EST-${n}`;
export const formatInvoiceNo = (n: number) => `INV-${String(n).padStart(4, "0")}`;

export function formatAud(cents: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);
}
