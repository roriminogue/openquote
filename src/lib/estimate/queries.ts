import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { estimateTotals, linePriceCents, resolveMarkupPct, type MarkupSettings } from "@/lib/pricing";

// Read models for the estimate screens. Drizzle bypasses RLS, so every query filters by orgId explicitly.

type Org = typeof schema.organisations.$inferSelect;
type Line = typeof schema.lineItems.$inferSelect;
type Group = typeof schema.lineGroups.$inferSelect;
type Estimate = typeof schema.estimates.$inferSelect;

/** `markupPct` is the resolved markup; `defaultMarkupPct` is what the line would get without its own override. */
export type LineView = Line & { markupPct: number; defaultMarkupPct: number; priceCents: number; costCents: number };
export type GroupView = { id: string; name: string; lines: LineView[]; costCents: number; priceCents: number };

export function markupSettings(org: Org): MarkupSettings {
  return {
    defaultMarkupPct: org.defaultMarkupPct,
    markupMaterialsPct: org.markupMaterialsPct,
    markupLabourPct: org.markupLabourPct,
    markupSubbiePct: org.markupSubbiePct,
    markupOtherPct: org.markupOtherPct,
  };
}

export function gstRatePct(org: Org) {
  return org.gstRegistered ? org.gstRate : 0;
}

function buildView(org: Org, estimate: Estimate, groups: Group[], lines: Line[]) {
  const markup = markupSettings(org);
  const views: GroupView[] = [...groups]
    .sort((a, b) => a.sort - b.sort)
    .map((g) => {
      const gl = lines
        .filter((l) => l.groupId === g.id)
        .sort((a, b) => a.sort - b.sort)
        .map((l) => {
          const markupPct = resolveMarkupPct(l, markup, estimate.markupPct);
          const defaultMarkupPct = resolveMarkupPct({ ...l, markupPct: null }, markup, estimate.markupPct);
          return { ...l, markupPct, defaultMarkupPct, costCents: Math.round(l.qty * l.unitCostCents), priceCents: linePriceCents(l, markupPct) };
        });
      return {
        id: g.id,
        name: g.name,
        lines: gl,
        costCents: gl.reduce((s, l) => s + l.costCents, 0),
        priceCents: gl.reduce((s, l) => s + l.priceCents, 0),
      };
    });
  const totals = estimateTotals(views, {
    org: markup,
    estimateMarkupPct: estimate.markupPct,
    gstRatePct: gstRatePct(org),
    gstExempt: estimate.gstExempt,
  });
  return { groups: views, totals };
}

export async function getOrg(orgId: string) {
  const [org] = await db.select().from(schema.organisations).where(eq(schema.organisations.id, orgId));
  return org;
}

/** True once the business has priced anything; the new-estimate page drops its explainer after that. */
export async function hasEstimates(orgId: string) {
  const [row] = await db
    .select({ id: schema.estimates.id })
    .from(schema.estimates)
    .where(eq(schema.estimates.orgId, orgId))
    .limit(1);
  return !!row;
}

export async function listEstimates(orgId: string, filter: { projectId?: string; clientId?: string } = {}) {
  const org = await getOrg(orgId);
  const estimates = await db
    .select()
    .from(schema.estimates)
    .where(
      and(
        eq(schema.estimates.orgId, orgId),
        filter.projectId ? eq(schema.estimates.projectId, filter.projectId) : undefined,
        filter.clientId ? eq(schema.estimates.clientId, filter.clientId) : undefined,
      ),
    )
    .orderBy(desc(schema.estimates.createdAt))
    .limit(100);
  if (!estimates.length) return [];

  const ids = estimates.map((e) => e.id);
  const groups = await db.select().from(schema.lineGroups).where(inArray(schema.lineGroups.estimateId, ids));
  const lines = groups.length
    ? await db
        .select()
        .from(schema.lineItems)
        .where(inArray(schema.lineItems.groupId, groups.map((g) => g.id)))
    : [];

  const clientIds = [...new Set(estimates.map((e) => e.clientId).filter((x): x is string => !!x))];
  const clientNames = new Map(
    clientIds.length
      ? (
          await db
            .select({ id: schema.clients.id, name: schema.clients.name })
            .from(schema.clients)
            .where(and(eq(schema.clients.orgId, orgId), inArray(schema.clients.id, clientIds)))
        ).map((c) => [c.id, c.name])
      : [],
  );

  return estimates.map((e) => {
    const eg = groups.filter((g) => g.estimateId === e.id);
    const groupIds = new Set(eg.map((g) => g.id));
    const view = buildView(org, e, eg, lines.filter((l) => groupIds.has(l.groupId)));
    return {
      estimate: e,
      clientName: e.clientId ? (clientNames.get(e.clientId) ?? null) : null,
      lineCount: view.groups.reduce((s, g) => s + g.lines.length, 0),
      ...view,
    };
  });
}

export async function getEstimate(orgId: string, estimateId: string) {
  const [estimate] = await db
    .select()
    .from(schema.estimates)
    .where(and(eq(schema.estimates.id, estimateId), eq(schema.estimates.orgId, orgId)));
  if (!estimate) return null;

  const org = await getOrg(orgId);
  const groups = await db
    .select()
    .from(schema.lineGroups)
    .where(eq(schema.lineGroups.estimateId, estimateId))
    .orderBy(asc(schema.lineGroups.sort));
  const lines = groups.length
    ? await db
        .select()
        .from(schema.lineItems)
        .where(inArray(schema.lineItems.groupId, groups.map((g) => g.id)))
    : [];
  return { estimate, org, context: await estimateContext(orgId, estimate), ...buildView(org, estimate, groups, lines) };
}

export type EstimateContext = { projectName: string | null; projectNumber: number | null; clientName: string | null };

/** The project and client an estimate belongs to, for headers. */
async function estimateContext(orgId: string, e: Estimate): Promise<EstimateContext> {
  const [project] = e.projectId
    ? await db
        .select({ name: schema.projects.name, number: schema.projects.number })
        .from(schema.projects)
        .where(and(eq(schema.projects.id, e.projectId), eq(schema.projects.orgId, orgId)))
    : [];
  const [client] = e.clientId
    ? await db
        .select({ name: schema.clients.name })
        .from(schema.clients)
        .where(and(eq(schema.clients.id, e.clientId), eq(schema.clients.orgId, orgId)))
    : [];
  return { projectName: project?.name ?? null, projectNumber: project?.number ?? null, clientName: client?.name ?? null };
}
