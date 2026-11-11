import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { db, schema } from "@/db";
import { getAuthUser } from "@/lib/auth";
import { ONBOARDING_ERRORS, messageFor } from "@/lib/auth-messages";
import { canCreateBusiness } from "@/lib/signups";
import { BusinessSetupForm, SignupsClosed } from "./form";

export const metadata: Metadata = { title: "Set up your business" };

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <AuthFrame title="Set up your business" intro="This goes on your quotes. You can change it later.">
      <Suspense>
        <OnboardingForm searchParams={searchParams} />
      </Suspense>
    </AuthFrame>
  );
}

async function OnboardingForm({ searchParams }: Pick<PageProps<"/onboarding">, "searchParams">) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  const [member] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
  if (member) redirect("/estimates");

  const error = messageFor(ONBOARDING_ERRORS, (await searchParams).error);
  const allowed = await canCreateBusiness(user.email ?? "");
  if (!allowed.ok) return <SignupsClosed reason={allowed.reason} />;
  return <BusinessSetupForm error={error} />;
}
