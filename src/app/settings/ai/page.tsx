import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Text } from "@astryxdesign/core/Text";
import { and, eq, gte, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { db, schema } from "@/db";
import { requireMember } from "@/lib/auth";
import { PROVIDER_INFO } from "@/lib/ai/providers";
import { startOfMonth } from "@/lib/dates";
import { removeAiKey } from "./actions";
import { Money } from "@/components/money";
import { Intro, SettingsSection } from "../parts";
import { AiSettingsForm, RemoveKey } from "./form";

export const metadata: Metadata = { title: "AI settings" };

export default function AiSettingsPage() {
  return (
    <>
      <Intro>
        OpenQuote AU uses your own AI provider account. Your key is encrypted, never leaves the server, and you pay the
        provider directly.
      </Intro>
      <Suspense
        fallback={
          <div className="mt-8" aria-busy="true" aria-label="Loading">
            <Skeleton height={240} radius={4} />
          </div>
        }
      >
        <AiSettings />
      </Suspense>
    </>
  );
}

async function AiSettings() {
  const member = await requireMember();
  const [settings] = await db.select().from(schema.aiSettings).where(eq(schema.aiSettings.orgId, member.orgId));
  const provider = settings?.provider ?? "anthropic";
  const info = PROVIDER_INFO[provider];
  const hasInstanceKey = !!(info.envKey && process.env[info.envKey]);
  const canEdit = member.role !== "member";

  // "This month" starts at midnight on the 1st in Australian eastern time, not in UTC.
  const monthStart = startOfMonth();
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

  const stats: [string, React.ReactNode, string][] = [
    ["Calls this month", usage.calls.toLocaleString("en-AU"), "Estimates and edits"],
    ["Tokens", usage.tokens.toLocaleString("en-AU"), "Input and output"],
    [
      "Cost",
      <>
        US
        <Money cents={Math.round(Number(usage.costMicroUsd) / 10_000)} />
      </>,
      "Billed by your provider",
    ],
  ];

  return (
    <>
      <section aria-label="This month" className="mt-6 grid grid-cols-3">
        {stats.map(([label, value, sub]) => (
          <div
            key={label}
            className="min-w-0 border-l border-(--color-border) px-3 first:border-l-0 first:pl-0 sm:px-6"
          >
            <Text as="p" display="block" type="supporting" weight="medium">
              {label}
            </Text>
            <div className="mt-1.5">
              <Text as="p" display="block" type="large" weight="semibold" hasTabularNumbers>
                <span className="whitespace-nowrap">{value}</span>
              </Text>
            </div>
            <div className="mt-1 hidden sm:block">
              <Text as="p" display="block" type="supporting">
                {sub}
              </Text>
            </div>
          </div>
        ))}
      </section>

      <SettingsSection id="current" title="Current setup">
        <MetadataList label={{ width: 96 }}>
          <MetadataListItem label="Provider">
            <Text>{info.label}</Text>
          </MetadataListItem>
          <MetadataListItem label="API key">
            <div className="flex flex-col items-start gap-1">
              <Text color={keyStatus.startsWith("No key") ? "accent" : "primary"}>{keyStatus}</Text>
              {canEdit && settings?.apiKeyLast4 && (
                <div className="-ml-2">
                  <RemoveKey action={removeAiKey} />
                </div>
              )}
            </div>
          </MetadataListItem>
        </MetadataList>
      </SettingsSection>

      {canEdit ? (
        <AiSettingsForm
          initial={{
            provider,
            hasSavedKey: !!settings?.apiKeyLast4,
            smartModel: settings?.smartModel ?? "",
            fastModel: settings?.fastModel ?? "",
            transcription: settings?.transcription ?? "off",
          }}
        />
      ) : (
        <div className="mt-10">
          <Text as="p" display="block" type="supporting">
            Only owners and admins can change AI settings.
          </Text>
        </div>
      )}
    </>
  );
}
