import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Button, Field, Input, Notice } from "@/components/ui";
import { db, schema } from "@/db";
import { getAuthUser } from "@/lib/auth";
import { canCreateBusiness } from "@/lib/signups";
import { createOrganisation } from "./actions";
import { ONBOARDING_ERRORS, messageFor } from "@/lib/auth-messages";

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
  if (!allowed.ok) {
    return (
      <div className="space-y-4">
        <Notice tone="info">{allowed.reason}</Notice>
        <form action="/auth/signout" method="post">
          <Button variant="secondary" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    );
  }

  return (
    <form action={createOrganisation} className="space-y-5">
      <Field id="name" label="Your name">
        <Input id="name" name="name" required autoComplete="name" />
      </Field>
      <Field id="business" label="Business name">
        <Input id="business" name="business" required autoComplete="organization" />
      </Field>
      <Button className="w-full">
        Create business
      </Button>
      {error && <Notice tone="error">{error}</Notice>}
    </form>
  );
}
