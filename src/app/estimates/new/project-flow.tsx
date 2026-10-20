"use client";

import { Building2, Check, ChevronRight, MapPin, Plus, Search, User } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Sheet } from "@/components/sheet";
import { Field, Input, Notice, Select, Textarea } from "@/components/ui";
import { formatProjectNo, type ClientOption, type ProjectOption } from "@/lib/project-schema";
import { addClient, addProject } from "./actions";

type View = "closed" | "pick" | "project" | "client";

const STATUSES = [
  ["quoting", "Quoting"],
  ["active", "Active"],
  ["on_hold", "On hold"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
] as const;

const emptyProject = { name: "", clientId: "", siteAddress: "", status: "quoting", startDate: "", endDate: "", notes: "" };
const emptyClient = { kind: "individual" as "individual" | "company", name: "", contactName: "", email: "", phone: "", abn: "", address: "" };

/**
 * Who and where the estimate is for. Pick a recent project, search all of them, or make one (and its client)
 * without leaving the estimate.
 */
export function ProjectField({
  projects: initialProjects,
  clients: initialClients,
  value,
  onChange,
  disabled,
}: {
  projects: ProjectOption[];
  clients: ClientOption[];
  value: ProjectOption | null;
  onChange: (p: ProjectOption | null) => void;
  disabled?: boolean;
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [clients, setClients] = useState(initialClients);
  const [view, setView] = useState<View>("closed");
  const [query, setQuery] = useState("");
  const [project, setProject] = useState(emptyProject);
  const [client, setClient] = useState(emptyClient);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setView("closed");
    setError(null);
  };
  const go = (v: View) => {
    setError(null);
    setView(v);
  };

  async function saveProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const res = await addProject(project);
    setBusy(false);
    if (!res.ok) {
      setError({ message: res.error, field: res.field });
      focusField(res.field);
      return;
    }
    setProjects((ps) => [res.value, ...ps]);
    setProject(emptyProject);
    onChange(res.value);
    close();
  }

  async function saveClient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const res = await addClient(client);
    setBusy(false);
    if (!res.ok) {
      setError({ message: res.error, field: res.field });
      focusField(res.field === "name" ? "clientName" : res.field);
      return;
    }
    setClients((cs) => [...cs, res.value].sort((a, b) => a.name.localeCompare(b.name)));
    setProject((p) => ({ ...p, clientId: res.value.id, siteAddress: p.siteAddress || res.value.address || "" }));
    setClient(emptyClient);
    go("project");
  }

  return (
    <>
      <div className="space-y-1.5">
        <span id="project-label" className="block font-semibold text-ink">
          Project
        </span>
        <button
          type="button"
          aria-labelledby="project-label"
          disabled={disabled}
          onClick={() => go(value || projects.length ? "pick" : "project")}
          className="group flex w-full items-center gap-3 rounded-tape border border-hairline-strong bg-surface px-3.5 py-3 text-left transition-colors hover:border-ink disabled:opacity-60"
        >
          {value ? (
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[1.0625rem] font-semibold">{value.name}</span>
                <span className="figures shrink-0 text-[0.9375rem] font-semibold text-ink-3">{formatProjectNo(value.number)}</span>
              </span>
              <span className="mt-0.5 block truncate text-[0.9375rem] text-ink-3">
                {value.client.name}
                {value.siteAddress ? ` · ${value.siteAddress}` : ""}
              </span>
            </span>
          ) : (
            <span className="min-w-0 flex-1 text-ink-2">
              <span className="block font-semibold text-ink">Choose or create a project</span>
              <span className="block text-[0.9375rem] text-ink-3">Optional. Keeps the client, site and quotes together.</span>
            </span>
          )}
          <ChevronRight className="size-5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>
      </div>

      {view === "pick" && (
        <PickProject
          projects={projects}
          value={value}
          query={query}
          setQuery={setQuery}
          onClose={close}
          onPick={(p) => {
            onChange(p);
            close();
          }}
          onNew={() => go("project")}
        />
      )}

      {view === "project" && (
        <Sheet
          open
          title="New project"
          onClose={close}
          onBack={projects.length ? () => go("pick") : undefined}
          action="Create"
          busy={busy}
          onSubmit={saveProject}
        >
          <ProjectForm
            value={project}
            onChange={setProject}
            clients={clients}
            error={error}
            onNewClient={() => {
              setClient({ ...emptyClient });
              go("client");
            }}
          />
        </Sheet>
      )}

      {view === "client" && (
        <Sheet open title="New client" onClose={close} onBack={() => go("project")} action="Add client" busy={busy} onSubmit={saveClient}>
          <ClientForm value={client} onChange={setClient} error={error} />
        </Sheet>
      )}
    </>
  );
}

function PickProject({
  projects,
  value,
  query,
  setQuery,
  onClose,
  onPick,
  onNew,
}: {
  projects: ProjectOption[];
  value: ProjectOption | null;
  query: string;
  setQuery: (q: string) => void;
  onClose: () => void;
  onPick: (p: ProjectOption | null) => void;
  onNew: () => void;
}) {
  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      q
        ? projects.filter((p) =>
            [p.name, p.client.name, p.siteAddress ?? "", formatProjectNo(p.number)].some((s) => s.toLowerCase().includes(q)),
          )
        : projects,
    [projects, q],
  );
  const recent = q ? [] : matches.slice(0, 3);
  const rest = q ? matches : matches.slice(3);

  return (
    <Sheet open title="Project" onClose={onClose}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-ink-3" aria-hidden />
        <Input
          type="search"
          aria-label="Search projects"
          placeholder="Search by project, client or address…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
          autoComplete="off"
        />
      </div>

      <button
        type="button"
        onClick={onNew}
        className="mt-4 flex w-full items-center gap-3 rounded-tape bg-blade px-3.5 py-3 text-left font-semibold text-on-blade transition-colors hover:bg-blade-press"
      >
        <Plus className="size-5" strokeWidth={2.5} aria-hidden />
        New project
      </button>

      {recent.length > 0 && <ProjectList title="Recent" items={recent} value={value} onPick={onPick} />}
      {rest.length > 0 && <ProjectList title={q ? "Matches" : "All projects"} items={rest} value={value} onPick={onPick} />}
      {q && matches.length === 0 && (
        <p className="mt-6 text-ink-3">No projects match &ldquo;{query.trim()}&rdquo;. Make a new one instead.</p>
      )}

      {value && (
        <button type="button" onClick={() => onPick(null)} className="mt-8 font-semibold text-ink-2 underline underline-offset-4 hover:text-ink">
          Don&rsquo;t link a project
        </button>
      )}
    </Sheet>
  );
}

function ProjectList({
  title,
  items,
  value,
  onPick,
}: {
  title: string;
  items: ProjectOption[];
  value: ProjectOption | null;
  onPick: (p: ProjectOption) => void;
}) {
  return (
    <section className="mt-7">
      <h3 className="font-bold">{title}</h3>
      <ul className="mt-2 divide-y divide-hairline border-y border-hairline">
        {items.map((p) => {
          const selected = value?.id === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p)}
                aria-pressed={selected}
                className="flex w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-surface"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-semibold">{p.name}</span>
                    <span className="figures shrink-0 text-[0.9375rem] text-ink-3">{formatProjectNo(p.number)}</span>
                  </span>
                  <span className="block truncate text-[0.9375rem] text-ink-3">
                    {p.client.name}
                    {p.siteAddress ? ` · ${p.siteAddress}` : ""}
                  </span>
                </span>
                <span className="flex size-6 shrink-0 items-center justify-center" aria-hidden>
                  {selected && <Check className="size-5" strokeWidth={2.5} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ProjectForm({
  value,
  onChange,
  clients,
  error,
  onNewClient,
}: {
  value: typeof emptyProject;
  onChange: (v: typeof emptyProject) => void;
  clients: ClientOption[];
  error: { message: string; field?: string } | null;
  onNewClient: () => void;
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
          <button type="button" onClick={onNewClient} className="inline-flex items-center gap-1 font-semibold text-ink-2 underline underline-offset-4 hover:text-ink">
            <Plus className="size-4" aria-hidden />
            New client
          </button>
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

function ClientForm({
  value,
  onChange,
  error,
}: {
  value: typeof emptyClient;
  onChange: (v: typeof emptyClient) => void;
  error: { message: string; field?: string } | null;
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

function focusField(field?: string) {
  if (!field) return;
  requestAnimationFrame(() => document.getElementById(field)?.focus());
}
