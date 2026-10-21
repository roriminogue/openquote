"use client";

import { Building2, MapPin, Plus, User } from "lucide-react";
import { Field, Input, Notice, Select, Textarea } from "@/components/ui";
import type { ClientOption } from "@/lib/project-schema";

// The project and client forms, shared by the new-estimate flow and the Projects and Clients pages.

export const STATUSES = [
  ["quoting", "Quoting"],
  ["active", "Active"],
  ["on_hold", "On hold"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
] as const;

export const emptyProject = { name: "", clientId: "", siteAddress: "", status: "quoting", startDate: "", endDate: "", notes: "" };
export const emptyClient = { kind: "individual" as "individual" | "company", name: "", contactName: "", email: "", phone: "", abn: "", address: "" };

export type ProjectDraft = typeof emptyProject;
export type ClientDraft = typeof emptyClient;
export type FormError = { message: string; field?: string } | null;

export function ProjectForm({
  value,
  onChange,
  clients,
  error,
  onNewClient,
}: {
  value: ProjectDraft;
  onChange: (v: ProjectDraft) => void;
  clients: ClientOption[];
  error: FormError;
  onNewClient?: () => void;
}) {
  const set = (k: keyof typeof emptyProject) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value });
  const chosen = clients.find((c) => c.id === value.clientId);
  const canUseClientAddress = !!chosen?.address && chosen.address !== value.siteAddress;
  const invalid = (f: string) => (error?.field === f ? true : undefined);

  return (
    <div className="space-y-5">
      <Field id="name" label="Project name">
        <Input id="name" required value={value.name} onChange={set("name")} placeholder="e.g. Back deck, Smith St…" aria-invalid={invalid("name")} autoComplete="off" />
      </Field>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="clientId" className="text-sm font-medium">
            Client
          </label>
          {onNewClient && (
            <button type="button" onClick={onNewClient} className="-my-2 inline-flex h-9 items-center gap-1 rounded-md px-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-hover hover:text-ink">
              <Plus className="size-4" aria-hidden />
              New client
            </button>
          )}
        </div>
        {clients.length ? (
          <Select id="clientId" required value={value.clientId} onChange={set("clientId")} aria-invalid={invalid("clientId")}>
            <option value="">Choose a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.kind === "company" && c.contactName ? ` (${c.contactName})` : ""}
              </option>
            ))}
          </Select>
        ) : (
          <button
            type="button"
            id="clientId"
            onClick={onNewClient}
            className="flex h-11 w-full items-center gap-2 rounded-lg border border-dashed border-border-strong px-3 text-left text-body text-ink-2 transition-colors hover:border-ink-3 hover:bg-subtle hover:text-ink"
          >
            <Plus className="size-4" aria-hidden />
            Add your first client
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="siteAddress" className="block text-sm font-medium">
          Site address
        </label>
        <Input id="siteAddress" value={value.siteAddress} onChange={set("siteAddress")} autoComplete="off" placeholder="Where the work is…" />
        {canUseClientAddress && (
          <button
            type="button"
            onClick={() => onChange({ ...value, siteAddress: chosen!.address! })}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-caption text-ink-2 transition-colors hover:bg-subtle hover:text-ink max-sm:h-9"
          >
            <MapPin className="size-3.5" aria-hidden />
            Use {chosen!.name}&rsquo;s address
          </button>
        )}
      </div>

      <Field id="status" label="Status">
        <Select id="status" value={value.status} onChange={set("status")}>
          {STATUSES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field id="startDate" label="Start" optional>
          <Input id="startDate" type="date" value={value.startDate} onChange={set("startDate")} />
        </Field>
        <Field id="endDate" label="Finish" optional>
          <Input id="endDate" type="date" value={value.endDate} min={value.startDate || undefined} onChange={set("endDate")} aria-invalid={invalid("endDate")} />
        </Field>
      </div>

      <Field id="notes" label="Notes" optional hint="For you, not the client.">
        <Textarea id="notes" rows={3} value={value.notes} onChange={set("notes")} placeholder="Access, parking, dogs, gate codes…" />
      </Field>

      {error && <Notice tone="error">{error.message}</Notice>}
    </div>
  );
}

export function ClientForm({
  value,
  onChange,
  error,
}: {
  value: ClientDraft;
  onChange: (v: ClientDraft) => void;
  error: FormError;
}) {
  const set = (k: keyof typeof emptyClient) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value });
  const company = value.kind === "company";
  const invalid = (f: string) => (error?.field === f ? true : undefined);

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="text-sm font-medium">Client is</legend>
        <Segmented
          className="mt-1.5"
          value={value.kind}
          onChange={(kind) => onChange({ ...value, kind })}
          options={[
            ["individual", "A person", User],
            ["company", "A business", Building2],
          ]}
        />
      </fieldset>

      <div className={company ? "grid gap-5 sm:grid-cols-2 sm:gap-3" : ""}>
        <Field id="clientName" label={company ? "Business name" : "Name"}>
          <Input id="clientName" required value={value.name} onChange={set("name")} autoComplete="off" aria-invalid={invalid("name")} />
        </Field>
        {company && (
          <Field id="contactName" label="Contact person" optional>
            <Input id="contactName" value={value.contactName} onChange={set("contactName")} autoComplete="off" />
          </Field>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
        <Field id="email" label="Email" optional>
          <Input id="email" type="email" inputMode="email" spellCheck={false} value={value.email} onChange={set("email")} autoComplete="off" aria-invalid={invalid("email")} />
        </Field>
        <Field id="phone" label="Phone" optional>
          <Input id="phone" type="tel" inputMode="tel" value={value.phone} onChange={set("phone")} autoComplete="off" placeholder="04…" />
        </Field>
      </div>

      {company && (
        <Field id="abn" label="ABN" optional>
          <Input id="abn" inputMode="numeric" value={value.abn} onChange={set("abn")} autoComplete="off" placeholder="11 digits…" />
        </Field>
      )}

      <Field id="address" label="Address" optional hint="Used as the site address when it’s the same place.">
        <Input id="address" value={value.address} onChange={set("address")} autoComplete="off" />
      </Field>

      {error && <Notice tone="error">{error.message}</Notice>}
    </div>
  );
}

/**
 * Two or three mutually exclusive choices. Concentric radii (track 10px, thumb 7px, 3px inset), no shadow; arrow
 * keys move the choice, as a radio group should.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className = "",
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly (readonly [T, string, typeof User])[];
  className?: string;
}) {
  const move = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + options.length) % options.length;
    onChange(options[next][0]);
    (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
  };
  return (
    <div role="radiogroup" className={`grid auto-cols-fr grid-flow-col gap-0.5 rounded-[10px] bg-hover p-[3px] ${className}`}>
      {options.map(([k, label, Icon], i) => {
        const on = value === k;
        return (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(k)}
            onKeyDown={(e) => move(e, i)}
            className={`flex h-10 items-center justify-center gap-2 rounded-[7px] text-body transition-colors sm:h-9 sm:text-sm ${
              on ? "bg-bg font-medium text-ink ring-1 ring-border" : "text-ink-3 hover:text-ink"
            }`}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function focusField(field?: string) {
  if (!field) return;
  requestAnimationFrame(() => document.getElementById(field)?.focus());
}
