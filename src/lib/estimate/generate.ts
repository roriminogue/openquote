import { Output, streamText, type LanguageModel } from "ai";
import { EstimateDraft } from "./draft";

export type DraftUsage = { inputTokens: number; outputTokens: number };

/**
 * Streams a structured estimate draft from the model. `onPartial` receives the partially-parsed object as it
 * grows (not schema-validated yet); the returned draft is fully validated.
 */
export async function generateEstimateDraft(opts: {
  model: LanguageModel;
  system: string;
  prompt: string;
  onPartial?: (partial: unknown) => void;
  abortSignal?: AbortSignal;
}): Promise<{ draft: EstimateDraft; usage: DraftUsage }> {
  let streamError: unknown;
  const result = streamText({
    model: opts.model,
    system: opts.system,
    prompt: opts.prompt,
    output: Output.object({ schema: EstimateDraft }),
    maxOutputTokens: 16_000,
    abortSignal: opts.abortSignal,
    onError: ({ error }) => {
      streamError = error;
    },
  });

  for await (const partial of result.partialOutputStream) opts.onPartial?.(partial);
  if (streamError) throw streamError;

  const [draft, usage] = await Promise.all([result.output, result.usage]);
  return { draft, usage: { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 } };
}
