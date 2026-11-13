import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { MapPin, Square } from "lucide-react";
import { useRouter } from "@/lib/navigation";
import { useRef, useState } from "react";
import { Breakdown } from "@/components/breakdown";
import { Money } from "@/components/money";
import { formatEstimateNo, linePriceCents, resolveMarkupPct, type LineType, type MarkupSettings } from "@/lib/pricing";
import type { ClientOption, ProjectOption } from "@/lib/project-schema";
import { generateEstimate } from "@/lib/estimate/run";
import { PUBLIK_ENABLED } from "@/lib/publik-token";
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
    try {
      const result = await generateEstimate(
        { description, projectId: project?.id ?? null, siteAddress: project?.siteAddress ? null : siteAddress || null },
        {
          estimate: (e) => {
            number = e.number;
            setPhase({ kind: "streaming", number, draft });
          },
          partial: (d) => {
            draft = d ?? draft;
            setPhase({ kind: "streaming", number, draft });
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
          <Banner
            status="warning"
            title="Set up AI first"
            description={
              PUBLIK_ENABLED
                ? "OpenQuote AU prices jobs with AI: use your publik plan, or your own provider key."
                : "OpenQuote AU prices jobs with AI. Add your AI key (Anthropic, OpenAI, Google or OpenRouter) in Settings → AI."
            }
          />
          <div className="mt-3 sm:w-48">
            <Button label="Set up AI" variant="secondary" size="lg" width="100%" href="/settings/ai" />
          </div>
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
    <Card elevation="low">
      <p className="flex items-center gap-2 text-(length:--text-supporting-size) text-(--color-text-secondary)" role="status">
        <span aria-hidden className="relative flex size-2 shrink-0">
          <span className="absolute inset-0 animate-ping rounded-full bg-(--color-accent) opacity-60 motion-reduce:hidden" />
          <span className="relative size-2 rounded-full bg-(--color-accent)" />
        </span>
        <span className="min-w-0 truncate">
          {saving ? "Checking prices and saving…" : current ? `Stage ${groups.length} · ${current.name}` : "Working out the stages…"}
        </span>
      </p>

      <div className="mt-2">
        <Heading level={2}>{draft.title || "Reading the job…"}</Heading>
      </div>
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
          Draft prices. Your rate rules and final checks apply when it’s saved.
        </Text>
      </div>
    </Card>
  );
}
