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

const Points = z.array(z.string().trim().min(1).max(500, "Keep each point under 500 characters.")).max(40);

export const EditAlternative = z.object({
  kind: z.enum(["upgrade", "saving"]),
  title: z.string().trim().min(1, "Every option needs a title.").max(200, "Keep option titles under 200 characters."),
  detail: z.string().trim().max(1000, "Keep option details under 1,000 characters."),
});
export type EditAlternative = z.infer<typeof EditAlternative>;

// The wording fields are optional so an older caller that only sends the title and lines leaves them as they are.
export const EstimateEditInput = z.object({
  title: z.string().trim().min(1, "Give the estimate a title.").max(200, "Keep the title under 200 characters."),
  siteAddress: z.string().trim().max(300, "Keep the site address under 300 characters.").nullable().optional(),
  summary: z.string().trim().max(3000, "Keep the summary under 3,000 characters.").nullable().optional(),
  scope: Points.optional(),
  assumptions: Points.optional(),
  exclusions: Points.optional(),
  alternatives: z.array(EditAlternative).max(20).optional(),
  groups: z
    .array(EditGroup)
    .min(1, "An estimate needs at least one stage.")
    .max(50)
    .refine((gs) => gs.some((g) => g.lines.length > 0), "Add at least one line."),
});
export type EstimateEditInput = z.infer<typeof EstimateEditInput>;

/** A line as the estimate screens have it (resolved markup and all), as the editor and the save want it. */
type ViewLine = Omit<EditLine, "markupPct"> & { markupPct: number; defaultMarkupPct: number };

/**
 * The stages and lines of an estimate as an edit: only a line's own markup override is kept (the rest follow the
 * business or estimate markup), and stages left without lines are dropped.
 */
export function toEditGroups(groups: { name: string; lines: ViewLine[] }[]): EditGroup[] {
  return groups
    .filter((g) => g.lines.length > 0)
    .map((g) => ({
      name: g.name,
      lines: g.lines.map((l) => ({
        description: l.description,
        type: l.type,
        qty: l.qty,
        unit: l.unit,
        unitCostCents: l.unitCostCents,
        markupPct: l.markupPct !== l.defaultMarkupPct ? l.markupPct : null,
        notes: l.notes,
        source: l.source,
        sourceRef: l.sourceRef,
      })),
    }));
}

/** One point per line of text, as typed into a box: blank lines and leading bullets dropped. */
export function pointsFromText(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.replace(/^\s*(?:[-*•·]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);
}

/** "1,250", "22.9" → a quantity. Null when it isn't a non-negative number with up to three decimals. */
export function parseQty(input: string): number | null {
  const s = input.replace(/[\s,]/g, "");
  if (!/^\d*\.?\d{0,3}$/.test(s) || s === "" || s === ".") return null;
  return Number(s);
}
