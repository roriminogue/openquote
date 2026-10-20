import type { LineType } from "@/lib/pricing";
import type { EstimateDraft } from "./draft";

// Stage 6 + 7 of the pipeline (SPEC.md §5): deterministic pricing and sanity checks. The model proposes, code prices.

export type RateRule = { id: string; title: string; rateCents: number; unit: string; type: "labour" | "material" };

export type PricedLine = {
  description: string;
  type: LineType;
  qty: number;
  unit: string;
  unitCostCents: number;
  source: "ai" | "rate_rule";
  sourceRef: string | null;
  notes: string | null;
};

export type PricedGroup = { name: string; lines: PricedLine[] };

export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Converts a model draft into stored lines. A line that cites a real rate rule of a matching type is always priced
 * at that rule's rate, whatever the model wrote; unknown or mismatched rule ids are ignored.
 */
export function priceDraft(draft: Pick<EstimateDraft, "groups">, rateRules: RateRule[]): PricedGroup[] {
  const rules = new Map(rateRules.map((r) => [r.id, r]));
  return draft.groups.map((g) => ({
    name: g.name.trim(),
    lines: g.lines.map((l) => {
      const rule = l.rateRuleId ? rules.get(l.rateRuleId) : undefined;
      const ruleApplies = rule != null && rule.type === l.type;
      return {
        description: l.description.trim(),
        type: l.type,
        qty: Math.round(l.qty * 1000) / 1000, // numeric(12,3)
        unit: ruleApplies ? rule.unit : l.unit.trim(),
        unitCostCents: ruleApplies ? rule.rateCents : toCents(l.unitCost),
        source: ruleApplies ? "rate_rule" : "ai",
        sourceRef: ruleApplies ? rule.id : null,
        notes: l.notes?.trim() || null,
      };
    }),
  }));
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
