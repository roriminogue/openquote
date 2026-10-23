"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { requireMember } from "@/lib/auth";
import type { DetailLevel } from "@/lib/proposal-schema";
import { shareEstimate } from "@/lib/proposals";

const LEVELS: DetailLevel[] = ["total", "groups", "full"];

/** Creates (or reuses) the client link for an estimate and marks it sent. Returns the full URL to share. */
export async function shareQuote(estimateId: string, detail: DetailLevel): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const member = await requireMember();
  if (!/^[0-9a-f-]{36}$/i.test(estimateId) || !LEVELS.includes(detail)) return { ok: false, error: "That estimate couldn't be found." };
  const shared = await shareEstimate(member.orgId, estimateId, detail);
  if (!shared) return { ok: false, error: "That estimate couldn't be found." };
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "openquote-rust.vercel.app";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  refresh();
  return { ok: true, url: `${proto}://${host}/p/${shared.token}` };
}
