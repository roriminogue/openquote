import { refresh } from "@/lib/data";
import { requireMember } from "@/lib/auth";
import { saveEstimateEdits } from "@/lib/estimate/edit";
import { EstimateEditInput } from "@/lib/estimate/edit-schema";
import { createRate, RateInput } from "@/lib/rates";

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
    return { ok: false, error: "This estimate can't be changed: it was deleted, or the client has already accepted it." };
  }
  refresh();
  return { ok: true };
}

export type SaveRateResult = { ok: true; id: string } | { ok: false; error: string };

/** Saves a line's price as one of the business's rates, so future estimates use it. */
export async function saveLineAsRate(raw: { title: string; cost: string; unit: string; type: string }): Promise<SaveRateResult> {
  const member = await requireMember();
  if (member.role === "member") return { ok: false, error: "Only owners and admins can add rates." };
  const parsed = RateInput.safeParse({ ...raw, title: raw.title.trim().slice(0, 120) });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const rate = await createRate(member.orgId, parsed.data);
  return { ok: true, id: rate.id };
}
