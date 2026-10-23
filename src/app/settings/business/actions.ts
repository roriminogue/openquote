"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, schema } from "@/db";
import { requireMember } from "@/lib/auth";
import { BusinessInput } from "@/lib/business-schema";
import { supabaseEnv } from "@/lib/supabase/env";

export type BusinessState = { status: "idle" | "error" | "saved"; message?: string; field?: string };

const ADMIN_ONLY = "Only owners and admins can change business details.";

export async function saveBusiness(_prev: BusinessState, formData: FormData): Promise<BusinessState> {
  const member = await requireMember();
  if (member.role === "member") return { status: "error", message: ADMIN_ONLY };
  const f = (k: string) => String(formData.get(k) ?? "");
  const parsed = BusinessInput.safeParse({
    name: f("name"),
    abn: f("abn"),
    email: f("email"),
    phone: f("phone"),
    address: f("address"),
    termsMd: f("termsMd"),
    quoteValidDays: f("quoteValidDays"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { status: "error", message: issue.message, field: String(issue.path[0] ?? "") };
  }
  await db.update(schema.organisations).set(parsed.data).where(eq(schema.organisations.id, member.orgId));
  refresh();
  return { status: "saved", message: "Saved. Your quotes will show these details." };
}

/** Stores the public URL of a logo the browser uploaded to this business's folder in the logos bucket. */
export async function setLogo(url: string | null): Promise<{ ok: boolean; error?: string }> {
  const member = await requireMember();
  if (member.role === "member") return { ok: false, error: ADMIN_ONLY };
  if (url !== null) {
    const prefix = `${supabaseEnv().url}/storage/v1/object/public/logos/${member.orgId}/`;
    if (!url.startsWith(prefix)) return { ok: false, error: "That logo didn't upload properly. Try again." };
  }
  await db.update(schema.organisations).set({ logoUrl: url }).where(eq(schema.organisations.id, member.orgId));
  refresh();
  return { ok: true };
}
