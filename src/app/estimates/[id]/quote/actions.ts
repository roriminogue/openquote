import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireMember } from "@/lib/auth";
import { refresh } from "@/lib/data";
import { DEFAULT_TERMS } from "@/lib/business-schema";

/** Saves the business's quote terms, as changed on a quote. They go on every quote, like the ones in Settings. */
export async function saveTerms(text: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const member = await requireMember();
  if (member.role === "member") return { ok: false, error: "Only owners and admins can change the terms." };
  const terms = text.trim();
  if (terms.length > 5000) return { ok: false, error: "Keep the terms under 5,000 characters." };
  await db
    .update(schema.organisations)
    // Back to the standard wording (or cleared): keep following the standard terms.
    .set({ termsMd: terms && terms !== DEFAULT_TERMS ? terms : null })
    .where(eq(schema.organisations.id, member.orgId));
  refresh();
  return { ok: true };
}
