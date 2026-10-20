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
          <label htmlFor="clientId" className="font-semibold">
            Client
          </label>
          {onNewClient && (
            <button type="button" onClick={onNewClient} className="inline-flex items-center gap-1 font-semibold text-ink-2 underline underline-offset-4 hover:text-ink">
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
            className="flex h-12 w-full items-center gap-2 rounded-tape border border-dashed border-hairline-strong px-3.5 text-left text-ink-2 hover:border-ink hover:text-ink"
          >
            <Plus className="size-4" aria-hidden />
            Add your first client
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="siteAddress" className="block font-semibold">
          Site address
        </label>
        <Input id="siteAddress" value={value.siteAddress} onChange={set("siteAddress")} autoComplete="off" placeholder="Where the work is…" />
        {canUseClientAddress && (
          <button
            type="button"
            onClick={() => onChange({ ...value, siteAddress: chosen!.address! })}
            className="inline-flex items-center gap-1.5 rounded-tape bg-surface-2 px-2.5 py-1.5 text-[0.9375rem] font-semibold text-ink-2 transition-colors hover:text-ink"
          >
            <MapPin className="size-4" aria-hidden />
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
        <Field id="startDate" label="Start">
          <Input id="startDate" type="date" value={value.startDate} onChange={set("startDate")} />
        </Field>
        <Field id="endDate" label="Finish">
          <Input id="endDate" type="date" value={value.endDate} min={value.startDate || undefined} onChange={set("endDate")} aria-invalid={invalid("endDate")} />
        </Field>
      </div>

      <Field id="notes" label="Notes" hint="For you, not the client.">
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
        <legend className="font-semibold">Client is</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-tape bg-surface-2 p-1" role="radiogroup">
          {(
            [
              ["individual", "A person", User],
              ["company", "A business", Building2],
            ] as const
          ).map(([k, label, Icon]) => {
            const on = value.kind === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange({ ...value, kind: k })}
                className={`flex h-11 items-center justify-center gap-2 rounded-[3px] font-semibold transition-colors ${
                  on ? "bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.12)]" : "text-ink-3 hover:text-ink"
                }`}
              >
                <Icon className="size-[1.125rem]" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className={company ? "grid gap-5 sm:grid-cols-2 sm:gap-3" : ""}>
        <Field id="clientName" label={company ? "Business name" : "Name"}>
          <Input id="clientName" required value={value.name} onChange={set("name")} autoComplete="off" aria-invalid={invalid("name")} />
        </Field>
        {company && (
          <Field id="contactName" label="Contact person">
            <Input id="contactName" value={value.contactName} onChange={set("contactName")} autoComplete="off" />
          </Field>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
        <Field id="email" label="Email">
          <Input id="email" type="email" inputMode="email" spellCheck={false} value={value.email} onChange={set("email")} autoComplete="off" aria-invalid={invalid("email")} />
        </Field>
        <Field id="phone" label="Phone">
          <Input id="phone" type="tel" inputMode="tel" value={value.phone} onChange={set("phone")} autoComplete="off" placeholder="04…" />
        </Field>
      </div>

      {company && (
        <Field id="abn" label="ABN">
          <Input id="abn" inputMode="numeric" value={value.abn} onChange={set("abn")} autoComplete="off" placeholder="11 digits…" />
        </Field>
      )}

      <Field id="address" label="Address" hint="Used as the site address when it's the same place.">
        <Input id="address" value={value.address} onChange={set("address")} autoComplete="off" />
      </Field>

      {error && <Notice tone="error">{error.message}</Notice>}
    </div>
  );
}

export function focusField(field?: string) {
  if (!field) return;
  requestAnimationFrame(() => document.getElementById(field)?.focus());
}
