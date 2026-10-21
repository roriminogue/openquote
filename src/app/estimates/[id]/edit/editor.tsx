"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Money } from "@/components/money";
import { Button, Notice, Panel } from "@/components/ui";
import type { EditLine } from "@/lib/estimate/edit-schema";
import { parseQty } from "@/lib/estimate/edit-schema";
import { estimateTotals, formatEstimateNo, linePriceCents, resolveMarkupPct, type LineType, type MarkupSettings } from "@/lib/pricing";
import { centsToDollars, dollarsToCents, RATE_UNITS } from "@/lib/rates-schema";
import { saveEstimate } from "./actions";

export type EditorGroup = { name: string; lines: EditLine[] };

type DraftLine = {
  key: string;
  description: string;
  type: LineType;
  qty: string;
  unit: string;
  cost: string;
  markup: string;
  notes: string | null;
  source: EditLine["source"];
  sourceRef: string | null;
  /** What the cost was when the editor opened; changing it makes the line your own price. */
  originalCostCents: number | null;
};
type DraftGroup = { key: string; name: string; lines: DraftLine[] };

const TYPE_OPTIONS: [LineType, string][] = [
  ["material", "Materials"],
  ["labour", "Labour"],
  ["subbie", "Subcontractor"],
  ["other", "Other"],
];

let seq = 0;
const key = () => `k${++seq}`;

const toDraftLine = (l: EditLine): DraftLine => ({
  key: key(),
  description: l.description,
  type: l.type,
  qty: String(l.qty),
  unit: l.unit,
  cost: centsToDollars(l.unitCostCents),
  markup: l.markupPct === null ? "" : String(l.markupPct),
  notes: l.notes,
  source: l.source,
  sourceRef: l.sourceRef,
  originalCostCents: l.unitCostCents,
});

const blankLine = (): DraftLine => ({
  key: key(),
  description: "",
  type: "material",
  qty: "1",
  unit: "each",
  cost: "",
  markup: "",
  notes: null,
  source: "manual",
  sourceRef: null,
  originalCostCents: null,
});

const num = (s: string) => (s.trim() === "" ? null : Number(s));

/** A line as the server wants it, or null with the first problem in it. */
function toLine(l: DraftLine): EditLine | null {
  const qty = parseQty(l.qty);
  const cost = dollarsToCents(l.cost);
  const markup = num(l.markup.replace(/%$/, ""));
  if (qty === null || cost === null || (markup !== null && !Number.isFinite(markup))) return null;
  const ownPrice = l.originalCostCents === null || cost !== l.originalCostCents;
  return {
    description: l.description,
    type: l.type,
    qty,
    unit: l.unit,
    unitCostCents: cost,
    markupPct: markup,
    notes: l.notes,
    source: ownPrice ? "manual" : l.source,
    sourceRef: ownPrice ? null : l.sourceRef,
  };
}

/**
 * Edit an estimate by hand: stage names, lines (description, type, qty, unit, cost, markup), add, remove and
 * reorder. Totals update as you type, priced exactly as the server prices them. Saving writes a new version.
 */
export function EstimateEditor({
  estimateId,
  number,
  initialTitle,
  initialGroups,
  markup,
  estimateMarkupPct,
  gstRatePct,
}: {
  estimateId: string;
  number: number;
  initialTitle: string;
  initialGroups: EditorGroup[];
  markup: MarkupSettings;
  estimateMarkupPct: number | null;
  gstRatePct: number;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [groups, setGroups] = useState<DraftGroup[]>(() =>
    initialGroups.map((g) => ({ key: key(), name: g.name, lines: g.lines.map(toDraftLine) })),
  );
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Field to focus once the next render has put it on the page (a new line or stage).
  const focusNext = useRef<string | null>(null);
  const setFocusId = (id: string) => {
    focusNext.current = id;
  };
  useEffect(() => {
    if (!focusNext.current) return;
    document.getElementById(focusNext.current)?.focus();
    focusNext.current = null;
  });

  // Warn before throwing away unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (fn: (gs: DraftGroup[]) => DraftGroup[]) => {
    setGroups(fn);
    setDirty(true);
  };
  const setLine = (gi: number, li: number, patch: Partial<DraftLine>) =>
    update((gs) => gs.map((g, i) => (i !== gi ? g : { ...g, lines: g.lines.map((l, j) => (j === li ? { ...l, ...patch } : l)) })));
  const move = <T,>(arr: T[], from: number, to: number) => {
    if (to < 0 || to >= arr.length) return arr;
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };

  const priced = useMemo(
    () =>
      groups.map((g) => ({
        name: g.name,
        lines: g.lines.map((l) => {
          const line = { type: l.type, qty: parseQty(l.qty) ?? 0, unitCostCents: dollarsToCents(l.cost) ?? 0, markupPct: num(l.markup) };
          const pct = resolveMarkupPct(line, markup, estimateMarkupPct);
          return { ...line, priceCents: linePriceCents(line, Number.isFinite(pct) ? pct : 0) };
        }),
      })),
    [groups, markup, estimateMarkupPct],
  );
  const totals = estimateTotals(priced, { org: markup, estimateMarkupPct, gstRatePct });

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const lines = groups.map((g) => g.lines.map(toLine));
    const bad = lines.flatMap((ls, gi) => ls.map((l, li) => (l ? null : [gi, li]))).find(Boolean);
    if (bad) {
      setError(`Check the numbers in stage ${bad[0] + 1}, line ${bad[1] + 1}: quantity, cost and markup must be numbers.`);
      document.getElementById(`${groups[bad[0]].lines[bad[1]].key}-qty`)?.focus();
      return;
    }
    setBusy(true);
    const res = await saveEstimate(estimateId, { title, groups: groups.map((g, gi) => ({ name: g.name, lines: lines[gi] })) });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDirty(false);
    router.push(`/estimates/${estimateId}`);
  }

  return (
    <form
      ref={formRef}
      onSubmit={save}
      noValidate
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }
      }}
    >
      <Link
        href={`/estimates/${estimateId}`}
        className="-ml-2 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-ink-3 transition-colors hover:bg-hover hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to estimate
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 flex-1">
          <p className="figures text-sm text-ink-3">Editing {formatEstimateNo(number)}</p>
          <label htmlFor="title" className="sr-only">
            Title
          </label>
          <textarea
            id="title"
            rows={1}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value.replace(/\n/g, " "));
              setDirty(true);
            }}
            className="mt-1 -ml-2 w-full resize-none rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-title font-medium leading-8 text-ink transition-colors [field-sizing:content] hover:border-border focus:border-ink-4 focus:outline-none"
          />
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <Link href={`/estimates/${estimateId}`} className="inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-medium text-ink-2 hover:bg-hover">
            Cancel
          </Link>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </header>

      <section aria-label="Totals" className="mt-6 grid grid-cols-3 gap-0">
        {[
          [gstRatePct ? "Total inc GST" : "Total", totals.totalCents],
          ["Price ex GST", totals.subtotalCents],
          ["Your cost", totals.costCents],
        ].map(([label, cents], i) => (
          <div key={i} className="border-l border-border px-3 first:border-l-0 first:pl-0 sm:px-6">
            <p className="text-xs font-medium text-ink-3">{label}</p>
            <Money cents={cents as number} className="mt-1.5 block text-lg font-semibold text-ink sm:text-title" />
          </div>
        ))}
      </section>

      {error && (
        <div className="mt-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <datalist id="units">
        {RATE_UNITS.map(([u]) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      <div className="mt-8 space-y-8">
        {groups.map((g, gi) => (
          <section key={g.key} aria-label={`Stage ${gi + 1}`}>
            <div className="mb-3 flex items-center gap-2">
              <span className="figures text-sm text-ink-4">{gi + 1}</span>
              <label htmlFor={`${g.key}-name`} className="sr-only">
                Stage {gi + 1} name
              </label>
              <input
                id={`${g.key}-name`}
                value={g.name}
                onChange={(e) => update((gs) => gs.map((x, i) => (i === gi ? { ...x, name: e.target.value } : x)))}
                placeholder="Stage name"
                className="h-9 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 text-sm font-semibold text-ink hover:border-border focus:border-ink-4 focus:outline-none sm:h-8"
              />
              <Money cents={priced[gi].lines.reduce((s, l) => s + l.priceCents, 0)} className="hidden shrink-0 text-sm font-semibold text-ink sm:inline" />
              <span className="flex shrink-0 items-center">
                <IconButton label={`Move stage ${gi + 1} up`} onClick={() => update((gs) => move(gs, gi, gi - 1))} disabled={gi === 0}>
                  <ArrowUp className="size-4" />
                </IconButton>
                <IconButton label={`Move stage ${gi + 1} down`} onClick={() => update((gs) => move(gs, gi, gi + 1))} disabled={gi === groups.length - 1}>
                  <ArrowDown className="size-4" />
                </IconButton>
                <IconButton
                  label={`Delete stage ${gi + 1}`}
                  onClick={() => {
                    if (g.lines.length === 0 || window.confirm(`Delete “${g.name || "this stage"}” and its ${g.lines.length} lines?`))
                      update((gs) => gs.filter((_, i) => i !== gi));
                  }}
                  disabled={groups.length === 1}
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </span>
            </div>

            <Panel>
              <ul className="divide-y divide-dashed divide-border">
                {g.lines.map((l, li) => (
                  <LineRow
                    key={l.key}
                    line={l}
                    index={li}
                    priceCents={priced[gi].lines[li].priceCents}
                    defaultMarkup={resolveMarkupPct({ type: l.type, qty: 0, unitCostCents: 0, markupPct: null }, markup, estimateMarkupPct)}
                    onChange={(patch) => setLine(gi, li, patch)}
                    onRemove={() => update((gs) => gs.map((x, i) => (i === gi ? { ...x, lines: x.lines.filter((_, j) => j !== li) } : x)))}
                    onMove={(dir) => update((gs) => gs.map((x, i) => (i === gi ? { ...x, lines: move(x.lines, li, li + dir) } : x)))}
                    first={li === 0}
                    last={li === g.lines.length - 1}
                  />
                ))}
              </ul>
              <div className="border-t border-dashed border-border px-2 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const line = blankLine();
                    update((gs) => gs.map((x, i) => (i === gi ? { ...x, lines: [...x.lines, line] } : x)));
                    setFocusId(`${line.key}-description`);
                  }}
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add line
                </Button>
              </div>
            </Panel>
          </section>
        ))}
      </div>

      <div className="mt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const g = { key: key(), name: "", lines: [blankLine()] };
            update((gs) => [...gs, g]);
            setFocusId(`${g.key}-name`);
          }}
        >
          <Plus className="size-4" aria-hidden />
          Add stage
        </Button>
      </div>

      {/* Phones: the total and Save stay within thumb reach. */}
      <div className="no-print fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 flex items-center justify-between gap-3 border-t border-border bg-bg px-4 py-3 sm:hidden">
        <span className="text-sm">
          <span className="block text-xs text-ink-3">{gstRatePct ? "Total inc GST" : "Total"}</span>
          <Money cents={totals.totalCents} className="font-semibold text-ink" />
        </span>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
      <div className="h-20 sm:hidden" aria-hidden />
    </form>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex size-9 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-hover hover:text-ink disabled:pointer-events-none disabled:opacity-30 sm:size-7"
    >
      {children}
    </button>
  );
}

const cell = "h-11 rounded-md border border-border bg-bg px-2 text-base text-ink placeholder:text-ink-4 hover:border-border-strong focus:border-ink-4 focus:outline-none sm:h-8 sm:text-sm";

function LineRow({
  line: l,
  index,
  priceCents,
  defaultMarkup,
  onChange,
  onRemove,
  onMove,
  first,
  last,
}: {
  line: DraftLine;
  index: number;
  priceCents: number;
  defaultMarkup: number;
  onChange: (patch: Partial<DraftLine>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  first: boolean;
  last: boolean;
}) {
  const id = (f: string) => `${l.key}-${f}`;
  const qtyBad = parseQty(l.qty) === null;
  const costBad = l.cost.trim() !== "" && dollarsToCents(l.cost) === null;
  return (
    <li className="space-y-2 px-3 py-3">
      <div className="flex items-center gap-2">
        <label htmlFor={id("description")} className="sr-only">
          Line {index + 1} description
        </label>
        <input
          id={id("description")}
          value={l.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What it is"
          className={`${cell} min-w-0 flex-1`}
        />
        <Money cents={priceCents} className="hidden w-28 shrink-0 text-right text-sm font-medium text-ink sm:block" />
        <span className="flex shrink-0 items-center">
          <IconButton label={`Move line ${index + 1} up`} onClick={() => onMove(-1)} disabled={first}>
            <ArrowUp className="size-4" />
          </IconButton>
          <IconButton label={`Move line ${index + 1} down`} onClick={() => onMove(1)} disabled={last}>
            <ArrowDown className="size-4" />
          </IconButton>
          <IconButton label={`Delete line ${index + 1}`} onClick={onRemove}>
            <Trash2 className="size-4" />
          </IconButton>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[9rem_5rem_6rem_7rem_5.5rem]">
        <Labelled htmlFor={id("type")} label="Type" className="col-span-2 sm:col-span-1">
          <select id={id("type")} value={l.type} onChange={(e) => onChange({ type: e.target.value as LineType })} className={`${cell} w-full`}>
            {TYPE_OPTIONS.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </Labelled>
        <Labelled htmlFor={id("qty")} label="Qty">
          <input
            id={id("qty")}
            inputMode="decimal"
            value={l.qty}
            onChange={(e) => onChange({ qty: e.target.value })}
            aria-invalid={qtyBad || undefined}
            className={`${cell} figures w-full text-right aria-invalid:border-danger`}
          />
        </Labelled>
        <Labelled htmlFor={id("unit")} label="Unit">
          <input id={id("unit")} list="units" value={l.unit} onChange={(e) => onChange({ unit: e.target.value })} className={`${cell} w-full`} />
        </Labelled>
        <Labelled htmlFor={id("cost")} label="Your cost">
          <span className="relative block">
            <span aria-hidden className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-ink-3">
              $
            </span>
            <input
              id={id("cost")}
              inputMode="decimal"
              value={l.cost}
              onChange={(e) => onChange({ cost: e.target.value })}
              placeholder="0"
              aria-invalid={costBad || undefined}
              className={`${cell} figures w-full pl-5 text-right aria-invalid:border-danger`}
            />
          </span>
        </Labelled>
        <Labelled htmlFor={id("markup")} label="Markup">
          <span className="relative block">
            <input
              id={id("markup")}
              inputMode="decimal"
              value={l.markup}
              onChange={(e) => onChange({ markup: e.target.value })}
              placeholder={String(defaultMarkup)}
              className={`${cell} figures w-full pr-5 text-right`}
            />
            <span aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-ink-3">
              %
            </span>
          </span>
        </Labelled>
      </div>
      <p className="flex justify-between text-sm sm:hidden">
        <span className="text-ink-3">Amount</span>
        <Money cents={priceCents} className="font-medium text-ink" />
      </p>
    </li>
  );
}

function Labelled({ htmlFor, label, className = "", children }: { htmlFor: string; label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-ink-3">
        {label}
      </label>
      {children}
    </div>
  );
}
