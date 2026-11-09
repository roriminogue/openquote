"use client";

import { Hammer, Package, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Money } from "@/components/money";
import { focusField, Segmented, type FormError } from "@/components/record-forms";
import { Sheet } from "@/components/sheet";
import { Button, EmptyState, Field, GroupTitle, Input, Notice, Panel, Select } from "@/components/ui";
import type { RateRow } from "@/lib/rates";
import { centsToDollars, RATE_TYPES, RATE_UNITS } from "@/lib/rates-schema";
import { unitLabel } from "@/lib/units";
import { addRate, editRate, removeRate } from "./actions";

type Draft = { title: string; rate: string; unit: string; type: "labour" | "material" };
const empty: Draft = { title: "", rate: "", unit: "hour", type: "labour" };

const toDraft = (r: RateRow): Draft => ({ title: r.title, rate: centsToDollars(r.rateCents), unit: r.unit, type: r.type });

/** The tradie's own prices. OpenQuote AU uses these instead of guessing wherever a line matches one. */
export function RatesList({ rates: initial, canEdit }: { rates: RateRow[]; canEdit: boolean }) {
  const [rates, setRates] = useState(initial);
  const [editing, setEditing] = useState<RateRow | "new" | null>(null);

  const add = canEdit && (
    <Button variant="secondary" size="sm" onClick={() => setEditing("new")}>
      <Plus className="size-3.5" aria-hidden />
      Add rate
    </Button>
  );

  return (
    <section aria-labelledby="rates" className="mt-8">
      <GroupTitle id="rates" action={rates.length > 0 && add}>
        Your rates
      </GroupTitle>
      {rates.length === 0 ? (
        <EmptyState title="No rates yet" action={add || undefined}>
          Add what you charge for labour and the materials you buy often. Estimates use these before any AI guess.
        </EmptyState>
      ) : (
        <Panel>
          <ul className="divide-y divide-dashed divide-border px-2 sm:px-3">
            {rates.map((r) => {
              const Icon = r.type === "labour" ? Hammer : Package;
              const body = (
                <>
                  <Icon className="size-4 shrink-0 text-ink-3" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{r.title}</span>
                    <span className="block text-xs text-ink-3">{r.type === "labour" ? "Labour" : "Material"}</span>
                  </span>
                  <span className="shrink-0 text-sm">
                    <Money cents={r.rateCents} className="font-medium text-ink" />
                    <span className="text-ink-3"> / {unitLabel(r.unit, 1)}</span>
                  </span>
                </>
              );
              return (
                <li key={r.id}>
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => setEditing(r)}
                      className="flex min-h-14 w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-hover/60"
                      aria-label={`Edit ${r.title}`}
                    >
                      {body}
                    </button>
                  ) : (
                    <div className="flex min-h-14 items-center gap-3 px-2 py-2.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {editing && (
        <RateEditor
          rate={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(row) => {
            setRates((rs) => {
              const next = rs.some((x) => x.id === row.id) ? rs.map((x) => (x.id === row.id ? row : x)) : [...rs, row];
              return next.sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));
            });
            setEditing(null);
          }}
          onDeleted={(id) => {
            setRates((rs) => rs.filter((x) => x.id !== id));
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}

function RateEditor({
  rate,
  onClose,
  onSaved,
  onDeleted,
}: {
  rate: RateRow | null;
  onClose: () => void;
  onSaved: (r: RateRow) => void;
  onDeleted: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(rate ? toDraft(rate) : empty);
  const [error, setError] = useState<FormError>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k: keyof Draft) => (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const invalid = (f: string) => (error?.field === f ? true : undefined);
  const knownUnit = RATE_UNITS.some(([u]) => u === draft.unit);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const res = rate ? await editRate(rate.id, draft) : await addRate(draft);
    setBusy(false);
    if (!res.ok) {
      setError({ message: res.error, field: res.field });
      focusField(res.field === "title" ? "rateTitle" : res.field);
      return;
    }
    onSaved(res.value);
  }

  async function remove() {
    if (!rate) return;
    setBusy(true);
    const res = await removeRate(rate.id);
    setBusy(false);
    if (!res.ok) {
      setError({ message: res.error });
      return;
    }
    onDeleted(rate.id);
  }

  return (
    <Sheet open title={rate ? "Edit rate" : "New rate"} onClose={onClose} action={rate ? "Save" : "Add rate"} busy={busy} onSubmit={save}>
      <div className="space-y-5">
        <fieldset>
          <legend className="text-sm font-medium">Type</legend>
          <Segmented
            className="mt-1.5"
            value={draft.type}
            onChange={(type) => setDraft((d) => ({ ...d, type, unit: d.unit === "hour" && type === "material" ? "each" : d.unit }))}
            options={RATE_TYPES.map(([k, l]) => [k, l, k === "labour" ? Hammer : Package] as const)}
          />
        </fieldset>

        <Field id="rateTitle" label="Name" hint={draft.type === "labour" ? "Who does the work, like Qualified carpenter or Apprentice." : "What it is, like Merbau decking 90×19."}>
          <Input id="rateTitle" value={draft.title} onChange={set("title")} autoComplete="off" aria-invalid={invalid("title")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id="rate" label="Your cost" hint="Ex GST, before markup.">
            <span className="relative block">
              <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-3">
                $
              </span>
              <Input
                id="rate"
                inputMode="decimal"
                value={draft.rate}
                onChange={set("rate")}
                placeholder="95"
                autoComplete="off"
                aria-invalid={invalid("rate")}
                className="figures pl-7"
              />
            </span>
          </Field>
          <Field id="unit" label="Per">
            <Select id="unit" value={draft.unit} onChange={set("unit")} aria-invalid={invalid("unit")}>
              {!knownUnit && <option value={draft.unit}>{draft.unit}</option>}
              {RATE_UNITS.map(([u, l]) => (
                <option key={u} value={u}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {error && <Notice tone="error">{error.message}</Notice>}

        {rate && (
          <div className="border-t border-dashed border-border pt-5">
            {confirmDelete ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="mr-auto text-sm text-ink-2">Delete this rate? Existing estimates keep their prices.</p>
                <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Keep
                </Button>
                <Button type="button" variant="danger" onClick={remove} disabled={busy}>
                  Delete rate
                </Button>
              </div>
            ) : (
              <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete rate
              </Button>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
