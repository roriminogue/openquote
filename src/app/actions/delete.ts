import { and, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireMember } from "@/lib/auth";

// Deleting records. Owners and admins only, always scoped to their own business (Drizzle bypasses RLS).
// What goes with what: an estimate takes its stages, lines, versions and client link with it; a project's
// estimates stay (unlinked from the project); a client can't go while they still have projects.

export type DeleteResult = { ok: true } | { ok: false; error: string };

const ADMIN_ONLY: DeleteResult = { ok: false, error: "Only owners and admins can delete." };
const isId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

async function admin() {
  const member = await requireMember();
  return member.role === "member" ? null : member;
}

export async function deleteEstimateRecord(estimateId: string): Promise<DeleteResult> {
  const member = await admin();
  if (!member) return ADMIN_ONLY;
  if (!isId(estimateId)) return { ok: false, error: "That estimate couldn't be found." };
  const rows = await db
    .delete(schema.estimates)
    .where(and(eq(schema.estimates.id, estimateId), eq(schema.estimates.orgId, member.orgId)))
    .returning({ id: schema.estimates.id });
  return rows.length ? { ok: true } : { ok: false, error: "That estimate was already deleted." };
}

export async function deleteProjectRecord(projectId: string): Promise<DeleteResult> {
  const member = await admin();
  if (!member) return ADMIN_ONLY;
  if (!isId(projectId)) return { ok: false, error: "That project couldn't be found." };
  const rows = await db
    .delete(schema.projects)
    .where(and(eq(schema.projects.id, projectId), eq(schema.projects.orgId, member.orgId)))
    .returning({ id: schema.projects.id });
  return rows.length ? { ok: true } : { ok: false, error: "That project was already deleted." };
}

export async function deleteClientRecord(clientId: string): Promise<DeleteResult> {
  const member = await admin();
  if (!member) return ADMIN_ONLY;
  if (!isId(clientId)) return { ok: false, error: "That client couldn't be found." };
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.projects)
    .where(and(eq(schema.projects.clientId, clientId), eq(schema.projects.orgId, member.orgId)));
  if (n > 0) {
    return { ok: false, error: `This client has ${n === 1 ? "a project" : `${n} projects`}. Delete ${n === 1 ? "it" : "them"} first.` };
  }
  const rows = await db
    .delete(schema.clients)
    .where(and(eq(schema.clients.id, clientId), eq(schema.clients.orgId, member.orgId)))
    .returning({ id: schema.clients.id });
  return rows.length ? { ok: true } : { ok: false, error: "That client was already deleted." };
}
