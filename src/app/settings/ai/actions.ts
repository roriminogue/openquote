"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireMember } from "@/lib/auth";
import { decryptSecret, encryptSecret, lastFour } from "@/lib/crypto";
import { PROVIDER_INFO, PROVIDERS, checkModel, listModels } from "@/lib/ai/providers";

export type SaveState = {
  status: "idle" | "error" | "saved";
  message?: string;
  /** Models the key can use, for the model pickers. */
  models?: string[];
};

const optional = z
  .string()
  .trim()
  .transform((v) => v || null);

const Input = z.object({
  provider: z.enum(PROVIDERS),
  apiKey: optional,
  baseUrl: optional.pipe(z.url({ protocol: /^https?$/ }).nullable()),
  smartModel: optional,
  fastModel: optional,
  transcription: z.enum(["off", "openai", "local"]),
});

// Throws for plain members; the UI hides these actions from them.
async function requireAdmin() {
  const member = await requireMember();
  if (member.role === "member") throw new Error("Only owners and admins can change AI settings.");
  return member;
}

/** Checks the key against the provider (free model-list call), validates the models, then saves. */
export async function saveAiSettings(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const member = await requireMember();
  if (member.role === "member") return { status: "error", message: "Only owners and admins can change AI settings." };
  const field = (name: string) => String(formData.get(name) ?? "");
  const parsed = Input.safeParse({
    provider: field("provider"),
    apiKey: field("apiKey"),
    baseUrl: field("baseUrl"),
    smartModel: field("smartModel"),
    fastModel: field("fastModel"),
    transcription: field("transcription") || "off",
  });
  if (!parsed.success) return { status: "error", message: "Check the base URL: it must start with http(s)://." };
  const input = parsed.data;
  const info = PROVIDER_INFO[input.provider];

  const [existing] = await db.select().from(schema.aiSettings).where(eq(schema.aiSettings.orgId, member.orgId));
  const keepExistingKey = !input.apiKey && existing?.provider === input.provider && !!existing.apiKeyCiphertext;
  const envKey = info.envKey ? process.env[info.envKey] : undefined;
  const keyToTest =
    input.apiKey ?? (keepExistingKey ? decryptSecret(existing!.apiKeyCiphertext!) : null) ?? envKey ?? null;

  const listed = await listModels(input.provider, { apiKey: keyToTest, baseUrl: input.baseUrl });
  if (!listed.ok) return { status: "error", message: listed.error };

  const smartModel = input.smartModel ?? info.defaultSmartModel;
  const fastModel = input.fastModel ?? info.defaultFastModel;
  if (!smartModel || !fastModel) {
    return { status: "error", message: "Key works. Now choose a smart and a fast model.", models: listed.models };
  }
  const modelProblem = checkModel(smartModel, listed.models) ?? checkModel(fastModel, listed.models);
  if (modelProblem) return { status: "error", message: modelProblem, models: listed.models };

  const key = input.apiKey
    ? { apiKeyCiphertext: encryptSecret(input.apiKey), apiKeyLast4: lastFour(input.apiKey) }
    : keepExistingKey
      ? {}
      : { apiKeyCiphertext: null, apiKeyLast4: null };
  const values = {
    provider: input.provider,
    baseUrl: info.defaultBaseUrl ? input.baseUrl : null,
    smartModel: input.smartModel,
    fastModel: input.fastModel,
    transcription: input.transcription,
    updatedAt: new Date(),
    ...key,
  };
  await db
    .insert(schema.aiSettings)
    .values({ orgId: member.orgId, ...values })
    .onConflictDoUpdate({ target: schema.aiSettings.orgId, set: values });

  refresh();
  return { status: "saved", message: "Saved. The key works and both models are available.", models: listed.models };
}

export async function removeAiKey() {
  const member = await requireAdmin();
  await db
    .update(schema.aiSettings)
    .set({ apiKeyCiphertext: null, apiKeyLast4: null, updatedAt: new Date() })
    .where(eq(schema.aiSettings.orgId, member.orgId));
  refresh();
}
