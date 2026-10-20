import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Provider } from "@/lib/ai/providers";
import type { EstimateDraft } from "./draft";
import type { PricedGroup } from "./price";

/** Everything generation needs about the org, read once up front. */
export async function loadGenerationInputs(orgId: string) {
  const [org] = await db.select().from(schema.organisations).where(eq(schema.organisations.id, orgId));
  const rateRules = await db
    .select()
    .from(schema.rateRules)
    .where(eq(schema.rateRules.orgId, orgId))
    .orderBy(desc(schema.rateRules.createdAt));
  const instructions = await db
    .select({ text: schema.aiInstructions.text })
    .from(schema.aiInstructions)
    .where(eq(schema.aiInstructions.orgId, orgId))
    .orderBy(schema.aiInstructions.createdAt);
  return { org, rateRules, instructions: instructions.map((i) => i.text) };
}

/** Creates the empty draft estimate (so the client gets its id and number straight away). */
export async function createPendingEstimate(
  orgId: string,
  input: { description: string; clientId?: string | null; projectId?: string | null; siteAddress?: string | null },
) {
  return db.transaction(async (tx) => {
    // Atomically take the next estimate number for this org.
    const [{ number }] = await tx
      .update(schema.organisations)
      .set({ nextEstimateNo: sql`${schema.organisations.nextEstimateNo} + 1` })
      .where(eq(schema.organisations.id, orgId))
      .returning({ number: sql<number>`${schema.organisations.nextEstimateNo} - 1` });
    const [estimate] = await tx
      .insert(schema.estimates)
      .values({
        orgId,
        number,
        description: input.description,
        clientId: input.clientId ?? null,
        projectId: input.projectId ?? null,
        siteAddress: input.siteAddress ?? null,
        generationMode: "quick",
      })
      .returning({ id: schema.estimates.id, number: schema.estimates.number });
    return estimate;
  });
}

export async function deleteEstimate(estimateId: string) {
  await db.delete(schema.estimates).where(eq(schema.estimates.id, estimateId));
}

/** Writes the generated content, lines, version 1 and the usage row in one transaction. */
export async function saveGeneratedEstimate(input: {
  orgId: string;
  estimateId: string;
  draft: EstimateDraft;
  groups: PricedGroup[];
  usage: { provider: Provider; model: string; inputTokens: number; outputTokens: number; costMicroUsd: number | null };
}) {
  const { orgId, estimateId, draft, groups, usage } = input;
  await db.transaction(async (tx) => {
    await tx
      .update(schema.estimates)
      .set({
        title: draft.title,
        summary: draft.summary,
        scope: draft.scope,
        assumptions: draft.assumptions,
        exclusions: draft.exclusions,
        alternatives: draft.alternatives,
        currentVersion: 1,
        updatedAt: new Date(),
      })
      .where(eq(schema.estimates.id, estimateId));

    const insertedGroups = await tx
      .insert(schema.lineGroups)
      .values(groups.map((g, i) => ({ estimateId, name: g.name, sort: i })))
      .returning({ id: schema.lineGroups.id, sort: schema.lineGroups.sort });
    const groupIds = insertedGroups.sort((a, b) => a.sort - b.sort).map((g) => g.id);

    await tx.insert(schema.lineItems).values(
      groups.flatMap((g, gi) =>
        g.lines.map((l, li) => ({
          groupId: groupIds[gi],
          description: l.description,
          type: l.type,
          qty: l.qty,
          unit: l.unit,
          unitCostCents: l.unitCostCents,
          sort: li,
          notes: l.notes,
          source: l.source,
          sourceRef: l.sourceRef,
        })),
      ),
    );

    await tx.insert(schema.estimateVersions).values({
      estimateId,
      version: 1,
      createdBy: "ai",
      reason: "Generated from the job description",
      snapshot: { title: draft.title, groups },
    });

    await tx.insert(schema.aiUsage).values({ orgId, estimateId, operation: "generate", ...usage });
  });
}
