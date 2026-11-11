"use server";

import { refresh } from "next/cache";
import { AcceptInput, DeclineInput } from "@/lib/proposal-schema";
import { decide, type DecideResult } from "@/lib/proposals";

export type DecisionState = { status: "idle" | "error" | "done"; message?: string; field?: string };

// Public actions: anyone holding the link can answer, once. The token is the only authority. `version` is the
// estimate version the client's page was showing.

const PROBLEM: Record<Exclude<DecideResult, "ok">, string> = {
  missing: "This quote link isn't valid any more.",
  answered: "This quote has already been answered.",
  expired: "This quote has expired. Ask the business for an updated one.",
  changed: "This quote was updated since you opened it.",
};

export async function acceptQuote(token: string, version: number, _prev: DecisionState, formData: FormData): Promise<DecisionState> {
  const parsed = AcceptInput.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    agree: formData.get("agree") === "on",
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { status: "error", message: issue.message, field: String(issue.path[0] ?? "") };
  }
  const result = await decide(token, version, { type: "accepted", name: parsed.data.name, email: parsed.data.email });
  if (result !== "ok") return { status: "error", message: PROBLEM[result], field: result === "changed" ? "version" : undefined };
  refresh();
  return { status: "done" };
}

export async function declineQuote(token: string, version: number, _prev: DecisionState, formData: FormData): Promise<DecisionState> {
  const parsed = DeclineInput.safeParse({ reason: String(formData.get("reason") ?? "") });
  if (!parsed.success) return { status: "error", message: "Keep the reason under 1,000 characters." };
  const result = await decide(token, version, { type: "declined", reason: parsed.data.reason });
  if (result !== "ok") return { status: "error", message: PROBLEM[result], field: result === "changed" ? "version" : undefined };
  refresh();
  return { status: "done" };
}
