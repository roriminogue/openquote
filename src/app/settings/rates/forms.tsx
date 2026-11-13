import { InputGroup, InputGroupText } from "@astryxdesign/core/InputGroup";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useActionState, useState } from "react";
import { TextField } from "@/components/fields";
import { Money } from "@/components/money";
import { FINISH_LEVELS } from "@/lib/rates-schema";
import { FormFooter } from "../form-footer";
import { Fields, SettingsSection } from "../parts";
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

/** A percentage field with the % sign set beside it. */
function Pct({
  name,
  label,
  description,
  value,
  onChange,
  placeholder,
  disabled,
  invalid,
}: {
  name: string;
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <InputGroup
      label={label}
      description={description}
      isDisabled={disabled}
      status={invalid ? { type: "error" } : undefined}
    >
      <TextInput
        id={name}
        label={label}
        htmlName={name}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        controlClassName="[&_input]:text-right [&_input]:tabular-nums"
      />
      <InputGroupText>%</InputGroupText>
    </InputGroup>
  );
}

/** Markup and GST, with a worked example that updates as you type. */
export function MarkupForm({ initial, canEdit }: { initial: Markup; canEdit: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(saveMarkup, { status: "idle" });
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
    <form action={action} noValidate>
      <SettingsSection id="markup" title="Markup and GST">
        <Fields>
          <div className="max-w-48">
            <Pct
              name="defaultMarkupPct"
              label="Default markup"
              description="Added on top of your cost for every line."
              value={values.defaultMarkupPct}
              onChange={set("defaultMarkupPct")}
              disabled={!canEdit}
              invalid={state.field === "defaultMarkupPct"}
            />
          </div>
          <div>
            <Text as="p" display="block" type="label" color="secondary" weight="medium">
              Markup by line type
            </Text>
            <Text as="p" display="block" type="supporting">
              Leave blank to use the default.
            </Text>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
              {TYPES.map(([key, label]) => (
                <Pct
                  key={key}
                  name={key}
                  label={label}
                  value={values[key]}
                  onChange={set(key)}
                  placeholder={values.defaultMarkupPct || "0"}
                  disabled={!canEdit}
                  invalid={state.field === key}
                />
              ))}
            </div>
          </div>
          <Switch
            label="Registered for GST"
            description={`Adds ${initial.gstRate}% GST to estimate totals.`}
            htmlName="gstRegistered"
            value={gst}
            onChange={setGst}
            isDisabled={!canEdit}
          />
          <div className="rounded-(--radius-element) bg-(--color-background-muted) px-3 py-2.5">
            <Text as="p" display="block" type="supporting">
              A line that costs you $100 in materials comes to
            </Text>
            <Text as="p" display="block" hasTabularNumbers>
              <Text type="inherit" weight="semibold">
                <Money cents={exGst} />
              </Text>{" "}
              ex GST
              {gst && (
                <>
                  {" · "}
                  <Text type="inherit" weight="semibold">
                    <Money cents={incGst} />
                  </Text>{" "}
                  inc GST
                </>
              )}
            </Text>
          </div>
        </Fields>
        {canEdit && <FormFooter message={state.message} error={state.status === "error"} />}
      </SettingsSection>
    </form>
  );
}

type Context = { trades: string; finishLevel: "basic" | "standard" | "premium"; postcode: string };

/** What the AI should assume when it prices materials it has no rate for. */
export function BusinessContextForm({ initial, canEdit }: { initial: Context; canEdit: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(saveBusinessContext, { status: "idle" });
  const [finish, setFinish] = useState(initial.finishLevel);
  const finishHint = FINISH_LEVELS.find(([k]) => k === finish)?.[2];
  const bad = (f: string) => (state.field === f ? ({ type: "error" } as const) : undefined);

  return (
    <form action={action} noValidate>
      <SettingsSection id="context" title="What the AI assumes">
        <Fields>
          <TextField
            name="trades"
            label="Trades"
            description="What you do, separated by commas."
            defaultValue={initial.trades}
            placeholder="carpenter, deck builder"
            autoComplete="off"
            isDisabled={!canEdit}
            status={bad("trades")}
          />
          <div>
            <div aria-hidden className="mb-1.5">
              <Text as="p" display="block" type="label" color="secondary" weight="medium">
                Finish level
              </Text>
            </div>
            <input type="hidden" name="finishLevel" value={finish} />
            <div className="sm:max-w-md">
              <SegmentedControl
                label="Finish level"
                value={finish}
                onChange={(v) => canEdit && setFinish(v as Context["finishLevel"])}
                layout="fill"
              >
                {FINISH_LEVELS.map(([k, l]) => (
                  <SegmentedControlItem key={k} value={k} label={l} />
                ))}
              </SegmentedControl>
            </div>
            {finishHint && (
              <div className="mt-1.5">
                <Text as="p" display="block" type="supporting">
                  {finishHint}
                </Text>
              </div>
            )}
          </div>
          <div className="max-w-72">
            <TextField
              name="postcode"
              label="Postcode"
              description="Where you mostly work, for local prices and travel."
              inputMode="numeric"
              {...{ maxLength: 4 }}
              defaultValue={initial.postcode}
              placeholder="3056"
              autoComplete="postal-code"
              isDisabled={!canEdit}
              status={bad("postcode")}
            />
          </div>
        </Fields>
        {canEdit && <FormFooter message={state.message} error={state.status === "error"} />}
      </SettingsSection>
    </form>
  );
}
