"use server";

import { refresh } from "next/cache";
import { AcceptInput, DeclineInput } from "@/lib/proposal-schema";
import { decide } from "@/lib/proposals";

export type DecisionState = { status: "idle" | "error" | "done"; message?: string; field?: string };

// Public actions: anyone holding the link can answer, once. The token is the only authority.

export async function acceptQuote(token: string, _prev: DecisionState, formData: FormData): Promise<DecisionState> {
  const parsed = AcceptInput.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    agree: formData.get("agree") === "on",
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { status: "error", message: issue.message, field: String(issue.path[0] ?? "") };
  }
  const ok = await decide(token, { type: "accepted", name: parsed.data.name, email: parsed.data.email });
  if (!ok) return { status: "error", message: "This quote has already been answered." };
  refresh();
  return { status: "done" };
}

export async function declineQuote(token: string, _prev: DecisionState, formData: FormData): Promise<DecisionState> {
  const parsed = DeclineInput.safeParse({ reason: String(formData.get("reason") ?? "") });
  if (!parsed.success) return { status: "error", message: "Keep the reason under 1,000 characters." };
  const ok = await decide(token, { type: "declined", reason: parsed.data.reason });
  if (!ok) return { status: "error", message: "This quote has already been answered." };
  refresh();
  return { status: "done" };
}
