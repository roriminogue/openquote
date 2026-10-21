import { and, eq, gte, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { db, schema } from "@/db";
import { requireMember } from "@/lib/auth";
import { PROVIDER_INFO } from "@/lib/ai/providers";
import { removeAiKey } from "./actions";
import { Money } from "@/components/money";
import { GroupTitle, PageTitle, Panel, Row, Rows } from "@/components/ui";
import { AiSettingsForm, RemoveKey } from "./form";

export const metadata: Metadata = { title: "AI settings" };

export default function AiSettingsPage() {
  return (
    <div className="max-w-[56rem]">
      <PageTitle
        title="AI settings"
        description="OpenQuote uses your own AI provider account. Your key is encrypted, never leaves the server, and you pay the provider directly."
      />
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
      <section aria-label="This month" className="mt-8 grid grid-cols-3 gap-0">
        {[
          ["Calls this month", usage.calls.toLocaleString("en-AU"), "Estimates and edits"],
          ["Tokens", usage.tokens.toLocaleString("en-AU"), "Input and output"],
          ["Cost", <span key="c" className="whitespace-nowrap">US<Money cents={Math.round(Number(usage.costMicroUsd) / 10_000)} /></span>, "Billed by your provider"],
        ].map(([label, value, sub], i) => (
          <div key={i} className="border-l border-border px-3 first:border-l-0 first:pl-0 sm:px-6">
            <p className="text-xs font-medium text-ink-3">{label}</p>
            <p className="figures mt-1.5 text-xl font-semibold leading-none text-ink sm:text-title">{value}</p>
            <p className="mt-2 hidden text-xs text-ink-3 sm:block">{sub}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="current" className="mt-10">
        <GroupTitle id="current">Current setup</GroupTitle>
        <Panel>
          <Rows>
            <Row label="Provider" hint="Where estimates are written.">
              <span className="text-sm font-medium">{info.label}</span>
            </Row>
            <Row label="API key" hint="Encrypted at rest. Only the last four characters are shown.">
              <span className="flex items-center gap-3 text-sm font-medium">
                <span className={keyStatus.startsWith("No key") ? "text-accent-ink" : undefined}>{keyStatus}</span>
                {canEdit && settings?.apiKeyLast4 && <RemoveKey action={removeAiKey} />}
              </span>
            </Row>
          </Rows>
        </Panel>
      </section>

      <section aria-labelledby="change" className="mt-10">
      <GroupTitle id="change">Provider and key</GroupTitle>
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
        <p className="text-sm text-ink-3">Only owners and admins can change AI settings.</p>
      )}
      </section>
    </>
  );
}
