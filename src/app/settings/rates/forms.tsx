"use client";

import { Gem, Hammer, Sparkles } from "lucide-react";
import { useActionState, useState } from "react";
import { Money } from "@/components/money";
import { Segmented } from "@/components/record-forms";
import { Button, GroupTitle, Input, Notice, Panel, Row, Rows } from "@/components/ui";
import { FINISH_LEVELS } from "@/lib/rates-schema";
import { saveBusinessContext, saveMarkup, type FormState } from "./actions";

type Markup = {
  defaultMarkupPct: number;
  markupMaterialsPct: number | null;
  markupLabourPct: number | null;
  markupSubbiePct: number | null;
  markupOtherPct: number | null;
  gstRegistered: boolean;
  gstRate: number;
};

const TYPES = [
  ["markupMaterialsPct", "Materials"],
  ["markupLabourPct", "Labour"],
  ["markupSubbiePct", "Subcontractors"],
  ["markupOtherPct", "Other"],
] as const;

const pctText = (n: number | null) => (n === null ? "" : String(n));

/** A percentage input with the % sign set inside the field. */
function Pct({ id, value, onChange, placeholder, disabled, invalid }: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <span className="relative block">
      <Input
        id={id}
        name={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className="figures pr-8 text-right"
      />
      <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-3">
        %
      </span>
    </span>
  );
}

function Footer({ state, pending, disabled }: { state: FormState; pending: boolean; disabled: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-dashed border-border px-4 py-4 sm:px-5">
      {state.message && (
        <div className="mr-auto min-w-0" aria-live="polite">
          <Notice tone={state.status === "error" ? "error" : "ok"}>{state.message}</Notice>
        </div>
      )}
      <Button className="max-sm:w-full" disabled={pending || disabled}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

/** Markup and GST, with a worked example that updates as you type. */
export function MarkupForm({ initial, canEdit }: { initial: Markup; canEdit: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveMarkup, { status: "idle" });
  const [values, setValues] = useState({
    defaultMarkupPct: pctText(initial.defaultMarkupPct),
    markupMaterialsPct: pctText(initial.markupMaterialsPct),
    markupLabourPct: pctText(initial.markupLabourPct),
    markupSubbiePct: pctText(initial.markupSubbiePct),
    markupOtherPct: pctText(initial.markupOtherPct),
  });
  const [gst, setGst] = useState(initial.gstRegistered);
  const set = (k: keyof typeof values) => (v: string) => setValues((s) => ({ ...s, [k]: v }));

  const num = (v: string) => (v.trim() === "" || !Number.isFinite(Number(v)) ? null : Number(v));
  const def = num(values.defaultMarkupPct) ?? 0;
  const materials = num(values.markupMaterialsPct) ?? def;
  const exGst = Math.round(10000 * (1 + materials / 100));
  const incGst = gst ? Math.round(exGst * (1 + initial.gstRate / 100)) : exGst;

  return (
    <section aria-labelledby="markup" className="mt-10">
      <GroupTitle id="markup">Markup and GST</GroupTitle>
      <form action={action}>
        <Panel>
          <Rows>
            <Row label="Default markup" htmlFor="defaultMarkupPct" hint="Added on top of your cost for every line.">
              <div className="sm:w-32 sm:min-w-0">
                <Pct
                  id="defaultMarkupPct"
                  value={values.defaultMarkupPct}
                  onChange={set("defaultMarkupPct")}
                  disabled={!canEdit}
                  invalid={state.field === "defaultMarkupPct"}
                />
              </div>
            </Row>
            <Row label="Markup by line type" hint="Leave blank to use the default.">
              <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:w-[22rem]">
                {TYPES.map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <label htmlFor={key} className="block text-xs font-medium text-ink-3">
                      {label}
                    </label>
                    <Pct
                      id={key}
                      value={values[key]}
                      onChange={set(key)}
                      placeholder={values.defaultMarkupPct || "0"}
                      disabled={!canEdit}
                      invalid={state.field === key}
                    />
                  </div>
                ))}
              </div>
            </Row>
            <Row label="Registered for GST" htmlFor="gstRegistered" hint={`Adds ${initial.gstRate}% GST to estimate totals.`}>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  id="gstRegistered"
                  name="gstRegistered"
                  type="checkbox"
                  role="switch"
                  checked={gst}
                  onChange={(e) => setGst(e.target.checked)}
                  disabled={!canEdit}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="h-6 w-10 rounded-full bg-border-strong transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-disabled:opacity-50 sm:h-5 sm:w-9"
                />
                <span
                  aria-hidden
                  className="absolute left-0.5 size-5 rounded-full bg-bg shadow-sm transition-transform peer-checked:translate-x-4 sm:size-4"
                />
              </label>
            </Row>
            <Row label="Example" hint="A line that costs you $100 in materials.">
              <p className="text-sm sm:text-right">
                <Money cents={exGst} className="font-medium text-ink" /> <span className="text-ink-3">ex GST</span>
                {gst && (
                  <>
                    <span className="text-ink-3"> · </span>
                    <Money cents={incGst} className="font-medium text-ink" /> <span className="text-ink-3">inc GST</span>
                  </>
                )}
              </p>
            </Row>
          </Rows>
          {canEdit && <Footer state={state} pending={pending} disabled={!canEdit} />}
        </Panel>
      </form>
    </section>
  );
}

type Context = { trades: string; finishLevel: "basic" | "standard" | "premium"; postcode: string };

/** What the AI should assume when it prices materials it has no rate for. */
export function BusinessContextForm({ initial, canEdit }: { initial: Context; canEdit: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBusinessContext, { status: "idle" });
  const [finish, setFinish] = useState(initial.finishLevel);
  const finishHint = FINISH_LEVELS.find(([k]) => k === finish)?.[2];

  return (
    <section aria-labelledby="context" className="mt-10">
      <GroupTitle id="context">What the AI assumes</GroupTitle>
      <form action={action}>
        <Panel>
          <Rows>
            <Row label="Trades" htmlFor="trades" hint="What you do, separated by commas.">
              <Input
                id="trades"
                name="trades"
                defaultValue={initial.trades}
                placeholder="carpenter, deck builder"
                autoComplete="off"
                disabled={!canEdit}
                aria-invalid={state.field === "trades" || undefined}
              />
            </Row>
            <Row label="Finish level" hint={finishHint}>
              <input type="hidden" name="finishLevel" value={finish} />
              <Segmented
                className="sm:w-[22rem]"
                value={finish}
                onChange={(v) => canEdit && setFinish(v)}
                options={[
                  ["basic", "Basic", Hammer],
                  ["standard", "Standard", Sparkles],
                  ["premium", "Premium", Gem],
                ]}
              />
            </Row>
            <Row label="Postcode" htmlFor="postcode" hint="Where you mostly work, for local prices and travel.">
              <div className="sm:w-32 sm:min-w-0">
                <Input
                  id="postcode"
                  name="postcode"
                  inputMode="numeric"
                  maxLength={4}
                  defaultValue={initial.postcode}
                  placeholder="3056"
                  autoComplete="postal-code"
                  disabled={!canEdit}
                  aria-invalid={state.field === "postcode" || undefined}
                  className="figures"
                />
              </div>
            </Row>
          </Rows>
          {canEdit && <Footer state={state} pending={pending} disabled={!canEdit} />}
        </Panel>
      </form>
    </section>
  );
}
