import { and, eq, gte, sql } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { db, schema } from "@/db";
import { requireMember } from "@/lib/auth";
import { PROVIDER_INFO } from "@/lib/ai/providers";
import { removeAiKey } from "./actions";
import { AiSettingsForm } from "./form";

export default function AiSettingsPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16">
      <Link href="/" className="text-sm text-zinc-500 underline">
        ← Home
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">AI settings</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        OpenQuote uses your own AI provider account. Your key is encrypted, stays on the server, and you pay the
        provider directly.
      </p>
      <Suspense>
        <AiSettings />
      </Suspense>
    </main>
  );
}

async function AiSettings() {
  const member = await requireMember();
  const [settings] = await db.select().from(schema.aiSettings).where(eq(schema.aiSettings.orgId, member.orgId));
  const provider = settings?.provider ?? "anthropic";
  const info = PROVIDER_INFO[provider];
  const hasInstanceKey = !!(info.envKey && process.env[info.envKey]);
  const canEdit = member.role !== "member";

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [usage] = await db
    .select({
      calls: sql<number>`count(*)::int`,
      tokens: sql<number>`coalesce(sum(${schema.aiUsage.inputTokens} + ${schema.aiUsage.outputTokens}), 0)::int`,
      costMicroUsd: sql<number>`coalesce(sum(${schema.aiUsage.costMicroUsd}), 0)::bigint`,
    })
    .from(schema.aiUsage)
    .where(and(eq(schema.aiUsage.orgId, member.orgId), gte(schema.aiUsage.createdAt, monthStart)));

  const keyStatus = settings?.apiKeyLast4
    ? `Your key ending ${settings.apiKeyLast4}`
    : !info.needsKey && settings
      ? "No key needed"
      : hasInstanceKey
        ? "Using this install's shared key"
        : "No key yet: AI features are off";

  return (
    <>
      <section className="mt-8 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        <dl className="space-y-1">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Provider</dt>
            <dd>{info.label}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Key</dt>
            <dd>{keyStatus}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">This month</dt>
            <dd className="tabular-nums">
              {usage.calls} calls · {usage.tokens.toLocaleString("en-AU")} tokens · US$
              {(Number(usage.costMicroUsd) / 1_000_000).toFixed(2)}
            </dd>
          </div>
        </dl>
        {canEdit && settings?.apiKeyLast4 && (
          <form action={removeAiKey} className="mt-3">
            <button className="text-red-600 underline">Remove key</button>
          </form>
        )}
      </section>

      {canEdit ? (
        <AiSettingsForm
          initial={{
            provider,
            hasSavedKey: !!settings?.apiKeyLast4,
            baseUrl: settings?.baseUrl ?? "",
            smartModel: settings?.smartModel ?? "",
            fastModel: settings?.fastModel ?? "",
            transcription: settings?.transcription ?? "off",
          }}
        />
      ) : (
        <p className="mt-8 text-sm text-zinc-500">Only owners and admins can change AI settings.</p>
      )}
    </>
  );
}
