"use server";

import { refresh } from "next/cache";
import { requireMember } from "@/lib/auth";
import {
  ClientInput,
  createClient,
  createProject,
  listProjects,
  updateClient,
  updateProject,
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

function firstIssue(error: { issues: { message: string; path: PropertyKey[] }[] }) {
  const issue = error.issues[0];
  return { ok: false as const, error: issue.message, field: String(issue.path[0] ?? "") };
}

export async function editClient(clientId: string, raw: unknown): Promise<ActionResult<ClientOption>> {
  const member = await requireMember();
  const parsed = ClientInput.safeParse(raw);
  if (!parsed.success) return firstIssue(parsed.error);
  const c = await updateClient(member.orgId, clientId, parsed.data);
  if (!c) return { ok: false, error: "That client no longer exists." };
  refresh();
  return {
    ok: true,
    value: { id: c.id, kind: c.kind, name: c.name, contactName: c.contactName, email: c.email, phone: c.phone, address: c.address },
  };
}

export async function editProject(projectId: string, raw: unknown): Promise<ActionResult<{ id: string }>> {
  const member = await requireMember();
  const parsed = ProjectInput.safeParse(raw);
  if (!parsed.success) return firstIssue(parsed.error);
  try {
    const p = await updateProject(member.orgId, projectId, parsed.data);
    if (!p) return { ok: false, error: "That project no longer exists." };
    refresh();
    return { ok: true, value: { id: p.id } };
  } catch {
    return { ok: false, error: "That client couldn't be found. Choose another.", field: "clientId" };
  }
}
