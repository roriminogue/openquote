import { count, sql } from "drizzle-orm";
import { CheckCircle2, CircleAlert, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import journal from "../../../drizzle/meta/_journal.json";
import { Wordmark } from "@/components/app-shell";
import { buttonClass, Panel } from "@/components/ui";
import { db, schema } from "@/db";
import { getAuthUser } from "@/lib/auth";
import { KeyGenerator } from "./key-generator";

// A checklist for a fresh self-hosted install: what's configured, what isn't, and how to fix each thing in plain
// English. Shows only yes/no results, never a secret. Once a business exists, only its members see the detail.

export const metadata: Metadata = { title: "Setup", robots: { index: false, follow: false } };

type Check = { ok: boolean | "info"; title: string; detail: ReactNode };

async function tryQuery<T>(fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    return { ok: false, error: (e as Error).message.split("\n")[0].slice(0, 160) };
  }
}

export default function SetupPage() {
  return (
    <div className="flex-1 bg-subtle">
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
        <Wordmark />
        <h1 className="mt-8 font-display text-title font-medium leading-8">Set up OpenQuote</h1>
        <Suspense fallback={<div className="mt-8 h-80 animate-pulse rounded-[10px] bg-hover" aria-busy="true" />}>
          <Checks />
        </Suspense>
      </main>
    </div>
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
    if (!user) {
      return (
        <Panel className="mt-8 px-5 py-5">
          <p className="text-sm text-ink-2">This OpenQuote is set up. Sign in to see its setup details.</p>
          <Link href="/login" className={buttonClass("primary", "md", "mt-4")}>
            Sign in
          </Link>
        </Panel>
      );
    }
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
          OpenQuote signs people in with a 6-digit code. In Supabase → Authentication → Emails, put{" "}
          <Code>{"{{ .Token }}"}</Code> in the Magic link and Confirm sign up templates (the README has the exact text).
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
      <p className="mt-1 text-sm text-ink-3">Fix anything marked below, redeploy, then refresh this page.</p>
      <Panel className="mt-8">
        <ul className="divide-y divide-dashed divide-border px-4 sm:px-5">
          {checks.map((c) => (
            <li key={c.title} className="flex gap-3 py-4">
              {c.ok === "info" ? (
                <Info className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
              ) : c.ok ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
              ) : (
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden />
              )}
              <div className="min-w-0 text-sm">
                <p className="font-medium text-ink">
                  {c.title}
                  {c.ok === false && <span className="sr-only"> (needs attention)</span>}
                </p>
                <div className="mt-0.5 text-ink-3">{c.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
      {ready && (
        <Panel className="mt-6 px-5 py-5">
          <p className="font-medium">{businesses?.ok && businesses.value > 0 ? "All set." : "Ready. Create your business next."}</p>
          <p className="mt-1 text-sm text-ink-3">
            Sign in with your email, create your business, then add your AI key and rates in Settings.
          </p>
          <Link href="/login" className={buttonClass("primary", "md", "mt-4")}>
            Go to sign in
          </Link>
        </Panel>
      )}
    </>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-subtle px-1 py-0.5 font-mono text-[0.8125rem] text-ink">{children}</code>;
}
