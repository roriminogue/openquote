import { z } from "zod";

// Business details that appear on every quote (pure, for tests and forms).

const optional = (max: number, message?: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => v || null);

/** A phone number: digits, spaces, + ( ) - only, with at least 6 digits. Blank is fine. */
export const phoneField = (max = 40) =>
  optional(max).refine(
    (v) => v === null || (/^[\d\s+()-]+$/.test(v) && v.replace(/\D/g, "").length >= 6),
    "That phone number doesn't look right.",
  );

export const BusinessInput = z.object({
  ownerName: z.string().trim().max(80, "Keep your name under 80 characters.").default(""),
  name: z.string().trim().min(1, "Enter your business name.").max(120, "Keep the business name under 120 characters."),
  abn: optional(20)
    .transform((v) => (v ? v.replace(/\s/g, "") : null))
    .refine((v) => v === null || /^\d{11}$/.test(v), "An ABN is 11 digits."),
  email: optional(200).pipe(z.email("That email doesn't look right.").nullable()),
  phone: phoneField(),
  address: optional(300),
  termsMd: optional(5000, "Keep the terms under 5,000 characters."),
  quoteValidDays: z.coerce
    .number({ message: "Enter a number of days." })
    .int("Use whole days.")
    .min(1, "Quotes need to be valid for at least a day.")
    .max(365, "Use a year or less."),
});
export type BusinessInput = z.infer<typeof BusinessInput>;

/** ABN as people read it: 12 345 678 901. */
export function formatAbn(abn: string | null) {
  if (!abn || !/^\d{11}$/.test(abn)) return abn;
  return `${abn.slice(0, 2)} ${abn.slice(2, 5)} ${abn.slice(5, 8)} ${abn.slice(8)}`;
}

export const DEFAULT_TERMS = `Prices include GST where shown. This quote is based on the scope described; any changes or unforeseen conditions will be priced and agreed before work goes ahead.
A deposit may be requested before work starts. The balance is due on completion.
Materials remain our property until paid for in full.`;
