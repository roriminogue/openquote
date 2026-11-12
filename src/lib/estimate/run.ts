import { NoObjectGeneratedError } from "ai";
import { resolveAiConfig } from "@/lib/ai/config";
import { costMicroUsd } from "@/lib/ai/cost";
import { AiNotConfiguredError, languageModel } from "@/lib/ai/models";
import { requireMember } from "@/lib/auth";
import { estimateTotals } from "@/lib/pricing";
import { getProject } from "@/lib/projects";
import type { PartialDraft } from "@/app/estimates/new/new-estimate";
import { generateEstimateDraft } from "./generate";
import { createPendingEstimate, deleteEstimate, loadGenerationInputs, saveGeneratedEstimate } from "./persist";
import { priceDraft, scopeWithCalculators, validateEstimate } from "./price";
import { buildGenerationPrompt } from "./prompt";

// Quick-mode estimate generation (SPEC.md §5), on the phone. Reports progress through `on`:
//   estimate {id, number}    the draft row exists
//   partial  {draft}         the model's output so far (unvalidated), at most every 200 ms
// and resolves with the finished estimate, or { error } with a message for the person.

const PARTIAL_INTERVAL_MS = 200;

export type GenerateInput = { description: string; projectId?: string | null; siteAddress?: string | null };
export type GenerateResult =
  | { ok: true; estimateId: string; totals: ReturnType<typeof estimateTotals>; warnings: string[] }
  | { ok: false; error: string; aborted?: boolean };

export async function generateEstimate(
  input: GenerateInput,
  on: { estimate?: (e: { id: string; number: number }) => void; partial?: (draft: PartialDraft) => void },
  signal?: AbortSignal,
): Promise<GenerateResult> {
  const description = input.description.trim();
  if (description.length < 10) return { ok: false, error: "Describe the job in a bit more detail." };
  if (description.length > 8000) return { ok: false, error: "That description is too long. Keep it under 8,000 characters." };
  const member = await requireMember();

  const config = await resolveAiConfig(member.orgId);
  let model;
  try {
    model = languageModel(config, "smart");
  } catch (e) {
    if (e instanceof AiNotConfiguredError) return { ok: false, error: e.message };
    throw e;
  }

  // A project supplies the client and, unless one was typed, the site address.
  const project = input.projectId ? await getProject(member.orgId, input.projectId) : null;
  if (input.projectId && !project) return { ok: false, error: "That project wasn't found." };
  const siteAddress = input.siteAddress?.trim() || project?.siteAddress || null;

  const { org, rateRules, instructions } = await loadGenerationInputs(member.orgId);
  // Short aliases (R1, R2…) are easier for the model to copy exactly than UUIDs.
  const aliased = rateRules.map((r, i) => ({ ...r, id: `R${i + 1}`, dbId: r.id }));
  const { system, prompt } = buildGenerationPrompt({ description, siteAddress, org, rateRules: aliased, instructions });

  const estimate = await createPendingEstimate(member.orgId, {
    description,
    projectId: project?.id ?? null,
    clientId: project?.clientId ?? null,
    siteAddress,
  });
  on.estimate?.(estimate);

  let lastPartialAt = 0;
  try {
    const { draft, usage } = await generateEstimateDraft({
      model: model.model,
      system,
      prompt,
      abortSignal: signal,
      onPartial: (partial) => {
        const now = Date.now();
        if (now - lastPartialAt < PARTIAL_INTERVAL_MS) return;
        lastPartialAt = now;
        on.partial?.(partial as PartialDraft);
      },
    });

    const groups = priceDraft(draft, aliased).map((g) => ({
      ...g,
      lines: g.lines.map((l) => ({
        ...l,
        sourceRef: l.source === "rate_rule" ? (aliased.find((r) => r.id === l.sourceRef)?.dbId ?? null) : l.sourceRef,
      })),
    }));

    await saveGeneratedEstimate({
      orgId: member.orgId,
      estimateId: estimate.id,
      draft: { ...draft, scope: scopeWithCalculators(draft) },
      groups,
      usage: {
        provider: config.provider,
        model: model.modelId,
        ...usage,
        costMicroUsd: costMicroUsd(model.modelId, usage.inputTokens, usage.outputTokens),
      },
    });

    return {
      ok: true,
      estimateId: estimate.id,
      totals: estimateTotals(groups, { org, gstRatePct: org.gstRegistered ? org.gstRate : 0 }),
      warnings: validateEstimate(description, groups),
    };
  } catch (e) {
    // Don't leave an empty draft behind.
    await deleteEstimate(estimate.id).catch(() => {});
    if (signal?.aborted) return { ok: false, error: "Stopped.", aborted: true };
    return { ok: false, error: describeGenerationError(e) };
  }
}

function describeGenerationError(e: unknown): string {
  const status = (e as { statusCode?: number })?.statusCode;
  if (status === 401 || status === 403) return "Your AI provider rejected the key. Check it in Settings → AI.";
  if (status === 402) return "Your AI balance has run out. Top it up, or use your own key in Settings → AI.";
  if (status === 429) return "Your AI provider is rate limiting requests. Try again in a minute.";
  if (NoObjectGeneratedError.isInstance(e)) {
    return "The model's answer didn't match the estimate format. Try again, or try a stronger model.";
  }
  if (e instanceof TypeError) return "Couldn't reach the AI. Check your signal and try again.";
  // Name and message only: provider errors can carry the request body (the prompt).
  console.error("Estimate generation failed:", (e as Error)?.name, (e as Error)?.message);
  return "Generating the estimate failed. Try again.";
}
