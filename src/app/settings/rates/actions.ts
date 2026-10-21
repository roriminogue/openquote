"use server";

import { refresh } from "next/cache";
import type { ActionResult } from "@/app/actions/records";
import { requireMember } from "@/lib/auth";
import {
  BusinessContextInput,
  createRate,
  deleteRate,
  MarkupInput,
  RateInput,
  updateBusinessContext,
  updateMarkup,
  updateRate,
  type RateRow,
} from "@/lib/rates";

export type FormState = { status: "idle" | "error" | "saved"; message?: string; field?: string };

const ADMIN_ONLY = "Only owners and admins can change rates and pricing.";

async function requireAdmin() {
  const member = await requireMember();
  return member.role === "member" ? null : member;
}

function firstIssue(error: { issues: { message: string; path: PropertyKey[] }[] }) {
  const issue = error.issues[0];
  return { message: issue.message, field: String(issue.path[0] ?? "") };
}

export async function saveMarkup(_prev: FormState, formData: FormData): Promise<FormState> {
  const member = await requireAdmin();
  if (!member) return { status: "error", message: ADMIN_ONLY };
  const field = (name: string) => String(formData.get(name) ?? "");
  const parsed = MarkupInput.safeParse({
    defaultMarkupPct: field("defaultMarkupPct"),
    markupMaterialsPct: field("markupMaterialsPct"),
    markupLabourPct: field("markupLabourPct"),
    markupSubbiePct: field("markupSubbiePct"),
    markupOtherPct: field("markupOtherPct"),
    gstRegistered: formData.get("gstRegistered") === "on",
  });
  if (!parsed.success) return { status: "error", ...firstIssue(parsed.error) };
  await updateMarkup(member.orgId, parsed.data);
  refresh();
  return { status: "saved", message: "Saved. New estimates will use these numbers." };
}

export async function saveBusinessContext(_prev: FormState, formData: FormData): Promise<FormState> {
  const member = await requireAdmin();
  if (!member) return { status: "error", message: ADMIN_ONLY };
  const parsed = BusinessContextInput.safeParse({
    trades: String(formData.get("trades") ?? ""),
    finishLevel: String(formData.get("finishLevel") ?? "standard"),
    postcode: String(formData.get("postcode") ?? ""),
  });
  if (!parsed.success) return { status: "error", ...firstIssue(parsed.error) };
  await updateBusinessContext(member.orgId, parsed.data);
  refresh();
  return { status: "saved", message: "Saved." };
}

export async function addRate(raw: unknown): Promise<ActionResult<RateRow>> {
  const member = await requireAdmin();
  if (!member) return { ok: false, error: ADMIN_ONLY };
  const parsed = RateInput.safeParse(raw);
  if (!parsed.success) {
    const { message, field } = firstIssue(parsed.error);
    return { ok: false, error: message, field };
  }
  const row = await createRate(member.orgId, parsed.data);
  refresh();
  return { ok: true, value: row };
}

export async function editRate(id: string, raw: unknown): Promise<ActionResult<RateRow>> {
  const member = await requireAdmin();
  if (!member) return { ok: false, error: ADMIN_ONLY };
  const parsed = RateInput.safeParse(raw);
  if (!parsed.success) {
    const { message, field } = firstIssue(parsed.error);
    return { ok: false, error: message, field };
  }
  const row = await updateRate(member.orgId, id, parsed.data);
  if (!row) return { ok: false, error: "That rate no longer exists. Refresh the page." };
  refresh();
  return { ok: true, value: row };
}

export async function removeRate(id: string): Promise<ActionResult<{ id: string }>> {
  const member = await requireAdmin();
  if (!member) return { ok: false, error: ADMIN_ONLY };
  if (!(await deleteRate(member.orgId, id))) return { ok: false, error: "That rate no longer exists. Refresh the page." };
  refresh();
  return { ok: true, value: { id } };
}
