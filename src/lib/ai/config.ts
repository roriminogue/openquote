import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { decryptSecret } from "@/lib/crypto";
import { PROVIDER_INFO, providerBaseUrl, type Provider } from "./providers";

export type AiConfig = {
  provider: Provider;
  apiKey: string | null;
  baseUrl: string | null;
  smartModel: string | null;
  fastModel: string | null;
  /** Where the key came from: the business's own settings, the instance env, or nowhere (AI disabled). */
  source: "business" | "instance" | "none";
};

/** Server-only. Resolves which provider, key and models an organisation's AI calls use (SPEC.md §7a). */
export async function resolveAiConfig(orgId: string): Promise<AiConfig> {
  const [row] = await db.select().from(schema.aiSettings).where(eq(schema.aiSettings.orgId, orgId));
  const provider = row?.provider ?? "anthropic";
  const info = PROVIDER_INFO[provider];
  const models = {
    smartModel: row?.smartModel ?? info.defaultSmartModel,
    fastModel: row?.fastModel ?? info.defaultFastModel,
  };
  // Never a saved address: a shared key must only ever go to the provider itself.
  const baseUrl = providerBaseUrl(provider);

  if (row?.apiKeyCiphertext) {
    return { provider, apiKey: decryptSecret(row.apiKeyCiphertext), baseUrl, ...models, source: "business" };
  }
  if (!info.needsKey && row) return { provider, apiKey: null, baseUrl, ...models, source: "business" };

  const envKey = info.envKey ? process.env[info.envKey] : undefined;
  if (envKey) return { provider, apiKey: envKey, baseUrl, ...models, source: "instance" };
  return { provider, apiKey: null, baseUrl, ...models, source: "none" };
}
