import { DEFAULT_LABOUR_CENTS, priceBookItem } from "../price-book";
import type { LineType } from "@/lib/pricing";
import { buildDeck, buildFence, type LabourRate } from "./assemblies";
import type { EstimateDraft } from "./draft";

// Stage 6 + 7 of the pipeline (SPEC.md §5): deterministic pricing and sanity checks. The model proposes, code prices.

export type RateRule = { id: string; title: string; rateCents: number; unit: string; type: "labour" | "material" };

export type PricedLine = {
  description: string;
  type: LineType;
  qty: number;
  unit: string;
  unitCostCents: number;
  source: "ai" | "rate_rule" | "price_book";
  sourceRef: string | null;
  notes: string | null;
};

export type PricedGroup = { name: string; lines: PricedLine[] };

export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * The hourly rate calculator labour is priced at: the business's own hourly labour rate (a carpenter's if it has
 * several), otherwise the price book's typical rate.
 */
export function labourRateFrom(rateRules: RateRule[]): LabourRate {
  const hourly = rateRules.filter((r) => r.type === "labour" && /^(h|hr|hrs|hour|hours)$/i.test(r.unit.trim()));
  const rule = hourly.find((r) => /carpent/i.test(r.title)) ?? hourly[0];
  return rule
    ? { cents: rule.rateCents, source: "rate_rule", ref: rule.id }
    : { cents: DEFAULT_LABOUR_CENTS.carpenter, source: "price_book", ref: "labour:carpenter" };
}

type DraftToPrice = Pick<EstimateDraft, "groups"> & Partial<Pick<EstimateDraft, "fences" | "decks">>;

/**
 * Converts a model draft into stored lines. Fences and decks go through their calculators. For the rest, a line
 * that cites a real rate rule of a matching type is always priced at that rule's rate, and a material that cites
 * a price book item at the book's price, whatever the model wrote; unknown or mismatched ids are ignored and the
 * model's own price stands (shown to the tradie as one to check).
 */
export function priceDraft(draft: DraftToPrice, rateRules: RateRule[]): PricedGroup[] {
  const rate = labourRateFrom(rateRules);
  const fences = draft.fences ?? [];
  const decks = draft.decks ?? [];
  const label = (kind: string, i: number, n: number) => (name: string) => (n > 1 ? `${kind} ${i + 1}: ${name}` : name);
  const calculated = [
    ...fences.flatMap((f, i) => buildFence(f, rate).map((g) => ({ ...g, name: label("Fence", i, fences.length)(g.name) }))),
    ...decks.flatMap((d, i) => buildDeck(d, rate).map((g) => ({ ...g, name: label("Deck", i, decks.length)(g.name) }))),
  ];

  const rules = new Map(rateRules.map((r) => [r.id, r]));
  const priced = draft.groups.map((g) => ({
    name: g.name.trim(),
    lines: g.lines.map((l): PricedLine => {
      const base = {
        description: l.description.trim(),
        type: l.type,
        qty: Math.round(l.qty * 1000) / 1000, // numeric(12,3)
        notes: l.notes?.trim() || null,
      };
      const rule = l.rateRuleId ? rules.get(l.rateRuleId) : undefined;
      if (rule != null && rule.type === l.type) {
        return { ...base, unit: rule.unit, unitCostCents: rule.rateCents, source: "rate_rule", sourceRef: rule.id };
      }
      const item = l.type === "material" || l.type === "other" ? priceBookItem(l.priceBookId) : undefined;
      if (item) return { ...base, unit: item.unit, unitCostCents: item.costCents, source: "price_book", sourceRef: item.id };
      return { ...base, unit: l.unit.trim(), unitCostCents: toCents(l.unitCost), source: "ai", sourceRef: null };
    }),
  }));
  return [...calculated, ...priced.filter((g) => g.lines.length > 0)];
}

const WET_AREA = /\b(bathroom|ensuite|shower|laundry|wet area)\b/i;
const WATERPROOF = /waterproof|membrane/i;

/** Warnings for the tradie to review. Never silently changes the estimate. */
type CheckedLine = Pick<PricedLine, "description" | "type" | "unitCostCents">;

export function validateEstimate(description: string, groups: { lines: CheckedLine[] }[]): string[] {
  const warnings: string[] = [];
  const lines = groups.flatMap((g) => g.lines);

  for (const l of lines) {
    if (l.unitCostCents === 0) warnings.push(`"${l.description}" has no cost.`);
  }
  if (!lines.some((l) => l.type === "labour" || l.type === "subbie")) {
    warnings.push("There are no labour or subcontractor lines.");
  }
  if (WET_AREA.test(description) && !lines.some((l) => WATERPROOF.test(l.description))) {
    warnings.push("This looks like wet-area work but there's no waterproofing line.");
  }
  return warnings;
}
