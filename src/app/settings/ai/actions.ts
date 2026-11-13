import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireMember } from "@/lib/auth";
import { deleteApiKey, getApiKey, lastFour, setApiKey } from "@/lib/ai/keys";
import { PROVIDER_INFO, PROVIDERS, checkModel, listModels, providerBaseUrl } from "@/lib/ai/providers";

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
  baseUrl: optional,
  smartModel: optional,
  fastModel: optional,
  transcription: z.enum(["off", "openai", "local"]),
});

/** Checks the key against the provider (free model-list call), validates the models, then saves. */
export async function saveAiSettings(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const member = await requireMember();
  const field = (name: string) => String(formData.get(name) ?? "");
  const parsed = Input.safeParse({
    provider: field("provider"),
    apiKey: field("apiKey"),
    baseUrl: field("baseUrl"),
    smartModel: field("smartModel"),
    fastModel: field("fastModel"),
    transcription: field("transcription") || "off",
  });
  if (!parsed.success) return { status: "error", message: "Check the settings and try again." };
  const input = parsed.data;
  const info = PROVIDER_INFO[input.provider];

  const savedKey = info.needsKey ? await getApiKey(input.provider) : null;
  const keyToTest = input.apiKey ?? savedKey;
  const baseUrl = input.provider === "ollama" ? input.baseUrl : null;

  const listed = await listModels(input.provider, { apiKey: keyToTest, baseUrl: providerBaseUrl(input.provider, baseUrl) });
  if (!listed.ok) return { status: "error", message: listed.error };

  const smartModel = input.smartModel ?? info.defaultSmartModel;
  const fastModel = input.fastModel ?? info.defaultFastModel;
  if (!smartModel || !fastModel) {
    return { status: "error", message: "Key works. Now choose a smart and a fast model.", models: listed.models };
  }
  const modelProblem = checkModel(smartModel, listed.models) ?? checkModel(fastModel, listed.models);
  if (modelProblem) return { status: "error", message: modelProblem, models: listed.models };

  if (input.apiKey) await setApiKey(input.provider, input.apiKey);
  const values = {
    provider: input.provider,
    baseUrl,
    apiKeyLast4: info.needsKey && keyToTest ? lastFour(keyToTest) : null,
    smartModel: input.smartModel,
    fastModel: input.fastModel,
    transcription: input.transcription,
    updatedAt: new Date(),
  };
  await db
    .insert(schema.aiSettings)
    .values({ orgId: member.orgId, ...values })
    .onConflictDoUpdate({ target: schema.aiSettings.orgId, set: values });

  return {
    status: "saved",
    message: input.provider === "publik" ? "Saved. Quotes use your publik plan." : "Saved. The key works and both models are available.",
    models: listed.models,
  };
}

export async function removeAiKey() {
  const member = await requireMember();
  const [row] = await db.select().from(schema.aiSettings).where(eq(schema.aiSettings.orgId, member.orgId));
  if (!row) return;
  await deleteApiKey(row.provider);
  await db
    .update(schema.aiSettings)
    .set({ apiKeyLast4: null, updatedAt: new Date() })
    .where(eq(schema.aiSettings.orgId, member.orgId));
}
