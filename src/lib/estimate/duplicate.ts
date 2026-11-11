import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatEstimateNo } from "@/lib/pricing";

/**
 * Copies an estimate into a new draft with the next number: same client, project, site, wording, stages and
 * lines (with each line's own markup), and none of the old one's history, link or answer. For pricing changes to
 * a quote the client has already accepted, which stays locked. Returns null when it isn't this business's.
 */
export async function duplicateEstimate(orgId: string, estimateId: string) {
  return db.transaction(async (tx) => {
    const [from] = await tx
      .select()
      .from(schema.estimates)
      .where(and(eq(schema.estimates.id, estimateId), eq(schema.estimates.orgId, orgId)));
    if (!from) return null;

    const [{ number }] = await tx
      .update(schema.organisations)
      .set({ nextEstimateNo: sql`${schema.organisations.nextEstimateNo} + 1` })
      .where(eq(schema.organisations.id, orgId))
      .returning({ number: sql<number>`${schema.organisations.nextEstimateNo} - 1` });

    const [copy] = await tx
      .insert(schema.estimates)
      .values({
        orgId,
        number,
        clientId: from.clientId,
        projectId: from.projectId,
        title: from.title,
        siteAddress: from.siteAddress,
        description: from.description,
        generationMode: from.generationMode,
        markupPct: from.markupPct,
        gstExempt: from.gstExempt,
        summary: from.summary,
        scope: from.scope,
        assumptions: from.assumptions,
        exclusions: from.exclusions,
        alternatives: from.alternatives,
      })
      .returning({ id: schema.estimates.id, number: schema.estimates.number });

    const groups = await tx
      .select()
      .from(schema.lineGroups)
      .where(eq(schema.lineGroups.estimateId, from.id))
      .orderBy(asc(schema.lineGroups.sort));
    const lines = groups.length
      ? await tx
          .select()
          .from(schema.lineItems)
          .where(
            inArray(
              schema.lineItems.groupId,
              groups.map((g) => g.id),
            ),
          )
          .orderBy(asc(schema.lineItems.sort))
      : [];

    const snapshot: { title: string; groups: { name: string; lines: unknown[] }[] } = { title: from.title, groups: [] };
    for (const g of groups) {
      const [group] = await tx
        .insert(schema.lineGroups)
        .values({ estimateId: copy.id, name: g.name, sort: g.sort })
        .returning({ id: schema.lineGroups.id });
      const own = lines
        .filter((l) => l.groupId === g.id)
        .map((l) => ({
          description: l.description,
          type: l.type,
          qty: l.qty,
          unit: l.unit,
          unitCostCents: l.unitCostCents,
          markupPct: l.markupPct,
          sort: l.sort,
          notes: l.notes,
          source: l.source,
          sourceRef: l.sourceRef,
        }));
      if (own.length) await tx.insert(schema.lineItems).values(own.map((l) => ({ ...l, groupId: group.id })));
      snapshot.groups.push({ name: g.name, lines: own });
    }

    await tx.insert(schema.estimateVersions).values({
      estimateId: copy.id,
      version: 1,
      createdBy: "user",
      reason: `Copied from ${formatEstimateNo(from.number)}`,
      snapshot,
    });
    return copy;
  });
}
