"use server";

import { requireMember } from "@/lib/auth";
import {
  ClientInput,
  createClient,
  createProject,
  listProjects,
  ProjectInput,
  type ClientOption,
  type ProjectOption,
} from "@/lib/projects";

export type ActionResult<T> = { ok: true; value: T } | { ok: false; error: string; field?: string };

export async function addClient(raw: unknown): Promise<ActionResult<ClientOption>> {
  const member = await requireMember();
  const parsed = ClientInput.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: String(issue.path[0] ?? "") };
  }
  const c = await createClient(member.orgId, parsed.data);
  return {
    ok: true,
    value: { id: c.id, kind: c.kind, name: c.name, contactName: c.contactName, email: c.email, phone: c.phone, address: c.address },
  };
}

export async function addProject(raw: unknown): Promise<ActionResult<ProjectOption>> {
  const member = await requireMember();
  const parsed = ProjectInput.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: String(issue.path[0] ?? "") };
  }
  try {
    const p = await createProject(member.orgId, parsed.data);
    const created = (await listProjects(member.orgId)).find((x) => x.id === p.id)!;
    return { ok: true, value: created };
  } catch {
    return { ok: false, error: "That client couldn't be found. Choose another.", field: "clientId" };
  }
}
