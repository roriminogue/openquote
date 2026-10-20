"use client";

import { ArrowRight, Square } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Blade } from "@/components/blade";
import { Money } from "@/components/money";
import { WashLine } from "@/components/wash-line";
import { Button, Field, Input, Notice, Textarea } from "@/components/ui";
import { formatEstimateNo, linePriceCents, resolveMarkupPct, type LineType, type MarkupSettings } from "@/lib/pricing";
import type { ClientOption, ProjectOption } from "@/lib/project-schema";
import { ProjectField } from "./project-flow";

type PartialLine = { description?: string; type?: LineType; qty?: number; unit?: string; unitCost?: number };
export type PartialDraft = { title?: string; groups?: { name?: string; lines?: PartialLine[] }[] };

type Phase =
  | { kind: "idle" }
  | { kind: "streaming"; number?: number; draft: PartialDraft }
  | { kind: "saving"; number?: number; draft: PartialDraft }
  | { kind: "error"; message: string };

const LINE_TYPES = new Set(["material", "labour", "subbie", "other"]);

/** Prices whatever the model has written so far, the same way the server will. */
function previewGroups(draft: PartialDraft, markup: MarkupSettings) {
  return (draft.groups ?? [])
    .filter((g) => g?.name)
    .map((g) => {
      const lines = (g.lines ?? [])
        .filter((l): l is Required<PartialLine> =>
          !!l?.description && typeof l.qty === "number" && typeof l.unitCost === "number" && LINE_TYPES.has(l.type as string),
        )
        .map((l) => {
          const line = { type: l.type, qty: l.qty, unitCostCents: Math.round(l.unitCost * 100) };
          return { ...l, priceCents: linePriceCents(line, resolveMarkupPct(line, markup)) };
        });
      return { name: g.name!, lines, priceCents: lines.reduce((s, l) => s + l.priceCents, 0) };
    });
}

const EXAMPLES = [
  ["Deck", "Build a 4 × 3 m merbau deck, 600 mm high, two steps down to the lawn, oil finish"],
  ["Bathroom", "Retile a 2.4 × 2 m bathroom floor to ceiling, walk-in shower, new vanity and toilet, same layout"],
  ["Fence", "Replace 20 m of 1.8 m paling fence, reuse the posts, treated pine palings and capping"],
  ["Pergola", "Freestanding 4 × 4 m treated pine pergola on concrete footings, Colorbond roof"],
] as const;

export function NewEstimate({
  initialDescription,
  projects,
  clients,
  initialProject,
  markup,
  gstRatePct,
  ai,
}: {
  initialDescription: string;
  projects: ProjectOption[];
  clients: ClientOption[];
  initialProject: ProjectOption | null;
  markup: MarkupSettings;
  gstRatePct: number;
  ai: { provider: string; model: string; canEdit: boolean } | null;
}) {
  const router = useRouter();
  const [description, setDescription] = useState(initialDescription);
  const [siteAddress, setSiteAddress] = useState("");
  const [project, setProject] = useState<ProjectOption | null>(initialProject);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLElement>(null);
  const busy = phase.kind === "streaming" || phase.kind === "saving";

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase({ kind: "streaming", draft: {} });
    requestAnimationFrame(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

    let number: number | undefined;
    let draft: PartialDraft = {};
    try {
      const res = await fetch("/api/estimates/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description, projectId: project?.id ?? null, siteAddress: project?.siteAddress ? null : siteAddress || null }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        setPhase({ kind: "error", message: body?.error ?? "Couldn’t start. Try again." });
        return;
      }

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let cut: number;
        while ((cut = buffer.indexOf("\n\n")) >= 0) {
          const block = buffer.slice(0, cut);
          buffer = buffer.slice(cut + 2);
          const event = /^event: (.+)$/m.exec(block)?.[1];
          const data = JSON.parse(/^data: (.*)$/m.exec(block)?.[1] ?? "null");
          if (event === "estimate") {
            number = data.number;
            setPhase({ kind: "streaming", number, draft });
          } else if (event === "partial") {
            draft = data.draft ?? draft;
            setPhase({ kind: "streaming", number, draft });
          } else if (event === "done") {
            setPhase({ kind: "saving", number, draft });
            router.push(`/estimates/${data.estimateId}`);
            return;
          } else if (event === "error") {
            setPhase({ kind: "error", message: data.message });
            return;
          }
        }
      }
      setPhase({ kind: "error", message: "The connection closed before the estimate finished. Try again." });
    } catch (err) {
      if ((err as Error).name === "AbortError") setPhase({ kind: "idle" });
      else setPhase({ kind: "error", message: "Lost the connection. Check your signal and try again." });
    }
  }

  return (
    <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-12">
      <form onSubmit={generate} className="space-y-5">
        {!ai && (
          <Notice tone="info">
            Add an AI key first. OpenQuote uses your own provider account.{" "}
            <Link href="/settings/ai" className="font-semibold text-ink underline">
              Set up AI
            </Link>
          </Notice>
        )}
        <ProjectField projects={projects} clients={clients} value={project} onChange={setProject} disabled={busy} />
        <Field
          id="description"
          label="Describe the job"
          hint="Size, materials, access, finish. Whatever you’d tell a mate on the phone."
        >
          <Textarea
            id="description"
            name="description"
            rows={7}
            required
            minLength={10}
            maxLength={8000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={busy}
            placeholder="e.g. Build a 4 × 3 m merbau deck at the back, about 600 mm off the ground, two steps down to the lawn, oil finish…"
          />
        </Field>
        {!description.trim() && !busy && (
          <div className="-mt-1 flex flex-wrap gap-2" aria-label="Start from an example">
            {EXAMPLES.map(([label, text]) => (
              <button
                key={label}
                type="button"
                onClick={() => setDescription(text)}
                className="h-9 rounded-tape border border-hairline-strong bg-surface px-3 text-[0.9375rem] font-semibold text-ink-2 transition-colors hover:border-ink hover:text-ink"
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {!project?.siteAddress && (
          <Field id="siteAddress" label="Site address" hint="Optional. Helps with travel and local pricing.">
            <Input
              id="siteAddress"
              name="siteAddress"
              autoComplete="off"
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              disabled={busy}
            />
          </Field>
        )}

        {busy ? (
          <Button type="button" variant="secondary" size="lg" className="w-full" onClick={() => abortRef.current?.abort()}>
            <Square className="size-4 fill-current" aria-hidden />
            Stop
          </Button>
        ) : (
          <Button type="submit" size="lg" className="w-full" disabled={!ai}>
            Price this job
            <ArrowRight className="size-5" aria-hidden />
          </Button>
        )}
        {ai && (
          <p className="text-sm text-ink-3">
            Uses your {ai.provider} key{ai.model ? ` (${ai.model})` : ""}. Usually 15–60 seconds and a few cents.
          </p>
        )}
        {phase.kind === "error" && <Notice tone="error">{phase.message}</Notice>}
      </form>

      <section ref={previewRef} aria-label="Estimate preview" aria-busy={busy} className="scroll-mt-20 min-w-0">
        {busy ? (
          <LivePreview draft={phase.draft} number={phase.number} saving={phase.kind === "saving"} markup={markup} gstRatePct={gstRatePct} />
        ) : (
          <HowItWorks />
        )}
      </section>
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="hidden border-l border-hairline pl-8 lg:block">
      <h2 className="font-bold">What you&rsquo;ll get</h2>
      <ul className="mt-3 space-y-3 text-ink-2">
        <li>Stages in the order the work happens, each line with a quantity, unit and price.</li>
        <li>Your rate rules used wherever they fit, marked &ldquo;Your rate&rdquo;. Everything else is marked as an AI price.</li>
        <li>Scope, assumptions, what&rsquo;s not included, and options to upgrade or save.</li>
        <li>Warnings for anything that looks off, like a bathroom with no waterproofing.</li>
      </ul>
    </div>
  );
}

/** What the model has written so far, priced the way the server will price it. */
export function LivePreview({
  draft,
  number,
  saving,
  markup,
  gstRatePct,
}: {
  draft: PartialDraft;
  number?: number;
  saving: boolean;
  markup: MarkupSettings;
  gstRatePct: number;
}) {
  const groups = previewGroups(draft, markup);
  const subtotal = groups.reduce((s, g) => s + g.priceCents, 0);
  const total = subtotal + Math.round((subtotal * gstRatePct) / 100);
  const lineCount = groups.reduce((s, g) => s + g.lines.length, 0);
  const current = groups.at(-1);

  return (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="min-w-0 truncate text-[1.375rem] font-bold leading-tight">{draft.title || "Reading the job…"}</h2>
              {number && <span className="figures shrink-0 font-semibold text-ink-3">{formatEstimateNo(number)}</span>}
            </div>
            <p className="mt-1 text-[0.9375rem] text-ink-3" role="status">
              {saving
                ? "Pricing and saving…"
                : current
                  ? `Stage ${groups.length}: ${current.name} · ${lineCount} lines so far`
                  : "Working out the stages…"}
            </p>
            <div className="mt-5">
              <Blade
                live
                segments={groups.map((g) => ({ name: g.name, cents: g.priceCents }))}
                totalCents={total}
                caption="Running total"
                extent={saving ? 1 : Math.min(0.92, 0.1 + groups.length * 0.13)}
              />
            </div>
            <ol className="mt-6 space-y-6">
              {groups.map((g, gi) => (
                <li key={gi}>
                  <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-2">
                    <h3 className="font-bold">
                      <span className="figures mr-2 text-ink-3">{gi + 1}</span>
                      {g.name}
                    </h3>
                    <Money cents={g.priceCents} className="font-bold" />
                  </div>
                  <ul>
                    {g.lines.map((l, li) => (
                      <WashLine key={li} className="-mx-1.5 grid grid-cols-[1fr_auto] gap-x-4 rounded-sm px-1.5 py-2">
                        <span className="min-w-0 text-[0.9375rem] leading-snug">{l.description}</span>
                        <Money cents={l.priceCents} className="text-[0.9375rem]" />
                      </WashLine>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-ink-3">Draft prices. Your rate rules and final checks apply when it&rsquo;s saved.</p>
          </>
  );
}
