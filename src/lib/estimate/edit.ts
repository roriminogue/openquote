import { and, eq, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { EstimateEditInput } from "./edit-schema";

/**
 * Saves a hand-edited estimate: replaces its stages and lines, bumps the version and keeps an immutable snapshot,
 * all in one transaction. Returns false when the estimate doesn't belong to this organisation, or when the client
 * has already accepted it (accepted quotes are locked).
 */
export async function saveEstimateEdits(orgId: string, estimateId: string, input: EstimateEditInput): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [estimate] = await tx
      .update(schema.estimates)
      .set({ title: input.title, currentVersion: sql`${schema.estimates.currentVersion} + 1`, updatedAt: new Date() })
      .where(and(eq(schema.estimates.id, estimateId), eq(schema.estimates.orgId, orgId), ne(schema.estimates.status, "accepted")))
      .returning({ version: schema.estimates.currentVersion });
    if (!estimate) return false;

    // Line items cascade with their groups.
    await tx.delete(schema.lineGroups).where(eq(schema.lineGroups.estimateId, estimateId));
    const groups = await tx
      .insert(schema.lineGroups)
      .values(input.groups.map((g, i) => ({ estimateId, name: g.name, sort: i })))
      .returning({ id: schema.lineGroups.id, sort: schema.lineGroups.sort });
    const groupIds = groups.sort((a, b) => a.sort - b.sort).map((g) => g.id);

    const lines = input.groups.flatMap((g, gi) =>
      g.lines.map((l, li) => ({
        groupId: groupIds[gi],
        description: l.description,
        type: l.type,
        qty: l.qty,
        unit: l.unit,
        unitCostCents: l.unitCostCents,
        markupPct: l.markupPct,
        sort: li,
        notes: l.notes || null,
        source: l.source,
        sourceRef: l.sourceRef,
      })),
    );
    if (lines.length) await tx.insert(schema.lineItems).values(lines);

    await tx.insert(schema.estimateVersions).values({
      estimateId,
      version: estimate.version,
      createdBy: "user",
      reason: "Edited by hand",
      snapshot: input,
    });
    return true;
  });
}
