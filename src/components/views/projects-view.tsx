import Link from "next/link";
import { Money } from "@/components/money";
import { NewProjectButton } from "@/components/record-editors";
import { FilterTabs, ListFrame, listHeader, listRow, PageHeader, SearchBox, STATUS_LABEL, StatusPill } from "@/components/records";
import { EmptyState, LinkButton } from "@/components/ui";
import { formatProjectNo, type ClientOption, type ProjectOption } from "@/lib/project-schema";
import { matches, type Quoted } from "@/lib/records-overview";

const FILTERS = ["all", "quoting", "active", "on_hold", "completed", "cancelled"] as const;
const cols = "md:grid-cols-[minmax(0,1fr)_12rem_7rem_8rem]";

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
  const href = (s: string) => `/projects?${new URLSearchParams({ ...(q ? { q } : {}), ...(s !== "all" ? { status: s } : {}) })}`;

  return (
    <>
      <PageHeader
        title="Projects"
        description="One job, at one site, for one client."
        action={<NewProjectButton clients={clients} />}
      />

      {all.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No projects yet" action={<NewProjectButton clients={clients} variant="primary" label="Create a project" />}>
            A project keeps every estimate for a job together. You can also make one while starting an estimate.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-7 flex flex-col-reverse gap-4 sm:flex-row sm:items-end sm:justify-between">
            <FilterTabs
              label="Filter by status"
              items={FILTERS.filter((s) => s === "all" || count(s) > 0 || s === status).map((s) => ({
                href: href(s),
                label: s === "all" ? "All" : STATUS_LABEL[s],
                count: count(s),
                on: s === status,
              }))}
            />
            <div className="sm:mb-2 sm:w-72">
              <SearchBox q={q} placeholder="Search projects…">
                {status !== "all" && <input type="hidden" name="status" value={status} />}
              </SearchBox>
            </div>
          </div>

          <div className="mt-5">
            {shown.length ? (
              <ListFrame
                header={
                  <div aria-hidden className={`${listHeader} ${cols}`}>
                    <span>Project</span>
                    <span>Client</span>
                    <span>Status</span>
                    <span className="text-right">Latest quote</span>
                  </div>
                }
              >
                {shown.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/projects/${p.id}`}
                      className={`${listRow} ${cols}`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                        <span className="mt-0.5 block truncate text-caption text-ink-3">
                          <span className="figures">{formatProjectNo(p.number)}</span>
                          <span className="md:hidden"> · {p.client.name}</span>
                          {p.siteAddress ? ` · ${p.siteAddress}` : ""}
                        </span>
                      </span>
                      <span className="hidden truncate text-sm text-ink-2 md:block">{p.client.name}</span>
                      <span className="col-start-1 row-start-2 md:col-start-auto md:row-start-auto">
                        <StatusPill status={p.status} />
                      </span>
                      <span className="row-span-2 text-right md:row-span-1">
                        {p.estimateCount > 0 ? (
                          <>
                            <Money cents={p.quotedCents} className="block text-sm font-medium text-ink" />
                            <span className="text-caption text-ink-3">
                              {p.estimateCount} {p.estimateCount === 1 ? "estimate" : "estimates"}
                            </span>
                          </>
                        ) : (
                          <span className="text-caption text-ink-3">No estimates</span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ListFrame>
            ) : (
              <EmptyState title="Nothing matches" action={<LinkButton href="/projects" variant="secondary">Show all projects</LinkButton>}>
                {q ? <>No projects match &ldquo;{q}&rdquo;{status !== "all" ? ` in ${STATUS_LABEL[status]}` : ""}.</> : <>No projects are {STATUS_LABEL[status]?.toLowerCase()}.</>}
              </EmptyState>
            )}
          </div>
        </>
      )}
    </>
  );
}
