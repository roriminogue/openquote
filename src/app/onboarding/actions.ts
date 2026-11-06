"use server";

import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { getAuthUser } from "@/lib/auth";
import { canCreateBusiness } from "@/lib/signups";

const Onboarding = z.object({
  name: z.string().trim().min(1),
  business: z.string().trim().min(1),
});

// Creates the organisation and attaches the signed-in user as its owner.
export async function createOrganisation(formData: FormData) {
  const user = await getAuthUser();
  if (!user?.email) redirect("/login");

  // Checked here too, not just on the page: the action can be called directly.
  const allowed = await canCreateBusiness(user.email);
  if (!allowed.ok) redirect(`/onboarding?error=${encodeURIComponent(allowed.reason)}`);

  const input = Onboarding.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect("/onboarding?error=Fill+in+both+fields");

  const created = await db.transaction(async (tx) => {
    // One business at a time, then check again under the lock: on a fresh install, two people signing up at the
    // same moment must not both become "the first business".
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('openquote:create-business'))`);
    const stillAllowed = await canCreateBusiness(user.email!, tx);
    if (!stillAllowed.ok) return stillAllowed;

    const [org] = await tx
      .insert(schema.organisations)
      .values({ name: input.data.business, email: user.email })
      .returning({ id: schema.organisations.id });
    await tx
      .insert(schema.users)
      .values({ id: user.id, orgId: org.id, name: input.data.name, email: user.email!, role: "owner" });
    return { ok: true as const };
  });
  if (!created.ok) redirect(`/onboarding?error=${encodeURIComponent(created.reason)}`);
  redirect("/estimates");
}
