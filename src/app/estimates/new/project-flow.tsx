"use client";

import { Check, ChevronRight, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Sheet } from "@/components/sheet";
import { Input } from "@/components/ui";
import { ProjectEditor } from "@/components/record-editors";
import { formatProjectNo, type ClientOption, type ProjectOption } from "@/lib/project-schema";


/**
 * Who and where the estimate is for. Pick a recent project, search all of them, or make one (and its client)
 * without leaving the estimate.
 */
export function ProjectField({
  projects: initialProjects,
  clients,
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
  const [view, setView] = useState<"closed" | "pick" | "new">("closed");
  const [query, setQuery] = useState("");
  const close = () => setView("closed");

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
          onClick={() => setView(value || projects.length ? "pick" : "new")}
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
          onNew={() => setView("new")}
        />
      )}

      {view === "new" && (
        <ProjectEditor
          clients={clients}
          onClose={close}
          onBack={projects.length ? () => setView("pick") : undefined}
          onSaved={(p) => {
            const created = p as ProjectOption;
            setProjects((ps) => [created, ...ps]);
            onChange(created);
            close();
          }}
        />
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

