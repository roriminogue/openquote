import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { publikKey } from "@/lib/publik";
import { getApiKey } from "./keys";
import { PROVIDER_INFO, providerBaseUrl, type Provider } from "./providers";

export type AiConfig = {
  provider: Provider;
  apiKey: string | null;
  baseUrl: string | null;
  smartModel: string | null;
  fastModel: string | null;
  /** "business": ready to use. "none": AI is off until a key is added (or the person signs in with publik). */
  source: "business" | "none";
};

/** Which provider, key and models the business's AI calls use (SPEC.md §7a). Publik unless changed in Settings → AI. */
export async function resolveAiConfig(orgId: string): Promise<AiConfig> {
  const [row] = await db.select().from(schema.aiSettings).where(eq(schema.aiSettings.orgId, orgId));
  const provider = row?.provider ?? "publik";
  const info = PROVIDER_INFO[provider];
  const models = {
    smartModel: row?.smartModel ?? info.defaultSmartModel,
    fastModel: row?.fastModel ?? info.defaultFastModel,
  };
  const baseUrl = providerBaseUrl(provider, row?.baseUrl);

  const apiKey = provider === "publik" ? await publikKey() : info.needsKey ? await getApiKey(provider) : null;
  const ready = provider === "publik" || info.needsKey ? !!apiKey : !!row;
  return { provider, apiKey, baseUrl, ...models, source: ready ? "business" : "none" };
}
