import { z } from "zod";

// Pure validation for editing an estimate by hand (no DB imports, so it can be unit tested).

const LINE_TYPES = ["material", "labour", "subbie", "other"] as const;
const SOURCES = ["ai", "rate_rule", "kit", "supplier", "manual", "price_book"] as const;

export const EditLine = z.object({
  description: z.string().trim().min(1, "Every line needs a description.").max(500, "Keep line descriptions under 500 characters."),
  type: z.enum(LINE_TYPES),
  qty: z.number({ message: "Enter a quantity." }).finite().min(0, "Quantities can't be negative.").max(1_000_000, "That quantity looks too big."),
  unit: z.string().trim().min(1, "Every line needs a unit.").max(20, "Keep units short, like hour or lm."),
  unitCostCents: z.number().int().min(0, "Costs can't be negative.").max(100_000_000, "That cost looks too high."),
  markupPct: z.number().finite().min(0).max(500).nullable(),
  notes: z.string().trim().max(1000).nullable(),
  source: z.enum(SOURCES),
  sourceRef: z.string().max(100).nullable(),
});
export type EditLine = z.infer<typeof EditLine>;

export const EditGroup = z.object({
  name: z.string().trim().min(1, "Every stage needs a name.").max(120, "Keep stage names under 120 characters."),
  lines: z.array(EditLine).max(200),
});
export type EditGroup = z.infer<typeof EditGroup>;

export const EstimateEditInput = z.object({
  title: z.string().trim().min(1, "Give the estimate a title.").max(200, "Keep the title under 200 characters."),
  groups: z.array(EditGroup).min(1, "An estimate needs at least one stage.").max(50),
});
export type EstimateEditInput = z.infer<typeof EstimateEditInput>;

/** "1,250", "22.9" → a quantity. Null when it isn't a non-negative number with up to three decimals. */
export function parseQty(input: string): number | null {
  const s = input.replace(/[\s,]/g, "");
  if (!/^\d*\.?\d{0,3}$/.test(s) || s === "" || s === ".") return null;
  return Number(s);
}
