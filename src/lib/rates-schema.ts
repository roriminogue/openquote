import { z } from "zod";

// Pure validation for rates and pricing settings, shared by the forms and the server actions (no DB imports, so
// it can be unit tested).

/** Units offered when adding a rate, stored as written here. Anything else typed in is kept as-is. */
export const RATE_UNITS = [
  ["hour", "Per hour"],
  ["day", "Per day"],
  ["each", "Each"],
  ["lm", "Per linear metre"],
  ["m2", "Per square metre"],
  ["m3", "Per cubic metre"],
  ["lot", "Per job (lot)"],
  ["bag", "Per bag"],
  ["sheet", "Per sheet"],
  ["kg", "Per kilogram"],
  ["tonne", "Per tonne"],
  ["L", "Per litre"],
] as const;

export const RATE_TYPES = [
  ["labour", "Labour"],
  ["material", "Material"],
] as const;

/** "$95", "95.5", "1,250.00" → cents. Null when it isn't a non-negative amount with at most two decimals. */
export function dollarsToCents(input: string): number | null {
  const s = input.replace(/[\s$,]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

export function centsToDollars(cents: number) {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

const money = z
  .string()
  .trim()
  .min(1, "Enter a rate.")
  .transform((v, ctx) => {
    const cents = dollarsToCents(v);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "Enter the rate in dollars, like 95 or 22.90." });
      return z.NEVER;
    }
    if (cents > 10_000_000) {
      ctx.addIssue({ code: "custom", message: "That rate looks too high. Check the amount." });
      return z.NEVER;
    }
    return cents;
  });

export const RateInput = z.object({
  title: z.string().trim().min(1, "Give the rate a name, like Qualified carpenter.").max(120, "Keep the name under 120 characters."),
  rate: money,
  unit: z.string().trim().min(1, "Choose a unit.").max(20, "Keep the unit short, like hour or lm."),
  type: z.enum(["labour", "material"], { message: "Choose labour or material." }),
});
export type RateInput = z.infer<typeof RateInput>;

const pctField = (label: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const n = Number(v.replace(/%$/, ""));
      if (!Number.isFinite(n) || n < 0 || n > 500) {
        ctx.addIssue({ code: "custom", message: `${label} must be a percentage from 0 to 500.` });
        return z.NEVER;
      }
      return Math.round(n * 100) / 100;
    });

export const MarkupInput = z.object({
  defaultMarkupPct: pctField("Default markup").pipe(z.number({ message: "Enter a default markup, like 20." })),
  markupMaterialsPct: pctField("Materials markup"),
  markupLabourPct: pctField("Labour markup"),
  markupSubbiePct: pctField("Subcontractor markup"),
  markupOtherPct: pctField("Other markup"),
  gstRegistered: z.boolean(),
});
export type MarkupInput = z.infer<typeof MarkupInput>;

export const FINISH_LEVELS = [
  ["basic", "Basic", "Budget materials, functional finish."],
  ["standard", "Standard", "Good quality materials, a tidy finish."],
  ["premium", "Premium", "Top-end materials, a high-end finish."],
] as const;

export const BusinessContextInput = z.object({
  trades: z
    .string()
    .trim()
    .max(200, "Keep the trades list short.")
    .transform((v) =>
      v
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8),
    ),
  finishLevel: z.enum(["basic", "standard", "premium"]),
  postcode: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}$/.test(v), "Enter a 4-digit postcode.")
    .transform((v) => v || null),
});
export type BusinessContextInput = z.infer<typeof BusinessContextInput>;
