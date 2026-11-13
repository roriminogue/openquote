import { eq } from "drizzle-orm";
import { refresh } from "@/lib/data";
import { db, schema } from "@/db";
import { requireMember } from "@/lib/auth";
import { BusinessInput } from "@/lib/business-schema";

export type BusinessState = { status: "idle" | "error" | "saved"; message?: string; field?: string };

const ADMIN_ONLY = "Only owners and admins can change business details.";

export async function saveBusiness(_prev: BusinessState, formData: FormData): Promise<BusinessState> {
  const member = await requireMember();
  if (member.role === "member") return { status: "error", message: ADMIN_ONLY };
  const f = (k: string) => String(formData.get(k) ?? "");
  const parsed = BusinessInput.safeParse({
    ownerName: f("ownerName"),
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

/** Stores the logo (a data: URL made by the business form), or removes it. */
export async function setLogo(url: string | null): Promise<{ ok: boolean; error?: string }> {
  const member = await requireMember();
  if (member.role === "member") return { ok: false, error: ADMIN_ONLY };
  if (url !== null && !/^data:image\/(png|jpeg|webp);base64,/.test(url)) return { ok: false, error: "That logo couldn't be saved. Try again." };
  await db.update(schema.organisations).set({ logoUrl: url }).where(eq(schema.organisations.id, member.orgId));
  refresh();
  return { ok: true };
}
