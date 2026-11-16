import { Output, streamText, type LanguageModel } from "ai";
import { EstimateDraft } from "./draft";

export type DraftUsage = { inputTokens: number; outputTokens: number };

/**
 * Claude from 4.6 on thinks before it answers. At the default (high) effort that was 10–20 s of a blank screen;
 * medium halved it in testing with an estimate just as thorough (low started dropping lines). The thinking also comes
 * back as a readable summary, which New estimate shows while it waits. Other providers and older models: no options.
 */
export function thinkingOptions(model: LanguageModel) {
  if (typeof model === "string" || !model.provider.startsWith("anthropic")) return undefined;
  if (!/^claude-(opus|sonnet|haiku|fable|mythos)-(4-[6-9]|5)/.test(model.modelId)) return undefined;
  return { anthropic: { thinking: { type: "adaptive", display: "summarized" }, effort: "medium" } } as const;
}

/**
 * Streams a structured estimate draft from the model. `onPartial` receives the partially-parsed object as it
 * grows (not schema-validated yet), `onThinking` the model's thinking summary so far (where the model gives one);
 * the returned draft is fully validated.
 */
export async function generateEstimateDraft(opts: {
  model: LanguageModel;
  system: string;
  prompt: string;
  onPartial?: (partial: unknown) => void;
  onThinking?: (summary: string) => void;
  abortSignal?: AbortSignal;
}): Promise<{ draft: EstimateDraft; usage: DraftUsage }> {
  let streamError: unknown;
  const result = streamText({
    model: opts.model,
    system: opts.system,
    prompt: opts.prompt,
    output: Output.object({ schema: EstimateDraft }),
    maxOutputTokens: 16_000,
    providerOptions: thinkingOptions(opts.model),
    abortSignal: opts.abortSignal,
    onError: ({ error }) => {
      streamError = error;
    },
  });

  let thinking = "";
  await Promise.all([
    (async () => {
      for await (const partial of result.partialOutputStream) opts.onPartial?.(partial);
    })(),
    (async () => {
      for await (const part of result.fullStream) {
        if (part.type !== "reasoning-delta" || !part.text) continue;
        thinking += part.text;
        opts.onThinking?.(thinking);
      }
    })(),
  ]);
  if (streamError) throw streamError;

  const [draft, usage] = await Promise.all([result.output, result.usage]);
  return { draft, usage: { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 } };
}
