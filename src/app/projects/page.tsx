import { ChevronRight, FolderOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Money } from "@/components/money";
import { NewProjectButton } from "@/components/record-editors";
import { PageHeader, SearchBox, STATUS_LABEL, StatusPill } from "@/components/records";
import { requireMember } from "@/lib/auth";
import { formatProjectNo, listClients } from "@/lib/projects";
import { matches, projectsOverview } from "@/lib/records-overview";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  return (
    <Suspense fallback={<PageHeader title="Projects" />}>
      <Projects searchParams={searchParams} />
    </Suspense>
  );
}

const FILTERS = ["all", "quoting", "active", "on_hold", "completed", "cancelled"] as const;

async function Projects({ searchParams }: Pick<PageProps<"/projects">, "searchParams">) {
  const member = await requireMember();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = FILTERS.includes(sp.status as (typeof FILTERS)[number]) ? (sp.status as string) : "all";
  const [all, clients] = await Promise.all([projectsOverview(member.orgId), listClients(member.orgId)]);

  const searched = all.filter((p) => matches(q, p.name, p.client.name, p.siteAddress, formatProjectNo(p.number)));
  const shown = status === "all" ? searched : searched.filter((p) => p.status === status);
  const count = (s: string) => (s === "all" ? searched.length : searched.filter((p) => p.status === s).length);
  const href = (s: string) => `/projects?${new URLSearchParams({ ...(q ? { q } : {}), ...(s !== "all" ? { status: s } : {}) })}`;

  return (
    <>
      <PageHeader title="Projects" action={<NewProjectButton clients={clients} />} />

      {all.length === 0 ? (
        <Empty />
      ) : (
        <>
          <div className="mt-6 space-y-3">
            <SearchBox q={q} placeholder="Search projects, clients or addresses…">
              {status !== "all" && <input type="hidden" name="status" value={status} />}
            </SearchBox>
            <nav aria-label="Filter by status" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {FILTERS.filter((s) => s === "all" || count(s) > 0 || s === status).map((s) => {
                const on = s === status;
                return (
                  <Link
                    key={s}
                    href={href(s)}
                    aria-current={on ? "page" : undefined}
                    className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-tape border px-3 text-[0.9375rem] font-semibold transition-colors ${
                      on ? "border-ink bg-ink text-surface" : "border-hairline-strong bg-surface text-ink-2 hover:border-ink hover:text-ink"
                    }`}
                  >
                    {s === "all" ? "All" : STATUS_LABEL[s]}
                    <span className={`figures text-[0.875rem] ${on ? "text-surface/70" : "text-ink-3"}`}>{count(s)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {shown.length ? (
            <ul className="mt-5 divide-y divide-hairline border-y border-hairline">
              {shown.map((p) => (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}`} className="group flex items-center gap-3 px-1 py-4 transition-colors hover:bg-surface sm:px-3">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span className="truncate text-[1.0625rem] font-semibold group-hover:underline">{p.name}</span>
                        <StatusPill status={p.status} />
                      </span>
                      <span className="mt-0.5 block truncate text-[0.9375rem] text-ink-3">
                        <span className="figures">{formatProjectNo(p.number)}</span> · {p.client.name}
                        {p.siteAddress ? ` · ${p.siteAddress}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      {p.estimateCount > 0 ? (
                        <>
                          <Money cents={p.quotedCents} className="block text-[1.125rem] font-bold" />
                          <span className="text-[0.875rem] text-ink-3">
                            {p.estimateCount} {p.estimateCount === 1 ? "estimate" : "estimates"}
                          </span>
                        </>
                      ) : (
                        <span className="text-[0.9375rem] text-ink-3">No estimates</span>
                      )}
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-ink-3" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 text-ink-3">
              No projects match.{" "}
              <Link href="/projects" className="font-semibold text-ink underline underline-offset-4">
                Show all
              </Link>
            </p>
          )}
        </>
      )}
    </>
  );
}

function Empty() {
  return (
    <div className="mt-10 max-w-md">
      <FolderOpen className="size-8 text-ink-3" aria-hidden />
      <h2 className="mt-3 text-[1.25rem] font-bold">No projects yet</h2>
      <p className="mt-1 text-ink-2">
        A project is one job at one site for one client. It keeps every estimate for that job in one place. You can also
        make one while starting an estimate.
      </p>
    </div>
  );
}
