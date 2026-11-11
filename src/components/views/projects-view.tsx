import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { List, ListItem } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";
import { Money } from "@/components/money";
import { NewProjectButton } from "@/components/record-editors";
import { FilterTabs, PageHeader, SearchBox, STATUS_LABEL, StatusPill } from "@/components/records";
import { formatProjectNo, type ClientOption, type ProjectOption } from "@/lib/project-schema";
import { matches, type Quoted } from "@/lib/records-overview";

const FILTERS = ["all", "quoting", "active", "on_hold", "completed", "cancelled"] as const;

export function ProjectsView({
  all,
  clients,
  q,
  status,
}: {
  all: (ProjectOption & Quoted)[];
  clients: ClientOption[];
  q: string;
  status: string;
}) {
  const searched = all.filter((p) => matches(q, p.name, p.client.name, p.siteAddress, formatProjectNo(p.number)));
  const shown = status === "all" ? searched : searched.filter((p) => p.status === status);
  const count = (s: string) => (s === "all" ? searched.length : searched.filter((p) => p.status === s).length);
  const href = (s: string) =>
    `/projects?${new URLSearchParams({ ...(q ? { q } : {}), ...(s !== "all" ? { status: s } : {}) })}`;

  return (
    <>
      <PageHeader
        title="Projects"
        description="One job, at one site, for one client."
        action={all.length > 0 && <NewProjectButton clients={clients} />}
      />

      {all.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No projects yet"
            description="A project keeps every estimate for a job together. You can also make one while starting an estimate."
            actions={<NewProjectButton clients={clients} variant="primary" label="Create a project" />}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3">
            <SearchBox q={q} placeholder="Search projects">
              {status !== "all" && <input type="hidden" name="status" value={status} />}
            </SearchBox>
            <FilterTabs
              label="Filter by status"
              items={FILTERS.filter((s) => s === "all" || count(s) > 0 || s === status).map((s) => ({
                href: href(s),
                label: s === "all" ? "All" : STATUS_LABEL[s],
                count: count(s),
                on: s === status,
              }))}
            />
          </div>

          <div className="mt-2">
            {shown.length ? (
              <List hasDividers edge="flush" density="spacious">
                {shown.map((p) => (
                  <ListItem
                    key={p.id}
                    href={`/projects/${p.id}`}
                    label={
                      <Text weight="medium" maxLines={2}>
                        {p.name}
                      </Text>
                    }
                    description={
                      <Text type="supporting" maxLines={2} hasTabularNumbers>
                        {[formatProjectNo(p.number), p.client.name, p.siteAddress].filter(Boolean).join(" · ")}
                      </Text>
                    }
                    endContent={
                      <span className="flex flex-col items-end gap-1">
                        {p.estimateCount > 0 ? (
                          <Text weight="medium">
                            <Money cents={p.quotedCents} />
                          </Text>
                        ) : (
                          <Text type="supporting">No estimates</Text>
                        )}
                        <StatusPill status={p.status} />
                      </span>
                    }
                  />
                ))}
              </List>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="Nothing matches"
                  description={
                    q
                      ? `No projects match “${q}”${status !== "all" ? ` in ${STATUS_LABEL[status]}` : ""}.`
                      : `No projects are ${STATUS_LABEL[status]?.toLowerCase()}.`
                  }
                  actions={<Button href="/projects" label="Show all projects" />}
                />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
