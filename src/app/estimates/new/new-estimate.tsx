"use client";

import { MapPin, Square } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Breakdown } from "@/components/breakdown";
import { Money } from "@/components/money";
import { Button, Notice } from "@/components/ui";
import { formatEstimateNo, linePriceCents, resolveMarkupPct, type LineType, type MarkupSettings } from "@/lib/pricing";
import type { ClientOption, ProjectOption } from "@/lib/project-schema";
import { useDictation } from "./dictation";
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

export function NewEstimate({
  initialDescription,
  firstTime = false,
  projects,
  clients,
  initialProject,
  markup,
  gstRatePct,
  ai,
  voiceHints,
}: {
  initialDescription: string;
  /** No estimates yet: explain what comes back under the composer. */
  firstTime?: boolean;
  projects: ProjectOption[];
  clients: ClientOption[];
  initialProject: ProjectOption | null;
  markup: MarkupSettings;
  gstRatePct: number;
  ai: { provider: string; model: string; canEdit: boolean } | null;
  /** Trade words that help the phone's recogniser (the business's rate names first). */
  voiceHints: string[];
}) {
  const router = useRouter();
  const [description, setDescription] = useState(initialDescription);
  const [siteAddress, setSiteAddress] = useState("");
  const [project, setProject] = useState<ProjectOption | null>(initialProject);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLElement>(null);
  const busy = phase.kind === "streaming" || phase.kind === "saving";
  const dictation = useDictation({ value: description, onChange: setDescription, hints: voiceHints, canTidy: !!ai });

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

  const submitOnShortcut = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="mx-auto mt-6 max-w-[50rem]">
      <form onSubmit={generate}>
        {!ai && (
          <div className="mb-4">
            <Notice tone="info">
              Add an AI key first. OpenQuote uses your own provider account.{" "}
              <Link href="/settings/ai" className="font-medium text-ink underline underline-offset-2">
                Set up AI
              </Link>
            </Notice>
          </div>
        )}
        <div className="rounded-2xl bg-subtle">
          <div className="rounded-[14px] bg-surface shadow-raised transition-shadow duration-150 focus-within:shadow-[var(--shadow-raised-focus)]">
            <label htmlFor="description" className="sr-only">
              Describe the job
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              minLength={10}
              maxLength={8000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={submitOnShortcut}
              disabled={busy}
              readOnly={dictation.busy}
              aria-describedby="description-hint"
              placeholder={
                dictation.supported
                  ? "Describe the job, or tap Talk: size, materials, access, finish. Whatever you’d tell a mate on the phone."
                  : "Describe the job: size, materials, access, finish. Whatever you’d tell a mate on the phone."
              }
              className="block min-h-28 w-full resize-none rounded-t-[14px] bg-transparent px-4 pb-2 pt-4 text-base leading-relaxed text-ink placeholder:text-ink-3 focus:outline-none disabled:opacity-60 sm:text-sm"
            />
            {dictation.statusLine && (
              <div aria-live="polite" className="px-4 pb-1">
                {dictation.statusLine}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 px-3 pb-3 pt-1">
              {!busy && dictation.button}
              <ProjectField projects={projects} clients={clients} value={project} onChange={setProject} disabled={busy} />
              {ai && (
                <span id="description-hint" className="hidden min-w-0 truncate text-xs text-ink-3 sm:inline">
                  {ai.provider}
                  {ai.model ? ` · ${ai.model}` : ""}
                </span>
              )}
              <span className="ml-auto max-sm:w-full">
                {busy ? (
                  <Button type="button" variant="secondary" className="max-sm:w-full" onClick={() => abortRef.current?.abort()}>
                    <Square className="size-3 fill-current" aria-hidden />
                    Stop
                  </Button>
                ) : (
                  <Button type="submit" variant="accent" className="max-sm:w-full" disabled={!ai || dictation.busy}>
                    Price this job
                    <kbd className="hidden rounded border border-on-accent/20 px-1 font-sans text-2xs font-medium text-on-accent/70 sm:inline">
                      ⌘↵
                    </kbd>
                  </Button>
                )}
              </span>
            </div>
          </div>
          {project?.siteAddress ? (
            <p className="flex items-center gap-2 px-4 py-2.5 text-xs text-ink-2">
              <MapPin className="size-3.5 shrink-0 text-ink-3" aria-hidden />
              <span className="truncate">Site: {project.siteAddress}</span>
            </p>
          ) : (
            <div className="flex items-center gap-2 px-4">
              <MapPin className="size-3.5 shrink-0 text-ink-3" aria-hidden />
              <label htmlFor="siteAddress" className="sr-only">
                Site address
              </label>
              <input
                id="siteAddress"
                name="siteAddress"
                autoComplete="off"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                disabled={busy}
                placeholder="Add a site address for travel and local pricing (optional)"
                className="h-11 min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-ink-3 focus:outline-none disabled:opacity-60 sm:h-10 sm:text-xs"
              />
            </div>
          )}
        </div>
        {phase.kind === "error" && (
          <div className="mt-4">
            <Notice tone="error">{phase.message}</Notice>
          </div>
        )}
      </form>

      <section ref={previewRef} aria-label="Estimate preview" aria-busy={busy} className="mt-8 min-w-0 scroll-mt-20">
        {busy ? (
          <LivePreview draft={phase.draft} number={phase.number} saving={phase.kind === "saving"} markup={markup} gstRatePct={gstRatePct} />
        ) : firstTime ? (
          <HowItWorks />
        ) : null}
      </section>
    </div>
  );
}

function HowItWorks() {
  const points = [
    ["Stages, in order", "Each line with a quantity, unit and price, grouped the way the work happens."],
    ["Your rates first", "Your rate rules are used wherever they fit, then a checked price book. Anything else is marked to check."],
    ["Fences and decks by the numbers", "Posts, rails, palings, joists, boards and hours are worked out from the measurements."],
    ["Scope and options", "What’s included, what isn’t, and ways to upgrade or save."],
    ["Sanity checks", "Warnings for anything that looks off, like a bathroom with no waterproofing."],
  ];
  return (
    <div className="rounded-[14px] bg-subtle px-4 py-3">
      <h2 className="text-sm font-medium text-ink">What you&rsquo;ll get</h2>
      <dl className="mt-3 grid gap-x-8 gap-y-4 pb-2 sm:grid-cols-2">
        {points.map(([t, d]) => (
          <div key={t}>
            <dt className="text-sm font-medium text-ink">{t}</dt>
            <dd className="mt-0.5 text-sm text-ink-3">{d}</dd>
          </div>
        ))}
      </dl>
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
    <div className="rounded-[14px] bg-bg p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm text-ink-3" role="status">
            <span aria-hidden className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent/60 motion-reduce:hidden" />
              <span className="relative size-2 rounded-full bg-accent" />
            </span>
            {saving
              ? "Checking prices and saving…"
              : current
                ? `Stage ${groups.length} · ${current.name}`
                : "Working out the stages…"}
          </p>
          <h2 className="mt-2 font-display text-xl font-medium leading-snug">{draft.title || "Reading the job…"}</h2>
          {number && <p className="figures mt-0.5 text-sm text-ink-3">{formatEstimateNo(number)}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-caption text-ink-3">Running total</p>
          <Money cents={total} className="mt-0.5 block text-title font-semibold tracking-[-0.01em]" />
          <p className="figures mt-0.5 text-caption text-ink-3">{lineCount} lines</p>
        </div>
      </div>
      <div className="mt-5">
        <Breakdown legend={false} stages={groups.map((g) => ({ name: g.name, cents: g.priceCents }))} />
      </div>
      <ol className="mt-6 space-y-5">
        {groups.map((g, gi) => (
          <li key={gi} className="enter">
            <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
              <h3 className="text-body font-medium">
                <span className="figures mr-2 text-ink-4">{gi + 1}</span>
                {g.name}
              </h3>
              <Money cents={g.priceCents} className="text-body font-medium" />
            </div>
            <ul>
              {g.lines.map((l, li) => {
                // The line being written right now sits on a pale wash until the next one arrives.
                const fresh = !saving && gi === groups.length - 1 && li === g.lines.length - 1;
                return (
                  <li
                    key={li}
                    className={`-mx-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 rounded-md px-2 py-2 transition-colors duration-500 ${fresh ? "bg-accent-soft" : ""}`}
                  >
                    <span className="min-w-0 text-sm leading-snug text-ink-2">{l.description}</span>
                    <Money cents={l.priceCents} className="text-sm text-ink" />
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-caption text-ink-3">Draft prices. Your rate rules and final checks apply when it&rsquo;s saved.</p>
    </div>
  );
}
