"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { getAuthUser } from "@/lib/auth";

const Onboarding = z.object({
  name: z.string().trim().min(1),
  business: z.string().trim().min(1),
});

// Creates the organisation and attaches the signed-in user as its owner.
export async function createOrganisation(formData: FormData) {
  const user = await getAuthUser();
  if (!user?.email) redirect("/login");

  const input = Onboarding.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect("/onboarding?error=Fill+in+both+fields");

  await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(schema.organisations)
      .values({ name: input.data.business, email: user.email })
      .returning({ id: schema.organisations.id });
    await tx
      .insert(schema.users)
      .values({ id: user.id, orgId: org.id, name: input.data.name, email: user.email!, role: "owner" });
  });
  redirect("/");
}
