"use client";

import { Button } from "@astryxdesign/core/Button";
import { Field } from "@astryxdesign/core/Field";
import { Icon } from "@astryxdesign/core/Icon";
import { List, ListItem } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Check, ChevronDown, FolderOpen, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ProjectEditor } from "@/components/record-editors";
import { Sheet } from "@/components/sheet";
import { formatProjectNo, type ClientOption, type ProjectOption } from "@/lib/project-schema";

/**
 * The project an estimate belongs to. It looks like any other field on the page; tapping it opens a sheet to
 * search and pick a project, or to make a new one (and its client) without leaving the estimate.
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
  onChange: (project: ProjectOption | null) => void;
  disabled?: boolean;
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [view, setView] = useState<"closed" | "pick" | "new">("closed");
  const [query, setQuery] = useState("");
  // A new number each time the field is opened, so the New project form starts clean. It stays the same
  // while moving between the list and the form, so a half-filled form survives a look back at the list.
  const [visit, setVisit] = useState(0);
  const close = () => setView("closed");

  return (
    <>
      <Field label="Project" inputID="project" isOptional isDisabled={disabled} width="100%">
        <button
          id="project"
          type="button"
          disabled={disabled}
          onClick={() => {
            setQuery("");
            setVisit((n) => n + 1);
            setView(value || projects.length ? "pick" : "new");
          }}
          aria-haspopup="dialog"
          aria-label={value ? `Project: ${value.name}, ${value.client.name}. Change` : "Add to a project"}
          className="flex h-(--size-element-md) w-full items-center gap-2 rounded-(--radius-element) border border-(--color-border-emphasized) bg-(--color-background-surface) px-2 text-left text-(length:--text-body-size) transition-shadow duration-150 hover:shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--color-border-emphasized)_30%,transparent)] disabled:opacity-60"
        >
          <FolderOpen className="size-4 shrink-0 text-(--color-icon-secondary)" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            {value ? (
              <>
                <span className="text-(--color-text-primary)">{value.name}</span>
                <span className="text-(--color-text-secondary)"> · {value.client.name}</span>
              </>
            ) : (
              <span className="text-(--color-text-secondary)">Add to a project</span>
            )}
          </span>
          <ChevronDown className="size-4 shrink-0 text-(--color-icon-secondary)" aria-hidden />
        </button>
      </Field>

      <Sheet open={view === "pick"} title="Project" onClose={close}>
        <PickProject
          projects={projects}
          value={value}
          query={query}
          onQuery={setQuery}
          onNew={() => setView("new")}
          onPick={(p) => {
            onChange(p);
            close();
          }}
        />
      </Sheet>

      {visit > 0 && (
        <ProjectEditor
          key={visit}
          open={view === "new"}
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
  onQuery,
  onNew,
  onPick,
}: {
  projects: ProjectOption[];
  value: ProjectOption | null;
  query: string;
  onQuery: (q: string) => void;
  onNew: () => void;
  onPick: (project: ProjectOption | null) => void;
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

  const rows = (title: string, items: ProjectOption[]) => (
    <List
      density="spacious"
      hasDividers
      header={
        <Text type="label" color="secondary">
          {title}
        </Text>
      }
    >
      {items.map((p) => {
        const chosen = p.id === value?.id;
        return (
          <ListItem
            key={p.id}
            label={p.name}
            description={p.siteAddress ? `${p.client.name} · ${p.siteAddress}` : p.client.name}
            isSelected={chosen}
            onClick={() => onPick(p)}
            endContent={
              <span className="flex items-center gap-2">
                <Text type="supporting" color="secondary" hasTabularNumbers>
                  {formatProjectNo(p.number)}
                </Text>
                {chosen && <Check className="size-4 text-(--color-icon-accent)" aria-label="Chosen" />}
              </span>
            }
          />
        );
      })}
    </List>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        {projects.length > 3 && (
          <TextInput
            id="projectSearch"
            type="search"
            enterKeyHint="search"
            label="Search projects"
            isLabelHidden
            startIcon={Search}
            hasClear
            value={query}
            onChange={onQuery}
            placeholder="Search by project, client or address…"
            autoComplete="off"
            width="100%"
          />
        )}
        <Button label="New project" variant="secondary" size="lg" icon={<Icon icon={Plus} />} width="100%" onClick={onNew} />
      </div>

      {recent.length > 0 && rows(rest.length ? "Recent" : "Your projects", recent)}
      {rest.length > 0 && rows(q ? "Matches" : "All projects", rest)}
      {q && matches.length === 0 && (
        <Text as="p" color="secondary">
          No projects match “{query.trim()}”. Make a new one instead.
        </Text>
      )}

      {value && (
        <div>
          <Button label="Don’t link a project" variant="ghost" onClick={() => onPick(null)} />
        </div>
      )}
    </div>
  );
}
