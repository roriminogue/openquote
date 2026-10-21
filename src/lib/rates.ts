import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { BusinessContextInput, MarkupInput, RateInput } from "./rates-schema";

// Rates and pricing settings. Drizzle bypasses RLS, so every query filters by orgId explicitly.

export * from "./rates-schema";

export type RateRow = { id: string; title: string; rateCents: number; unit: string; type: "labour" | "material" };

const rateColumns = {
  id: schema.rateRules.id,
  title: schema.rateRules.title,
  rateCents: schema.rateRules.rateCents,
  unit: schema.rateRules.unit,
  type: schema.rateRules.type,
};

export async function listRates(orgId: string): Promise<RateRow[]> {
  return db
    .select(rateColumns)
    .from(schema.rateRules)
    .where(eq(schema.rateRules.orgId, orgId))
    .orderBy(asc(schema.rateRules.type), asc(schema.rateRules.title));
}

export async function createRate(orgId: string, input: RateInput): Promise<RateRow> {
  const [row] = await db
    .insert(schema.rateRules)
    .values({ orgId, title: input.title, rateCents: input.rate, unit: input.unit, type: input.type })
    .returning(rateColumns);
  return row;
}

/** Null when the rate doesn't exist in this organisation. */
export async function updateRate(orgId: string, id: string, input: RateInput): Promise<RateRow | null> {
  const [row] = await db
    .update(schema.rateRules)
    .set({ title: input.title, rateCents: input.rate, unit: input.unit, type: input.type })
    .where(and(eq(schema.rateRules.id, id), eq(schema.rateRules.orgId, orgId)))
    .returning(rateColumns);
  return row ?? null;
}

export async function deleteRate(orgId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(schema.rateRules)
    .where(and(eq(schema.rateRules.id, id), eq(schema.rateRules.orgId, orgId)))
    .returning({ id: schema.rateRules.id });
  return rows.length > 0;
}

export async function updateMarkup(orgId: string, input: MarkupInput) {
  await db.update(schema.organisations).set(input).where(eq(schema.organisations.id, orgId));
}

export async function updateBusinessContext(orgId: string, input: BusinessContextInput) {
  await db.update(schema.organisations).set(input).where(eq(schema.organisations.id, orgId));
}
