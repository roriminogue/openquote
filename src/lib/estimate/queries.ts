import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { estimateTotals, linePriceCents, resolveMarkupPct, type MarkupSettings } from "@/lib/pricing";

// Read models for the estimate screens. Drizzle bypasses RLS, so every query filters by orgId explicitly.

type Org = typeof schema.organisations.$inferSelect;
type Line = typeof schema.lineItems.$inferSelect;
type Group = typeof schema.lineGroups.$inferSelect;
type Estimate = typeof schema.estimates.$inferSelect;

export type LineView = Line & { markupPct: number; priceCents: number; costCents: number };
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
          return { ...l, markupPct, costCents: Math.round(l.qty * l.unitCostCents), priceCents: linePriceCents(l, markupPct) };
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

export async function listEstimates(orgId: string) {
  const org = await getOrg(orgId);
  const estimates = await db
    .select()
    .from(schema.estimates)
    .where(eq(schema.estimates.orgId, orgId))
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

  return estimates.map((e) => {
    const eg = groups.filter((g) => g.estimateId === e.id);
    const groupIds = new Set(eg.map((g) => g.id));
    const view = buildView(org, e, eg, lines.filter((l) => groupIds.has(l.groupId)));
    return { estimate: e, lineCount: view.groups.reduce((s, g) => s + g.lines.length, 0), ...view };
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
  return { estimate, org, ...buildView(org, estimate, groups, lines) };
}
