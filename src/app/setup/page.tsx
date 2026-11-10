import { count, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import journal from "../../../drizzle/meta/_journal.json";
import { db, schema } from "@/db";
import { getAuthUser } from "@/lib/auth";
import { CheckList, ChecksLoading, Code, ReadyNotice, SetupFrame, SignedOutNotice, type Check } from "./check-list";
import { KeyGenerator } from "./key-generator";

// A checklist for a fresh self-hosted install: what's configured, what isn't, and how to fix each thing in plain
// English. Shows only yes/no results, never a secret. Once a business exists, only its members see the detail.

export const metadata: Metadata = { title: "Setup", robots: { index: false, follow: false } };

async function tryQuery<T>(fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    return { ok: false, error: (e as Error).message.split("\n")[0].slice(0, 160) };
  }
}

export default function SetupPage() {
  return (
    <SetupFrame>
      <Suspense fallback={<ChecksLoading />}>
        <Checks />
      </Suspense>
    </SetupFrame>
  );
}

async function Checks() {
  await connection();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const encKey = process.env.ENCRYPTION_KEY;
  const encOk = !!encKey && Buffer.from(encKey, "base64").length === 32;

  const dbOk = process.env.DATABASE_URL ? await tryQuery(() => db.execute(sql`select 1`)) : null;
  const applied = dbOk?.ok ? await tryQuery(async () => (await db.execute(sql`select count(*)::int as n from drizzle.__drizzle_migrations`))[0] as { n: number }) : null;
  const buckets = dbOk?.ok
    ? await tryQuery(async () => (await db.execute(sql`select id from storage.buckets where id in ('logos','attachments','documents')`)).length)
    : null;
  const businesses = applied?.ok ? await tryQuery(async () => (await db.select({ n: count() }).from(schema.organisations))[0].n) : null;
  const expected = journal.entries.length;

  // After the first business exists, keep the details to its members.
  if (businesses?.ok && businesses.value > 0) {
    const user = await getAuthUser();
    if (!user) return <SignedOutNotice />;
  }

  const checks: Check[] = [
    {
      ok: !!supabaseUrl && !!supabaseKey,
      title: "Supabase project connected",
      detail:
        supabaseUrl && supabaseKey ? (
          "Connected."
        ) : (
          <>
            In Vercel → your project → Settings → Environment Variables, add <Code>NEXT_PUBLIC_SUPABASE_URL</Code> and{" "}
            <Code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</Code>. Both are in Supabase → your project → Connect.
          </>
        ),
    },
    {
      ok: !!dbOk?.ok,
      title: "Database reachable",
      detail: !process.env.DATABASE_URL ? (
        <>
          Add <Code>DATABASE_URL</Code>: in Supabase → Connect, copy the <b>Transaction pooler</b> string and put your
          database password in it.
        </>
      ) : dbOk && !dbOk.ok ? (
        <>Couldn&rsquo;t connect: {dbOk.error}. Check the password in <Code>DATABASE_URL</Code> and that you used the pooler string.</>
      ) : (
        "Connected."
      ),
    },
    {
      ok: !!applied?.ok && applied.value.n >= expected,
      title: "Database tables set up",
      detail: applied?.ok ? (
        applied.value.n >= expected ? (
          `All ${expected} setup steps applied.`
        ) : (
          `${applied.value.n} of ${expected} setup steps applied. Redeploy the production site in Vercel and it will finish setting up.`
        )
      ) : (
        "Not set up yet. Once the database is reachable, redeploy the production site in Vercel: it sets up the tables automatically."
      ),
    },
    {
      ok: buckets?.ok ? buckets.value === 3 : false,
      title: "File storage ready",
      detail: buckets?.ok && buckets.value === 3 ? "Logo and attachment storage exist." : "Created with the database tables. Redeploy once the tables step is green.",
    },
    {
      ok: encOk,
      title: "Encryption key set",
      detail: encOk ? (
        "AI keys you save are encrypted."
      ) : (
        <>
          Add <Code>ENCRYPTION_KEY</Code> in Vercel. It encrypts the AI keys businesses save. Generate one here, copy it,
          paste it in, and keep it safe (changing it later means re-entering AI keys).
          <KeyGenerator />
        </>
      ),
    },
    {
      ok: "info",
      title: "Sign-in emails show a code",
      detail: (
        <>
          OpenQuote AU signs people in with a 6-digit code. In Supabase → Authentication → Emails, connect your own email
          service under SMTP Settings, then paste the code template from the README into the Magic link and Confirm sign
          up templates. Until then, emails carry a sign-in link that works in the same browser.
        </>
      ),
    },
    {
      ok: "info",
      title: "AI",
      detail: process.env.ANTHROPIC_API_KEY
        ? "An instance-wide Anthropic key is set. Businesses can still add their own in Settings → AI."
        : "Each business adds its own AI key in Settings → AI after signing in. You pay the AI provider directly.",
    },
  ];

  const ready = checks.every((c) => c.ok !== false);
  return (
    <>
      <CheckList checks={checks} />
      {ready && <ReadyNotice hasBusiness={!!businesses?.ok && businesses.value > 0} />}
    </>
  );
}
