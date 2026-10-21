"use client";

import { Check, ChevronDown, FolderOpen, Plus, Search } from "lucide-react";
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
      <button
        type="button"
        disabled={disabled}
        onClick={() => setView(value || projects.length ? "pick" : "new")}
        aria-label={value ? `Project: ${value.name}, ${value.client.name}. Change` : "Add to a project"}
        className="group inline-flex h-10 min-w-0 max-w-full items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink transition-colors hover:bg-hover disabled:opacity-60 sm:h-7 sm:text-xs"
      >
        <FolderOpen className="size-4 shrink-0 sm:size-3.5" aria-hidden />
        {value ? (
          <span className="min-w-0 truncate">
            <span>{value.name}</span>
            <span className="font-normal text-ink-3"> · {value.client.name}</span>
          </span>
        ) : (
          <span>Add to a project</span>
        )}
        <ChevronDown className="size-3.5 shrink-0 text-ink-3" aria-hidden />
      </button>

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
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <Input
          type="search"
          aria-label="Search projects"
          placeholder="Search by project, client or address…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          autoComplete="off"
        />
      </div>

      <button
        type="button"
        onClick={onNew}
        className="mt-3 flex h-11 w-full items-center gap-2.5 rounded-lg border border-dashed border-border-strong px-3 text-left text-body font-medium text-ink transition-colors hover:border-ink-3 hover:bg-subtle"
      >
        <Plus className="size-4" strokeWidth={2.25} aria-hidden />
        New project
      </button>

      {recent.length > 0 && <ProjectList title="Recent" items={recent} value={value} onPick={onPick} />}
      {rest.length > 0 && <ProjectList title={q ? "Matches" : "All projects"} items={rest} value={value} onPick={onPick} />}
      {q && matches.length === 0 && (
        <p className="mt-6 text-body text-ink-3">No projects match &ldquo;{query.trim()}&rdquo;. Make a new one instead.</p>
      )}

      {value && (
        <button type="button" onClick={() => onPick(null)} className="mt-8 text-body font-medium text-ink-2 underline underline-offset-4 hover:text-ink">
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
    <section className="mt-6">
      <h3 className="text-caption text-ink-3">{title}</h3>
      <ul className="mt-1.5 space-y-0.5">
        {items.map((p) => {
          const selected = value?.id === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p)}
                aria-pressed={selected}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-hover ${selected ? "bg-hover" : ""}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-body font-medium">{p.name}</span>
                    <span className="figures shrink-0 text-caption text-ink-3">{formatProjectNo(p.number)}</span>
                  </span>
                  <span className="block truncate text-caption text-ink-3">
                    {p.client.name}
                    {p.siteAddress ? ` · ${p.siteAddress}` : ""}
                  </span>
                </span>
                <span className="flex size-6 shrink-0 items-center justify-center" aria-hidden>
                  {selected && <Check className="size-4" strokeWidth={2.5} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

