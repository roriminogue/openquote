import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { DisplayOptions } from "@/db/schema";

// Pure rules for sending quotes to clients (no DB imports, so they can be unit tested).

/** What the client sees, as three simple presets over DisplayOptions. */
export const DETAIL_LEVELS = [
  ["total", "Total only", "One price with the scope."],
  ["groups", "Stage totals", "Each stage and what's in it, with a price per stage."],
  ["full", "Every line", "Every line with quantities and prices."],
] as const;
export type DetailLevel = (typeof DETAIL_LEVELS)[number][0];

export function displayOptionsFor(detail: DetailLevel): DisplayOptions {
  return {
    detail,
    showScope: true,
    showQuantities: detail === "full",
    showRates: false,
    showItemPrices: detail === "full",
    showGroupTotals: detail !== "total",
    pricesIncGst: true,
  };
}

export const DEFAULT_DISPLAY: DisplayOptions = displayOptionsFor("groups");

/** An unguessable token for the public quote link (/p/<token>): 24 random bytes, URL-safe. */
export function newProposalToken() {
  return randomBytes(24).toString("base64url");
}

export function isProposalToken(token: string) {
  return /^[A-Za-z0-9_-]{32}$/.test(token);
}

/** The last day the quote holds, counting the day it was sent as day one. */
export function validUntil(sentAt: Date, days: number) {
  const d = new Date(sentAt);
  d.setDate(d.getDate() + Math.max(0, days - 1));
  return d;
}

export const AcceptInput = z.object({
  name: z.string().trim().min(2, "Type your full name to accept.").max(120),
  email: z
    .string()
    .trim()
    .max(200)
    .transform((v) => v || null)
    .pipe(z.email("That email doesn't look right.").nullable()),
  agree: z.literal(true, { message: "Tick the box to confirm you accept the quote and its terms." }),
});

export const DeclineInput = z.object({
  reason: z
    .string()
    .trim()
    .max(1000)
    .transform((v) => v || null),
});
