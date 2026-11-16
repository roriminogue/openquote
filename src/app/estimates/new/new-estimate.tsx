import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { KeyRound, MapPin, Square } from "lucide-react";
import { useRouter } from "@/lib/navigation";
import { useEffect, useRef, useState } from "react";
import { Breakdown } from "@/components/breakdown";
import { Callout } from "@/components/callout";
import { Money } from "@/components/money";
import { formatEstimateNo, linePriceCents, resolveMarkupPct, type MarkupSettings } from "@/lib/pricing";
import type { ClientOption, ProjectOption } from "@/lib/project-schema";
import type { PartialPricedDraft } from "@/lib/estimate/price";
import { generateEstimate } from "@/lib/estimate/run";
import { PUBLIK_ENABLED } from "@/lib/publik-token";
import { useDictation } from "./dictation";
import { ProjectField } from "./project-flow";

/** What's been priced so far while the model writes (pricePartialDraft): costs before markup, in cents. */
export type PartialDraft = Partial<PartialPricedDraft>;

type Phase =
  | { kind: "idle" }
  | { kind: "streaming"; number?: number; draft: PartialDraft; thinking?: string }
  | { kind: "saving"; number?: number; draft: PartialDraft }
  | { kind: "error"; message: string };

/** Adds the business's markup to what's been priced so far, the same way the saved estimate does. */
function previewGroups(draft: PartialDraft, markup: MarkupSettings) {
  return (draft.groups ?? []).map((g) => {
    const lines = g.lines.map((l) => ({ ...l, priceCents: linePriceCents(l, resolveMarkupPct(l, markup)) }));
    return { name: g.name, lines, priceCents: lines.reduce((s, l) => s + l.priceCents, 0) };
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
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const busy = phase.kind === "streaming" || phase.kind === "saving";
  const dictation = useDictation({ value: description, onChange: setDescription, hints: voiceHints, canTidy: !!ai });
  const canPrice = !!ai && !busy && !dictation.busy;

  // Only the Price button calls this. The sheets opened from this page (pick a project, add a
  // client) keep their own forms, so nothing in them can start pricing.
  async function generate() {
    if (!canPrice) return;
    if (description.trim().length < 10) {
      setPhase({ kind: "error", message: "Describe the job in a bit more detail." });
      descriptionRef.current?.focus();
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase({ kind: "streaming", draft: {} });
    requestAnimationFrame(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

    let number: number | undefined;
    let draft: PartialDraft = {};
    let thinking: string | undefined;
    try {
      const result = await generateEstimate(
        { description, projectId: project?.id ?? null, siteAddress: project?.siteAddress ? null : siteAddress || null },
        {
          estimate: (e) => {
            number = e.number;
            setPhase({ kind: "streaming", number, draft, thinking });
          },
          partial: (d) => {
            draft = d ?? draft;
            setPhase({ kind: "streaming", number, draft, thinking });
          },
          thinking: (t) => {
            thinking = t;
            setPhase({ kind: "streaming", number, draft, thinking });
          },
        },
        controller.signal,
      );
      if (result.ok) {
        setPhase({ kind: "saving", number, draft });
        router.push(`/estimates/${result.estimateId}`);
      } else if (result.aborted) {
        setPhase({ kind: "idle" });
      } else {
        setPhase({ kind: "error", message: result.error });
      }
    } catch (err) {
      console.error(err);
      setPhase({ kind: "error", message: "Generating the estimate failed. Try again." });
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-[50rem]">
      {!ai && (
        <div className="mb-5">
          <Callout
            icon={KeyRound}
            title="Set up AI first"
            description={
              PUBLIK_ENABLED
                ? "OpenQuote AU prices jobs with AI: use your publik plan, or your own provider key."
                : "OpenQuote AU prices jobs with AI. Add your AI key (Anthropic, OpenAI, Google or OpenRouter) in Settings → AI."
            }
            actions={<Button label="Set up AI" variant="secondary" size="md" width="100%" href="/settings/ai" />}
          />
        </div>
      )}

      {/* The prompt box, in the manner of Claude's and ChatGPT's: the words on top, Talk and Price along the bottom.
          It sits a shade lighter than the page in dark mode (and white with a hairline in light), never darker. */}
      <div className="prompt-box" data-error={phase.kind === "error" || undefined}>
        <textarea
          ref={descriptionRef}
          id="description"
          name="description"
          rows={4}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value.slice(0, 8000));
            // An old "describe it in more detail" or provider error shouldn't sit there once they've fixed it.
            if (phase.kind === "error") setPhase({ kind: "idle" });
          }}
          disabled={busy}
          readOnly={dictation.busy}
          aria-label="Describe the job"
          aria-invalid={phase.kind === "error" || undefined}
          aria-describedby={phase.kind === "error" ? "description-error" : undefined}
          placeholder={
            dictation.supported
              ? "Describe the job, or tap Talk: size, materials, access, finish."
              : "Describe the job: size, materials, access, finish."
          }
          className="block min-h-28 w-full resize-none rounded-t-[1.75rem] bg-transparent px-5 pt-4 pb-1 text-base leading-relaxed text-(--color-text-primary) caret-(--color-accent) outline-none placeholder:text-(--color-text-secondary) disabled:opacity-60"
        />
        <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
          <div className="min-w-0">{!busy && dictation.button}</div>
          {busy ? (
            <Button
              label="Stop"
              variant="secondary"
              className="rounded-full!"
              icon={<Icon icon={Square} fill="currentColor" />}
              onClick={() => abortRef.current?.abort()}
            />
          ) : (
            <Button label="Price this job" variant="primary" className="rounded-full!" isDisabled={!ai || dictation.busy} onClick={generate} />
          )}
        </div>
      </div>
      {phase.kind === "error" && (
        <p id="description-error" role="alert" className="mt-2 px-2 text-(length:--text-supporting-size) text-(--color-text-error)">
          {phase.message}
        </p>
      )}
      {dictation.statusLine && (
        <div aria-live="polite" className="mt-2 px-2">
          {dictation.statusLine}
        </div>
      )}

      <div className="mt-5 grid items-start gap-5 sm:grid-cols-2 sm:gap-4">
        <ProjectField projects={projects} clients={clients} value={project} onChange={setProject} disabled={busy} />
        {project?.siteAddress ? (
          <div className="min-w-0">
            <Text as="div" type="label" color="secondary" weight="medium">
              Site address
            </Text>
            <p className="mt-1 flex min-h-(--size-element-md) items-center gap-2 text-(length:--text-body-size) text-(--color-text-primary)">
              <MapPin className="size-4 shrink-0 text-(--color-icon-secondary)" aria-hidden />
              <span className="min-w-0 truncate">{project.siteAddress}</span>
            </p>
          </div>
        ) : (
          <TextInput
            id="jobSite"
            htmlName="siteAddress"
            label="Site address"
            isOptional
            startIcon={MapPin}
            value={siteAddress}
            onChange={setSiteAddress}
            isDisabled={busy}
            placeholder="For travel and local pricing…"
            autoComplete="off"
            width="100%"
          />
        )}
      </div>

      <section ref={previewRef} aria-label="Estimate preview" aria-busy={busy} className="mt-8 min-w-0 scroll-mt-20">
        {busy ? (
          <LivePreview
            draft={phase.draft}
            thinking={phase.kind === "streaming" ? phase.thinking : undefined}
            number={phase.number}
            saving={phase.kind === "saving"}
            markup={markup}
            gstRatePct={gstRatePct}
          />
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
    <div>
      <Heading level={4} accessibilityLevel={2} color="secondary">
        What you’ll get
      </Heading>
      <dl className="mt-3 grid gap-x-8 gap-y-4 border-t border-(--color-border) pt-4 sm:grid-cols-2">
        {points.map(([t, d]) => (
          <div key={t}>
            <dt className="text-(length:--text-body-size) font-medium text-(--color-text-primary)">{t}</dt>
            <dd className="mt-0.5 text-(length:--text-body-size) text-(--color-text-secondary)">{d}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Counts a number towards its new value (an ease-out over ~0.6 s) so the running total climbs rather than jumps. */
function useCountUp(target: number) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  const instant = reducedMotion();
  useEffect(() => {
    if (instant) return;
    const start = from.current;
    const began = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - began) / 600);
      const value = Math.round(start + (target - start) * (1 - Math.pow(1 - t, 3)));
      from.current = value;
      setShown(value);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, instant]);
  return instant ? target : shown;
}

/**
 * Shows newly priced lines one at a time (about eight a second) rather than all at once: a deck or fence comes back
 * from its calculator as a whole set of stages in one go, and this lets the person watch it build. Everything shows
 * straight away with reduced motion, or once saving starts.
 */
function useRevealed<G extends { lines: { priceCents: number }[]; priceCents: number }>(groups: G[], all: boolean): G[] {
  const available = groups.reduce((n, g) => n + g.lines.length, 0);
  const [shown, setShown] = useState(0);
  const instant = all || reducedMotion();
  useEffect(() => {
    if (instant || shown >= available) return;
    const timer = window.setTimeout(() => setShown((n) => n + 1), 120);
    return () => window.clearTimeout(timer);
  }, [instant, shown, available]);
  if (instant) return groups;
  const out: G[] = [];
  for (let i = 0, left = shown; i < groups.length && left > 0; i++) {
    const g = groups[i];
    const lines = g.lines.slice(0, left);
    left -= lines.length;
    const priceCents = lines.length < g.lines.length ? lines.reduce((sum, l) => sum + l.priceCents, 0) : g.priceCents;
    out.push({ ...g, lines, priceCents });
  }
  return out;
}

/** What the model has written so far, priced the way the saved estimate will be. */
export function LivePreview({
  draft,
  thinking,
  number,
  saving,
  markup,
  gstRatePct,
}: {
  draft: PartialDraft;
  /** The model's thinking summary so far, shown until the first stage is priced. */
  thinking?: string;
  number?: number;
  saving: boolean;
  markup: MarkupSettings;
  gstRatePct: number;
}) {
  const groups = useRevealed(previewGroups(draft, markup), saving);
  const subtotal = groups.reduce((s, g) => s + g.priceCents, 0);
  const total = useCountUp(subtotal + Math.round((subtotal * gstRatePct) / 100));
  const lineCount = groups.reduce((s, g) => s + g.lines.length, 0);
  const current = groups.at(-1);
  // The summary comes in short paragraphs, one per step of its thinking; show the latest.
  const paragraphs = (thinking ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const thought = paragraphs.at(-1);
  const thoughtKey = paragraphs.length;

  return (
    <Card elevation="low">
      <p className="flex items-center gap-2 text-(length:--text-supporting-size) text-(--color-text-secondary)" role="status">
        <span aria-hidden className="relative flex size-2 shrink-0">
          <span className="absolute inset-0 animate-ping rounded-full bg-(--color-accent) opacity-60 motion-reduce:hidden" />
          <span className="relative size-2 rounded-full bg-(--color-accent)" />
        </span>
        <span className="min-w-0 truncate">
          {saving
            ? "Checking prices and saving…"
            : current
              ? `Stage ${groups.length} · ${current.name}`
              : thought
                ? "Thinking it through…"
                : "Working out the stages…"}
        </span>
      </p>

      <div className="mt-2">
        <Heading level={2}>{draft.title || "Reading the job…"}</Heading>
      </div>
      {thought && !current && (
        // The thought the model is on right now, replaced as it moves on. Not announced: it changes too often.
        <p key={thoughtKey} className="enter mt-2 line-clamp-3 text-(length:--text-body-size) leading-snug text-(--color-text-secondary)">
          {thought}
        </p>
      )}
      {number && (
        <Text as="p" type="supporting" color="secondary" hasTabularNumbers>
          {formatEstimateNo(number)}
        </Text>
      )}

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <Text as="p" type="supporting" color="secondary">
            Running total, inc. GST
          </Text>
          <Money cents={total} className="mt-0.5 block text-[1.75rem] font-semibold leading-tight tracking-[-0.01em] text-(--color-text-primary)" />
        </div>
        <Text as="p" type="supporting" color="secondary" hasTabularNumbers>
          {lineCount} {lineCount === 1 ? "line" : "lines"}
        </Text>
      </div>

      <div className="mt-4">
        <Breakdown legend={false} stages={groups.map((g) => ({ name: g.name, cents: g.priceCents }))} />
      </div>

      <ol className="mt-6 space-y-5">
        {groups.map((g, gi) => (
          <li key={gi} className="enter">
            <div className="flex items-baseline justify-between gap-4 border-b border-(--color-border) pb-2">
              <h3 className="min-w-0 text-(length:--text-body-size) font-medium text-(--color-text-primary)">
                <span className="mr-2 tabular-nums text-(--color-text-secondary)">{gi + 1}</span>
                {g.name}
              </h3>
              <Money cents={g.priceCents} className="text-(length:--text-body-size) font-medium text-(--color-text-primary)" />
            </div>
            <ul>
              {g.lines.map((l, li) => {
                // The line being written right now sits on a pale wash until the next one arrives.
                const fresh = !saving && gi === groups.length - 1 && li === g.lines.length - 1;
                return (
                  <li
                    key={li}
                    className={`-mx-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 rounded-md px-2 py-2 transition-colors duration-500 ${
                      fresh ? "bg-(--color-accent-muted)" : ""
                    }`}
                  >
                    <span className="min-w-0 text-(length:--text-body-size) leading-snug text-(--color-text-secondary)">{l.description}</span>
                    <Money cents={l.priceCents} className="text-(length:--text-body-size) text-(--color-text-primary)" />
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>

      <div className="mt-6">
        <Text as="p" type="supporting" color="secondary">
          Priced with your rates as each line is written. Final checks run when it’s saved.
        </Text>
      </div>
    </Card>
  );
}
