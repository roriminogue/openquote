import { NoObjectGeneratedError } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { resolveAiConfig } from "@/lib/ai/config";
import { costMicroUsd } from "@/lib/ai/cost";
import { dailyLimit, overLimit } from "@/lib/ai/limits";
import { usageLast24h } from "@/lib/ai/usage";
import { AiNotConfiguredError, languageModel } from "@/lib/ai/models";
import { getAuthUser } from "@/lib/auth";
import { generateEstimateDraft } from "@/lib/estimate/generate";
import {
  createPendingEstimate,
  deleteEstimate,
  loadGenerationInputs,
  saveGeneratedEstimate,
} from "@/lib/estimate/persist";
import { priceDraft, scopeWithCalculators, validateEstimate } from "@/lib/estimate/price";
import { buildGenerationPrompt } from "@/lib/estimate/prompt";
import { estimateTotals } from "@/lib/pricing";
import { getProject } from "@/lib/projects";

const Body = z.object({
  description: z.string().trim().min(10, "Describe the job in a bit more detail.").max(8000),
  projectId: z.uuid().nullish(),
  siteAddress: z.string().trim().max(300).nullish(),
});

const PARTIAL_INTERVAL_MS = 200;

/**
 * Quick-mode estimate generation (SPEC.md §5). Responds with server-sent events:
 *   estimate {id, number}            the draft row exists
 *   partial  {draft}                 the model's output so far (unvalidated), at most every 200 ms
 *   done     {estimateId, totals, warnings}
 *   error    {message}
 */
export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  const [member] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
  if (!member) return Response.json({ error: "Set up your business first." }, { status: 403 });

  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: body.error.issues[0].message }, { status: 400 });

  const config = await resolveAiConfig(member.orgId);
  let model;
  try {
    model = languageModel(config, "smart");
  } catch (e) {
    if (e instanceof AiNotConfiguredError) return Response.json({ error: e.message }, { status: 409 });
    throw e;
  }

  // The install's shared key is capped per business per day; a business's own key isn't.
  if (config.source === "instance") {
    const limit = dailyLimit(process.env.AI_DAILY_LIMIT);
    if (overLimit(await usageLast24h(member.orgId, "generate"), limit)) {
      return Response.json(
        { error: `This OpenQuote AU allows ${limit} AI estimates a day per business on its shared key. Add your own key in Settings → AI to keep going.` },
        { status: 429 },
      );
    }
  }

  // A project supplies the client and, unless one was typed, the site address. It must belong to this org.
  const project = body.data.projectId ? await getProject(member.orgId, body.data.projectId) : null;
  if (body.data.projectId && !project) return Response.json({ error: "That project wasn't found." }, { status: 404 });
  const siteAddress = body.data.siteAddress || project?.siteAddress || null;

  const { org, rateRules, instructions } = await loadGenerationInputs(member.orgId);
  // Short aliases (R1, R2…) are easier for the model to copy exactly than UUIDs.
  const aliased = rateRules.map((r, i) => ({ ...r, id: `R${i + 1}`, dbId: r.id }));
  const { system, prompt } = buildGenerationPrompt({
    description: body.data.description,
    siteAddress,
    org,
    rateRules: aliased,
    instructions,
  });

  const estimate = await createPendingEstimate(member.orgId, {
    description: body.data.description,
    projectId: project?.id ?? null,
    clientId: project?.clientId ?? null,
    siteAddress,
  });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      send("estimate", estimate);

      let lastPartialAt = 0;
      try {
        const { draft, usage } = await generateEstimateDraft({
          model: model.model,
          system,
          prompt,
          abortSignal: request.signal,
          onPartial: (partial) => {
            const now = Date.now();
            if (now - lastPartialAt < PARTIAL_INTERVAL_MS) return;
            lastPartialAt = now;
            send("partial", { draft: partial });
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

        send("done", {
          estimateId: estimate.id,
          totals: estimateTotals(groups, {
            org,
            gstRatePct: org.gstRegistered ? org.gstRate : 0,
          }),
          warnings: validateEstimate(body.data.description, groups),
        });
      } catch (e) {
        // Don't leave an empty draft behind.
        await deleteEstimate(estimate.id).catch(() => {});
        if (!request.signal.aborted) send("error", { message: describeGenerationError(e) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform" },
  });
}

function describeGenerationError(e: unknown): string {
  const status = (e as { statusCode?: number })?.statusCode;
  if (status === 401 || status === 403) return "Your AI provider rejected the key. Check it in Settings → AI.";
  if (status === 402) return "Your AI provider account has no credit.";
  if (status === 429) return "Your AI provider is rate limiting requests. Try again in a minute.";
  if (NoObjectGeneratedError.isInstance(e)) {
    return "The model's answer didn't match the estimate format. Try again, or try a stronger model.";
  }
  // Name and message only: provider errors can carry the request body (the prompt), which we never log.
  console.error("Estimate generation failed:", (e as Error)?.name, (e as Error)?.message);
  return "Generating the estimate failed. Try again.";
}
