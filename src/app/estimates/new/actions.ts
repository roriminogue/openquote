"use server";

import { eq } from "drizzle-orm";
import { generateText } from "ai";
import { db, schema } from "@/db";
import { resolveAiConfig } from "@/lib/ai/config";
import { costMicroUsd } from "@/lib/ai/cost";
import { dailyLimit, overLimit } from "@/lib/ai/limits";
import { AiNotConfiguredError, languageModel } from "@/lib/ai/models";
import { usageLast24h } from "@/lib/ai/usage";
import { getAuthUser } from "@/lib/auth";
import { PRICE_BOOK } from "@/lib/price-book";
import { listRates } from "@/lib/rates";
import { changedWords, tidyLooksSafe } from "@/lib/voice/text";
import { TIDY_MAX_CHARS, TIDY_SYSTEM, cleanTidyReply, tidyPrompt } from "@/lib/voice/tidy";
import { voiceHints } from "@/lib/voice/terms";

export type TidyResult = { ok: true; text: string; fixed: string[] } | { ok: false };

/**
 * Fixes misheard trade words in dictated text with the business's own AI provider (whichever it is), using its
 * fast model. Anything unexpected (no AI set up, over the daily cap, a provider error, an answer that rewrote the
 * job) returns { ok: false } and the person keeps exactly what they said.
 */
export async function tidyDictation(heard: string): Promise<TidyResult> {
  // Never redirect from here: a sign-in page would throw away what the person just said. Signed out (or not in
  // a business), they simply keep the words as heard.
  const user = await getAuthUser();
  if (!user) return { ok: false };
  const [member] = await db.select({ orgId: schema.users.orgId }).from(schema.users).where(eq(schema.users.id, user.id));
  if (!member) return { ok: false };
  const text = String(heard ?? "").trim();
  if (text.length < 3 || text.length > TIDY_MAX_CHARS) return { ok: false };

  const config = await resolveAiConfig(member.orgId);
  let model;
  try {
    model = languageModel(config, "fast");
  } catch (e) {
    if (e instanceof AiNotConfiguredError) return { ok: false };
    throw e;
  }
  // On the install's shared key, tidy-ups have their own (generous) daily cap.
  if (config.source === "instance") {
    const limit = dailyLimit(process.env.AI_DAILY_LIMIT);
    if (overLimit(await usageLast24h(member.orgId, "tidy_dictation"), limit === null ? null : limit * 5)) return { ok: false };
  }

  const rates = await listRates(member.orgId);
  const vocabulary = [...voiceHints(rates.map((r) => r.title)), ...PRICE_BOOK.items.map((i) => i.name)];

  try {
    const result = await generateText({
      model: model.model,
      system: TIDY_SYSTEM,
      prompt: tidyPrompt(text, vocabulary),
      maxOutputTokens: 4000,
      abortSignal: AbortSignal.timeout(20_000),
    });
    await db.insert(schema.aiUsage).values({
      orgId: member.orgId,
      operation: "tidy_dictation",
      provider: config.provider,
      model: model.modelId,
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
      costMicroUsd: costMicroUsd(model.modelId, result.usage.inputTokens ?? 0, result.usage.outputTokens ?? 0),
    });
    const tidied = cleanTidyReply(result.text);
    if (!tidyLooksSafe(text, tidied)) return { ok: false };
    return { ok: true, text: tidied, fixed: changedWords(text, tidied) };
  } catch (e) {
    // Name and message only: provider errors can carry the request body.
    console.error("Dictation tidy-up failed:", (e as Error)?.name, (e as Error)?.message);
    return { ok: false };
  }
}
