import { and, eq, gte, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { db, schema } from "@/db";
import { requireMember } from "@/lib/auth";
import { PROVIDER_INFO } from "@/lib/ai/providers";
import { removeAiKey } from "./actions";
import { Money } from "@/components/money";
import { Rule } from "@/components/ui";
import { AiSettingsForm, RemoveKey } from "./form";

export const metadata: Metadata = { title: "AI settings" };

export default function AiSettingsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.01em]">AI settings</h1>
      <p className="mt-2 text-[1.0625rem] text-ink-2">
        OpenQuote uses your own AI provider account. Your key is encrypted, never leaves the server, and you pay the
        provider directly.
      </p>
      <Suspense>
        <AiSettings />
      </Suspense>
    </div>
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
      <dl className="mt-8 divide-y divide-hairline border-y border-hairline text-[1.0625rem]">
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-ink-2">Provider</dt>
          <dd className="font-semibold">{info.label}</dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
          <dt className="text-ink-2">Key</dt>
          <dd className="flex items-baseline gap-3 font-semibold">
            <span className={keyStatus.startsWith("No key") ? "text-mark" : undefined}>{keyStatus}</span>
            {canEdit && settings?.apiKeyLast4 && (
              <RemoveKey action={removeAiKey} />
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-ink-2">This month</dt>
          <dd className="figures text-right font-semibold">
            {usage.calls} {usage.calls === 1 ? "call" : "calls"} · {usage.tokens.toLocaleString("en-AU")} tokens ·{" "}
            <span className="whitespace-nowrap">
              US<Money cents={Math.round(Number(usage.costMicroUsd) / 10_000)} />
            </span>
          </dd>
        </div>
      </dl>

      <Rule className="mt-12" />
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
        <p className="mt-8 text-ink-3">Only owners and admins can change AI settings.</p>
      )}
    </>
  );
}
