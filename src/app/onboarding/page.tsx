import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { db, schema } from "@/db";
import { getAuthUser } from "@/lib/auth";
import { createOrganisation } from "./actions";

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Set up your business</h1>
      <Suspense>
        <OnboardingForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function OnboardingForm({ searchParams }: Pick<PageProps<"/onboarding">, "searchParams">) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  const [member] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
  if (member) redirect("/");

  const { error } = await searchParams;
  const input = "w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950";

  return (
    <>
      <form action={createOrganisation} className="mt-8 space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium">
            Your name
          </label>
          <input id="name" name="name" required autoComplete="name" className={input} />
        </div>
        <div className="space-y-1">
          <label htmlFor="business" className="block text-sm font-medium">
            Business name
          </label>
          <input id="business" name="business" required autoComplete="organization" className={input} />
        </div>
        <button className="w-full rounded-md bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900">
          Continue
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
    </>
  );
}
