import { requireMember } from "@/lib/auth";
import { duplicateEstimate } from "@/lib/estimate/duplicate";
import { clearDecision, markDecision } from "@/lib/proposals";

/** Records the client's answer, as they gave it (text, email, phone). Accepting locks the quote. */
export async function markQuote(estimateId: string, type: "accepted" | "declined"): Promise<{ ok: boolean }> {
  const member = await requireMember();
  return { ok: await markDecision(member.orgId, estimateId, type) };
}

/** Undoes an answer marked by mistake. */
export async function unmarkQuote(estimateId: string): Promise<{ ok: boolean }> {
  const member = await requireMember();
  return { ok: await clearDecision(member.orgId, estimateId) };
}

/** Copies an estimate (usually an accepted one, which is locked) into a new draft to price changes in. */
export async function duplicateQuote(estimateId: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const member = await requireMember();
  const copy = await duplicateEstimate(member.orgId, estimateId);
  if (!copy) return { ok: false, error: "That estimate couldn't be found." };
  return { ok: true, id: copy.id };
}
