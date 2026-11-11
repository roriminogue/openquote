"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { InputGroup, InputGroupText } from "@astryxdesign/core/InputGroup";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { ArrowDown, ArrowUp, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BackLink } from "@/components/back-link";
import { Money } from "@/components/money";
import type { EditLine } from "@/lib/estimate/edit-schema";
import { parseQty } from "@/lib/estimate/edit-schema";
import {
  estimateTotals,
  formatEstimateNo,
  linePriceCents,
  resolveMarkupPct,
  type LineType,
  type MarkupSettings,
} from "@/lib/pricing";
import { centsToDollars, dollarsToCents, RATE_UNITS } from "@/lib/rates-schema";
import { saveEstimate, saveLineAsRate } from "./actions";

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

const TYPE_OPTIONS: { value: LineType; label: string }[] = [
  { value: "material", label: "Materials" },
  { value: "labour", label: "Labour" },
  { value: "subbie", label: "Subcontractor" },
  { value: "other", label: "Other" },
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

  // Warn before throwing away unsaved edits: closing or reloading the tab (beforeunload), and following any link
  // inside the app (Cancel, Back, the sidebar, the phone tab bar), which beforeunload never sees because Next.js
  // navigates without unloading the page. Runs in the capture phase so it gets in before the link's own handler.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    const leaving = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const to = new URL(link.href, window.location.href);
      if (to.origin !== window.location.origin || to.pathname === window.location.pathname) return;
      if (window.confirm("Leave without saving? Your changes to this estimate will be lost.")) return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", leaving, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", leaving, true);
    };
  }, [dirty]);

  const update = (fn: (gs: DraftGroup[]) => DraftGroup[]) => {
    setGroups(fn);
    setDirty(true);
  };
  const setLine = (gi: number, li: number, patch: Partial<DraftLine>) =>
    update((gs) =>
      gs.map((g, i) => (i !== gi ? g : { ...g, lines: g.lines.map((l, j) => (j === li ? { ...l, ...patch } : l)) })),
    );
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
          const line = {
            type: l.type,
            qty: parseQty(l.qty) ?? 0,
            unitCostCents: dollarsToCents(l.cost) ?? 0,
            markupPct: num(l.markup),
          };
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
      setError(
        `Check the numbers in stage ${bad[0] + 1}, line ${bad[1] + 1}: quantity, cost and markup must be numbers.`,
      );
      document.getElementById(`${groups[bad[0]].lines[bad[1]].key}-qty`)?.focus();
      return;
    }
    setBusy(true);
    const res = await saveEstimate(estimateId, {
      title,
      groups: groups.map((g, gi) => ({ name: g.name, lines: lines[gi] })),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDirty(false);
    router.push(`/estimates/${estimateId}`);
  }

  const totalLabel = gstRatePct ? "Total inc GST" : "Total";

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
      <BackLink href={`/estimates/${estimateId}`} label="Back to estimate" />

      <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1">
          <Text as="p" type="supporting" hasTabularNumbers>
            Editing {formatEstimateNo(number)}
          </Text>
          <div className="mt-2">
            <TextArea
              id="title"
              label="Title"
              rows={2}
              value={title}
              onChange={(next) => {
                setTitle(next.replace(/\n/g, " "));
                setDirty(true);
              }}
              width="100%"
            />
          </div>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex sm:pt-7">
          <Button href={`/estimates/${estimateId}`} label="Cancel" variant="ghost" />
          <Button type="submit" label={busy ? "Saving…" : "Save changes"} variant="primary" isLoading={busy} />
        </div>
      </header>

      <section aria-label="Totals" className="mt-6 grid grid-cols-3">
        {(
          [
            [totalLabel, totals.totalCents],
            ["Price ex GST", totals.subtotalCents],
            ["Your cost", totals.costCents],
          ] as const
        ).map(([label, cents]) => (
          <div
            key={label}
            className="min-w-0 border-l border-(--color-border) px-3 first:border-l-0 first:pl-0 sm:px-6"
          >
            <Text as="p" type="supporting" weight="medium">
              {label}
            </Text>
            <div className="mt-1.5">
              <Text as="p" type="large" weight="semibold" hasTabularNumbers>
                <Money cents={cents} />
              </Text>
            </div>
          </div>
        ))}
      </section>

      {error && (
        <div className="mt-6" role="alert">
          <Banner status="error" title={error} />
        </div>
      )}

      <datalist id="units">
        {RATE_UNITS.map(([u]) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      <div className="mt-8 flex flex-col gap-8">
        {groups.map((g, gi) => (
          <section key={g.key} aria-label={`Stage ${gi + 1}`}>
            <div className="mb-3 flex items-center gap-2">
              <span aria-hidden className="w-5 shrink-0 text-center tabular-nums text-(--color-text-secondary)">
                {gi + 1}
              </span>
              <div className="min-w-0 flex-1">
                <TextInput
                  id={`${g.key}-name`}
                  label={`Stage ${gi + 1} name`}
                  isLabelHidden
                  value={g.name}
                  onChange={(name) => update((gs) => gs.map((x, i) => (i === gi ? { ...x, name } : x)))}
                  placeholder="Stage name"
                  width="100%"
                />
              </div>
              <span className="hidden shrink-0 sm:inline">
                <Text weight="semibold">
                  <Money cents={priced[gi].lines.reduce((s, l) => s + l.priceCents, 0)} />
                </Text>
              </span>
              <DropdownMenu
                aria-label={`Stage ${gi + 1} actions`}
                presentation="adaptive"
                placement="below"
                alignment="end"
                hasChevron={false}
                renderTrigger={(trigger) => (
                  <IconButton
                    {...trigger}
                    label={`Stage ${gi + 1} actions`}
                    variant="ghost"
                    icon={<Icon icon={MoreHorizontal} />}
                  />
                )}
                items={[
                  {
                    label: "Move up",
                    icon: ArrowUp,
                    isDisabled: gi === 0,
                    onClick: () => update((gs) => move(gs, gi, gi - 1)),
                  },
                  {
                    label: "Move down",
                    icon: ArrowDown,
                    isDisabled: gi === groups.length - 1,
                    onClick: () => update((gs) => move(gs, gi, gi + 1)),
                  },
                  { type: "divider" },
                  {
                    label: "Delete stage",
                    icon: Trash2,
                    variant: "destructive",
                    isDisabled: groups.length === 1,
                    onClick: () => {
                      if (
                        g.lines.length === 0 ||
                        window.confirm(`Delete “${g.name || "this stage"}” and its ${g.lines.length} lines?`)
                      )
                        update((gs) => gs.filter((_, i) => i !== gi));
                    },
                  },
                ]}
              />
            </div>

            <Card padding={0}>
              <ul className="divide-y divide-dashed divide-(--color-border)">
                {g.lines.map((l, li) => (
                  <LineRow
                    key={l.key}
                    line={l}
                    stage={gi + 1}
                    index={li}
                    priceCents={priced[gi].lines[li].priceCents}
                    defaultMarkup={resolveMarkupPct(
                      { type: l.type, qty: 0, unitCostCents: 0, markupPct: null },
                      markup,
                      estimateMarkupPct,
                    )}
                    onChange={(patch) => setLine(gi, li, patch)}
                    onRemove={() =>
                      update((gs) =>
                        gs.map((x, i) => (i === gi ? { ...x, lines: x.lines.filter((_, j) => j !== li) } : x)),
                      )
                    }
                    onMove={(dir) =>
                      update((gs) => gs.map((x, i) => (i === gi ? { ...x, lines: move(x.lines, li, li + dir) } : x)))
                    }
                    first={li === 0}
                    last={li === g.lines.length - 1}
                  />
                ))}
              </ul>
              <div className="border-t border-dashed border-(--color-border) px-2 py-2">
                <Button
                  label="Add line"
                  variant="ghost"
                  size="sm"
                  icon={<Icon icon={Plus} />}
                  onClick={() => {
                    const line = blankLine();
                    update((gs) => gs.map((x, i) => (i === gi ? { ...x, lines: [...x.lines, line] } : x)));
                    setFocusId(`${line.key}-description`);
                  }}
                />
              </div>
            </Card>
          </section>
        ))}
      </div>

      <div className="mt-6">
        <Button
          label="Add stage"
          icon={<Icon icon={Plus} />}
          onClick={() => {
            const g = { key: key(), name: "", lines: [blankLine()] };
            update((gs) => [...gs, g]);
            setFocusId(`${g.key}-name`);
          }}
        />
      </div>

      {/* Phones: the total and Save stay within thumb reach, just above the tab bar. */}
      <div className="no-print fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 flex items-center justify-between gap-3 border-t border-(--color-border) bg-(--color-background-surface) px-4 py-2.5 sm:hidden">
        <div className="min-w-0">
          <Text as="p" type="supporting" display="block">
            {totalLabel}
          </Text>
          <Text as="p" weight="semibold" display="block">
            <Money cents={totals.totalCents} />
          </Text>
        </div>
        <Button type="submit" label={busy ? "Saving…" : "Save changes"} variant="primary" isLoading={busy} />
      </div>
      <div className="h-20 sm:hidden" aria-hidden />
    </form>
  );
}

/**
 * One line, laid out the same at every width: what it is, then its numbers, then the amount with the line's own
 * move and delete buttons, so on a phone the description gets the whole width.
 */
function LineRow({
  line: l,
  stage,
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
  stage: number;
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
  // Each field's spoken name says which line it is on, so a screen reader moving through the form knows where it is.
  const where = `stage ${stage}, line ${index + 1}`;
  const qtyBad = parseQty(l.qty) === null;
  const costBad = l.cost.trim() !== "" && dollarsToCents(l.cost) === null;
  const numeric = "[&_input]:text-right [&_input]:tabular-nums";
  return (
    <li className="flex flex-col gap-3 px-3 py-4 sm:px-4">
      <TextArea
        id={id("description")}
        label={`Description, ${where}`}
        isLabelHidden
        rows={2}
        value={l.description}
        onChange={(description) => onChange({ description: description.replace(/\n/g, " ") })}
        placeholder="What it is"
        width="100%"
      />
      <div className="grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-[9rem_5.5rem_6.5rem_8rem_6.5rem]">
        <div className="col-span-2 sm:col-span-1">
          <Selector
            label="Type"
            options={TYPE_OPTIONS}
            value={l.type}
            onChange={(type) => onChange({ type: type as LineType })}
            presentation="adaptive"
            width="100%"
            aria-label={`Type, ${where}`}
          />
        </div>
        <TextInput
          id={id("qty")}
          label="Qty"
          aria-label={`Quantity, ${where}`}
          inputMode="decimal"
          value={l.qty}
          onChange={(qty) => onChange({ qty })}
          status={qtyBad ? { type: "error" } : undefined}
          width="100%"
          controlClassName={numeric}
        />
        <TextInput
          id={id("unit")}
          label="Unit"
          aria-label={`Unit, ${where}`}
          value={l.unit}
          onChange={(unit) => onChange({ unit })}
          autoCapitalize="none"
          width="100%"
          {...{ list: "units" }}
        />
        <InputGroup label="Your cost">
          <InputGroupText>$</InputGroupText>
          <TextInput
            id={id("cost")}
            label={`Your cost, ${where}`}
            inputMode="decimal"
            value={l.cost}
            onChange={(cost) => onChange({ cost })}
            placeholder="0"
            status={costBad ? { type: "error" } : undefined}
            controlClassName={numeric}
          />
        </InputGroup>
        <InputGroup label="Markup">
          <TextInput
            id={id("markup")}
            label={`Markup, ${where}`}
            inputMode="decimal"
            value={l.markup}
            onChange={(markup) => onChange({ markup })}
            placeholder={String(defaultMarkup)}
            controlClassName={numeric}
          />
          <InputGroupText>%</InputGroupText>
        </InputGroup>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Text type="supporting">Amount </Text>
          <Text weight="medium">
            <Money cents={priceCents} />
          </Text>
        </div>
        <span className="-mr-1.5 flex shrink-0 items-center">
          <IconButton
            label={`Move line ${index + 1} up`}
            variant="ghost"
            icon={<Icon icon={ArrowUp} />}
            onClick={() => onMove(-1)}
            isDisabled={first}
          />
          <IconButton
            label={`Move line ${index + 1} down`}
            variant="ghost"
            icon={<Icon icon={ArrowDown} />}
            onClick={() => onMove(1)}
            isDisabled={last}
          />
          <IconButton
            label={`Delete line ${index + 1}`}
            variant="ghost"
            icon={<Icon icon={Trash2} />}
            onClick={onRemove}
          />
        </span>
      </div>
      <SaveAsRate l={l} onSaved={onChange} />
    </li>
  );
}

/**
 * Offered on a labour or material line whose price is the tradie's own or an AI guess: saving it as a rate means
 * every future estimate uses it.
 */
function SaveAsRate({ l, onSaved }: { l: DraftLine; onSaved: (patch: Partial<DraftLine>) => void }) {
  const [state, setState] = useState<{ busy: boolean; error: string | null; saved: boolean }>({
    busy: false,
    error: null,
    saved: false,
  });
  const cents = dollarsToCents(l.cost);
  const changed = cents !== null && cents !== l.originalCostCents;
  const eligible =
    (l.type === "labour" || l.type === "material") &&
    cents !== null &&
    cents > 0 &&
    l.description.trim() !== "" &&
    (changed || l.source === "ai");
  if (state.saved)
    return (
      <Text as="p" type="supporting">
        Saved to your rates. Future estimates will use it.
      </Text>
    );
  if (!eligible || l.source === "rate_rule") return null;

  async function save() {
    setState({ busy: true, error: null, saved: false });
    const res = await saveLineAsRate({ title: l.description, cost: l.cost, unit: l.unit, type: l.type });
    if (!res.ok) return setState({ busy: false, error: res.error, saved: false });
    onSaved({ source: "rate_rule", sourceRef: res.id, originalCostCents: cents });
    setState({ busy: false, error: null, saved: true });
  }

  return (
    <div className="-ml-2 flex flex-col items-start gap-2">
      <Button
        label={`Save $${l.cost.replace(/^\$/, "")} per ${l.unit || "unit"} as my rate`}
        variant="ghost"
        size="sm"
        icon={<Icon icon={Plus} />}
        onClick={save}
        isLoading={state.busy}
      />
      {state.error && (
        <div className="ml-2">
          <Banner status="error" title={state.error} />
        </div>
      )}
    </div>
  );
}
