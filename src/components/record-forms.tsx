import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { Field } from "@astryxdesign/core/Field";
import { Icon } from "@astryxdesign/core/Icon";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Selector } from "@astryxdesign/core/Selector";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Building2, MapPin, Plus, User } from "lucide-react";
import type { ClientOption } from "@/lib/project-schema";

// The fields for a project and for a client. They hold no state: the editor that wraps them does, so the same
// fields work inside the New estimate flow, on the Projects page and on the Clients page.

const STATUSES = [
  ["quoting", "Quoting"],
  ["active", "Active"],
  ["on_hold", "On hold"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
] as const;

export const emptyProject = { name: "", clientId: "", siteAddress: "", status: "quoting", startDate: "", endDate: "", notes: "" };
export const emptyClient = {
  kind: "individual" as "individual" | "company",
  name: "",
  contactName: "",
  email: "",
  phone: "",
  abn: "",
  address: "",
};
export type ProjectDraft = typeof emptyProject;
export type ClientDraft = typeof emptyClient;
export type FormError = { message: string; field?: string } | null;

/** A saved date for the date field, which only takes a full YYYY-MM-DD. */
function isoDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? (date as NonNullable<DateInputProps["value"]>) : undefined;
}

/** The message goes under the field it's about. Anything else shows in a notice at the end of the form. */
function fieldError(error: FormError, field: string) {
  return error?.field === field ? ({ type: "error", message: error.message } as const) : undefined;
}

function FormNotice({ error, fields }: { error: FormError; fields: string[] }) {
  if (!error || (error.field && fields.includes(error.field))) return null;
  return <Banner status="error" title={error.message} />;
}

export function ProjectForm({
  value,
  onChange,
  clients,
  error,
  onNewClient,
}: {
  value: ProjectDraft;
  onChange: (next: ProjectDraft) => void;
  clients: ClientOption[];
  error: FormError;
  onNewClient?: () => void;
}) {
  const set = (patch: Partial<ProjectDraft>) => onChange({ ...value, ...patch });
  const chosen = clients.find((c) => c.id === value.clientId);
  const offerAddress = !!chosen?.address && chosen.address !== value.siteAddress;

  return (
    <div className="flex flex-col gap-5">
      <TextInput
        id="name"
        label="Project name"
        value={value.name}
        onChange={(name) => set({ name })}
        placeholder="e.g. Back deck, Smith St…"
        autoComplete="off"
        width="100%"
        status={fieldError(error, "name")}
      />

      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="clientId" className="text-(length:--text-label-size) font-medium text-(--color-text-secondary)">
            Client
          </label>
          {onNewClient && clients.length > 0 && (
            <div className="-my-2">
              <Button label="New client" variant="ghost" icon={<Icon icon={Plus} />} onClick={onNewClient} />
            </div>
          )}
        </div>
        <div className="mt-1">
          {clients.length > 0 || !onNewClient ? (
            <Selector
              id="clientId"
              label="Client"
              isLabelHidden
              placeholder="Choose a client…"
              options={clients.map((c) => ({
                value: c.id,
                label: c.kind === "company" && c.contactName ? `${c.name} (${c.contactName})` : c.name,
              }))}
              value={value.clientId || undefined}
              onChange={(clientId) => set({ clientId: clientId ?? "" })}
              hasSearch={clients.length > 8}
              searchPlaceholder="Search clients…"
              presentation="adaptive"
              width="100%"
              status={fieldError(error, "clientId")}
            />
          ) : (
            <Button
              id="clientId"
              label="Add your first client"
              variant="secondary"
              icon={<Icon icon={Plus} />}
              width="100%"
              onClick={onNewClient}
            />
          )}
        </div>
      </div>

      <div>
        <TextInput
          id="siteAddress"
          label="Site address"
          value={value.siteAddress}
          onChange={(siteAddress) => set({ siteAddress })}
          placeholder="Where the work is…"
          autoComplete="off"
          width="100%"
        />
        {offerAddress && (
          <div className="mt-1.5">
            <Button
              label={`Use ${chosen.name}’s address`}
              variant="ghost"
              size="sm"
              icon={<Icon icon={MapPin} />}
              onClick={() => set({ siteAddress: chosen.address ?? "" })}
            />
          </div>
        )}
      </div>

      <Selector
        id="status"
        label="Status"
        options={STATUSES.map(([v, label]) => ({ value: v, label }))}
        value={value.status}
        onChange={(status) => set({ status: status ?? "quoting" })}
        presentation="adaptive"
        width="100%"
      />

      {/* The date field needs 180px, so the pair only sits side by side when there is room. */}
      <div className="grid items-start gap-5 sm:grid-cols-2 sm:gap-3">
        <DateInput
          id="startDate"
          label="Start"
          isOptional
          hasClear
          format="date"
          value={isoDate(value.startDate)}
          onChange={(startDate) => set({ startDate: startDate ?? "" })}
          width="100%"
        />
        <DateInput
          id="endDate"
          label="Finish"
          isOptional
          hasClear
          format="date"
          min={isoDate(value.startDate)}
          value={isoDate(value.endDate)}
          onChange={(endDate) => set({ endDate: endDate ?? "" })}
          width="100%"
          status={fieldError(error, "endDate")}
        />
      </div>

      <TextArea
        id="notes"
        label="Notes"
        isOptional
        description="For you, not the client."
        rows={3}
        value={value.notes}
        onChange={(notes) => set({ notes })}
        placeholder="Access, parking, dogs, gate codes…"
        width="100%"
      />

      <FormNotice error={error} fields={["name", "clientId", "endDate"]} />
    </div>
  );
}

export function ClientForm({
  value,
  onChange,
  error,
}: {
  value: ClientDraft;
  onChange: (next: ClientDraft) => void;
  error: FormError;
}) {
  const set = (patch: Partial<ClientDraft>) => onChange({ ...value, ...patch });
  const company = value.kind === "company";

  return (
    <div className="flex flex-col gap-5">
      <Field label="Client is" inputID="clientKind" isGroupLabel width="100%">
        <Segmented
          label="Client is"
          value={value.kind}
          onChange={(kind) => set({ kind })}
          options={[
            ["individual", "A person", User],
            ["company", "A business", Building2],
          ]}
        />
      </Field>

      <div className={company ? "grid items-start gap-5 sm:grid-cols-2 sm:gap-3" : ""}>
        <TextInput
          id="clientName"
          label={company ? "Business name" : "Name"}
          value={value.name}
          onChange={(name) => set({ name })}
          autoComplete="off"
          width="100%"
          status={fieldError(error, "name")}
        />
        {company && (
          <TextInput
            id="contactName"
            label="Contact person"
            isOptional
            value={value.contactName}
            onChange={(contactName) => set({ contactName })}
            autoComplete="off"
            width="100%"
          />
        )}
      </div>

      <div className="grid items-start gap-5 sm:grid-cols-2 sm:gap-3">
        <TextInput
          id="email"
          type="email"
          label="Email"
          isOptional
          value={value.email}
          onChange={(email) => set({ email })}
          inputMode="email"
          autoComplete="off"
          autoCapitalize="none"
          hasSpellCheck={false}
          width="100%"
          status={fieldError(error, "email")}
        />
        <TextInput
          id="phone"
          type="tel"
          label="Phone"
          isOptional
          value={value.phone}
          onChange={(phone) => set({ phone })}
          inputMode="tel"
          autoComplete="off"
          placeholder="04…"
          width="100%"
        />
      </div>

      {company && (
        <TextInput
          id="abn"
          label="ABN"
          isOptional
          value={value.abn}
          onChange={(abn) => set({ abn })}
          inputMode="numeric"
          autoComplete="off"
          placeholder="11 digits…"
          width="100%"
        />
      )}

      <TextInput
        id="address"
        label="Address"
        isOptional
        description="Used as the site address when it’s the same place."
        value={value.address}
        onChange={(address) => set({ address })}
        autoComplete="off"
        width="100%"
      />

      <FormNotice error={error} fields={["name", "email"]} />
    </div>
  );
}

/** A short either/or choice, with an icon on each option. `label` names the choice for screen readers. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label = "Choose one",
  className = "",
}: {
  value: T;
  onChange: (next: T) => void;
  options: readonly (readonly [T, string, typeof User])[];
  label?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <SegmentedControl label={label} value={value} onChange={(next) => onChange(next as T)} layout="fill">
        {options.map(([key, text, OptionIcon]) => (
          <SegmentedControlItem key={key} value={key} label={text} icon={<OptionIcon size={16} aria-hidden />} />
        ))}
      </SegmentedControl>
    </div>
  );
}

/** Puts the cursor in the field a save failed on. */
export function focusField(field?: string) {
  if (!field) return;
  requestAnimationFrame(() => document.getElementById(field)?.focus());
}
