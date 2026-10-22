"use server";

import { refresh } from "next/cache";
import { requireMember } from "@/lib/auth";
import { saveEstimateEdits } from "@/lib/estimate/edit";
import { EstimateEditInput } from "@/lib/estimate/edit-schema";

export type SaveEditResult = { ok: true } | { ok: false; error: string; path?: (string | number)[] };

export async function saveEstimate(estimateId: string, raw: unknown): Promise<SaveEditResult> {
  const member = await requireMember();
  if (!/^[0-9a-f-]{36}$/i.test(estimateId)) return { ok: false, error: "That estimate couldn't be found." };
  const parsed = EstimateEditInput.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, path: issue.path.filter((p): p is string | number => typeof p !== "symbol") };
  }
  if (!(await saveEstimateEdits(member.orgId, estimateId, parsed.data))) {
    return { ok: false, error: "That estimate couldn't be found. It may have been deleted." };
  }
  refresh();
  return { ok: true };
}
