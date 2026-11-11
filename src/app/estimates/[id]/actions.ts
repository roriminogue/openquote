"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { requireMember } from "@/lib/auth";
import type { DetailLevel } from "@/lib/proposal-schema";
import { shareEstimate } from "@/lib/proposals";
import { duplicateEstimate } from "@/lib/estimate/duplicate";

const LEVELS: DetailLevel[] = ["total", "groups", "full"];

/** Creates (or reuses) the client link for an estimate and marks it sent. Returns the full URL to share. */
export async function shareQuote(estimateId: string, detail: DetailLevel): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const member = await requireMember();
  if (!/^[0-9a-f-]{36}$/i.test(estimateId) || !LEVELS.includes(detail)) return { ok: false, error: "That estimate couldn't be found." };
  const shared = await shareEstimate(member.orgId, estimateId, detail);
  if (!shared) return { ok: false, error: "That estimate couldn't be found." };
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  refresh();
  return { ok: true, url: `${proto}://${host}/p/${shared.token}` };
}

/** Copies an estimate (usually an accepted one, which is locked) into a new draft to price changes in. */
export async function duplicateQuote(estimateId: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const member = await requireMember();
  if (!/^[0-9a-f-]{36}$/i.test(estimateId)) return { ok: false, error: "That estimate couldn't be found." };
  const copy = await duplicateEstimate(member.orgId, estimateId);
  if (!copy) return { ok: false, error: "That estimate couldn't be found." };
  return { ok: true, id: copy.id };
}
