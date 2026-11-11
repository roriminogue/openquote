"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon } from "@astryxdesign/core/Icon";
import { InputGroup, InputGroupText } from "@astryxdesign/core/InputGroup";
import { List, ListItem } from "@astryxdesign/core/List";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Hammer, Package, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Money } from "@/components/money";
import { focusField, Segmented, type FormError } from "@/components/record-forms";
import { SectionTitle } from "@/components/section-title";
import { Sheet } from "@/components/sheet";
import type { RateRow } from "@/lib/rates";
import { centsToDollars, RATE_TYPES, RATE_UNITS } from "@/lib/rates-schema";
import { unitLabel } from "@/lib/units";
import { addRate, editRate, removeRate } from "./actions";

type Draft = { title: string; rate: string; unit: string; type: "labour" | "material" };
const empty: Draft = { title: "", rate: "", unit: "hour", type: "labour" };

const toDraft = (r: RateRow): Draft => ({
  title: r.title,
  rate: centsToDollars(r.rateCents),
  unit: r.unit,
  type: r.type,
});

/** The tradie's own prices. OpenQuote AU uses these instead of guessing wherever a line matches one. */
export function RatesList({ rates: initial, canEdit }: { rates: RateRow[]; canEdit: boolean }) {
  const [rates, setRates] = useState(initial);
  const [editing, setEditing] = useState<RateRow | "new" | null>(null);

  const add = canEdit && (
    <Button label="Add rate" size="sm" icon={<Icon icon={Plus} />} onClick={() => setEditing("new")} />
  );

  return (
    <section aria-labelledby="rates" className="mt-8">
      <SectionTitle id="rates" action={rates.length > 0 && add}>
        Your rates
      </SectionTitle>
      {rates.length === 0 ? (
        <Card>
          <EmptyState
            title="No rates yet"
            description="Add what you charge for labour and the materials you buy often. Estimates use these before any AI guess."
            actions={add || undefined}
            isCompact
          />
        </Card>
      ) : (
        <Card>
          <List hasDividers edge="outset">
            {rates.map((r) => (
              <ListItem
                key={r.id}
                onClick={canEdit ? () => setEditing(r) : undefined}
                startContent={<Icon icon={r.type === "labour" ? Hammer : Package} color="secondary" />}
                label={
                  <Text weight="medium" maxLines={2}>
                    {r.title}
                  </Text>
                }
                description={r.type === "labour" ? "Labour" : "Material"}
                endContent={
                  <Text hasTabularNumbers>
                    <Text type="inherit" weight="medium">
                      <Money cents={r.rateCents} />
                    </Text>
                    <Text type="inherit" color="secondary">
                      {" "}
                      / {unitLabel(r.unit, 1)}
                    </Text>
                  </Text>
                }
              />
            ))}
          </List>
        </Card>
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
  const set = (k: keyof Draft) => (value: string) => setDraft((d) => ({ ...d, [k]: value }));
  const bad = (f: string) => (error?.field === f ? ({ type: "error" } as const) : undefined);
  const knownUnit = RATE_UNITS.some(([u]) => u === draft.unit);
  const units = [
    ...(knownUnit ? [] : [{ value: draft.unit, label: draft.unit }]),
    ...RATE_UNITS.map(([u, l]) => ({ value: u, label: l })),
  ];

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
    <Sheet
      open
      title={rate ? "Edit rate" : "New rate"}
      onClose={onClose}
      action={rate ? "Save" : "Add rate"}
      busy={busy}
      onSubmit={save}
    >
      <div className="flex flex-col gap-5">
        <div>
          <div aria-hidden className="mb-1.5">
            <Text as="p" display="block" type="label" color="secondary" weight="medium">
              Type
            </Text>
          </div>
          <Segmented
            label="Type"
            value={draft.type}
            onChange={(type) =>
              setDraft((d) => ({ ...d, type, unit: d.unit === "hour" && type === "material" ? "each" : d.unit }))
            }
            options={RATE_TYPES.map(([k, l]) => [k, l, k === "labour" ? Hammer : Package] as const)}
          />
        </div>

        <TextInput
          id="rateTitle"
          label="Name"
          description={
            draft.type === "labour"
              ? "Who does the work, like Qualified carpenter or Apprentice."
              : "What it is, like Merbau decking 90×19."
          }
          value={draft.title}
          onChange={set("title")}
          autoComplete="off"
          status={bad("title")}
          width="100%"
        />

        <div className="grid grid-cols-2 gap-3">
          <InputGroup label="Your cost" description="Ex GST, before markup." status={bad("rate")}>
            <InputGroupText>$</InputGroupText>
            <TextInput
              id="rate"
              label="Your cost"
              inputMode="decimal"
              value={draft.rate}
              onChange={set("rate")}
              placeholder="95"
              autoComplete="off"
              controlClassName="[&_input]:tabular-nums"
            />
          </InputGroup>
          <Selector
            label="Per"
            description="The unit it's priced in."
            options={units}
            value={draft.unit}
            onChange={(unit) => setDraft((d) => ({ ...d, unit }))}
            presentation="adaptive"
            status={bad("unit")}
            width="100%"
          />
        </div>

        {error && <Banner status="error" title={error.message} />}

        {rate && (
          <div className="border-t border-dashed border-(--color-border) pt-5">
            {confirmDelete ? (
              <div className="flex flex-col gap-3">
                <Text as="p" display="block">Delete this rate? Existing estimates keep their prices.</Text>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button label="Keep" onClick={() => setConfirmDelete(false)} width="100%" />
                  <Button label="Delete rate" variant="destructive" onClick={remove} isLoading={busy} width="100%" />
                </div>
              </div>
            ) : (
              <Button label="Delete rate" variant="destructive" onClick={() => setConfirmDelete(true)} />
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
