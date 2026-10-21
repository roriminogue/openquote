import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { schema } from "@/db";
import { EstimateRows } from "@/components/estimate-rows";
import { Money } from "@/components/money";
import { EditClientButton, NewProjectButton } from "@/components/record-editors";
import { ListFrame, listRow, mapsUrl, StatusPill } from "@/components/records";
import { EmptyState, GroupTitle, KeyValue, Panel } from "@/components/ui";
import type { listEstimates } from "@/lib/estimate/queries";
import { formatProjectNo, type ClientOption, type ProjectOption } from "@/lib/project-schema";
import { QuoteSummary } from "./project-view";

export function ClientView({
  client,
  allProjects,
  estimates,
  clients,
}: {
  client: typeof schema.clients.$inferSelect;
  allProjects: ProjectOption[];
  estimates: Awaited<ReturnType<typeof listEstimates>>;
  clients: ClientOption[];
}) {
  const id = client.id;
  const projects = allProjects.filter((p) => p.client.id === id);
  const latestByProject = new Map<string, number>();
  for (const r of estimates) {
    const pid = r.estimate.projectId;
    if (pid && !latestByProject.has(pid)) latestByProject.set(pid, r.totals.totalCents);
  }

  return (
    <article className="mt-5">
      <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4 sm:flex-nowrap">
        <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
          <h1 className="font-display text-title font-medium leading-8 tracking-[-0.01em]">{client.name}</h1>
          <p className="mt-1.5 text-sm text-ink-3">
            {client.kind === "company" ? "Business" : "Person"}
            {client.kind === "company" && client.contactName ? ` · Contact: ${client.contactName}` : ""}
          </p>
        </div>
        <EditClientButton
          clientId={client.id}
          initial={{
            kind: client.kind,
            name: client.name,
            contactName: client.contactName ?? "",
            email: client.email ?? "",
            phone: client.phone ?? "",
            abn: client.abn ?? "",
            address: client.address ?? "",
          }}
        />
      </header>

      <section aria-labelledby="details" className="mt-8">
        <GroupTitle id="details">Details</GroupTitle>
        <Panel>
          <dl className="divide-y divide-dashed divide-border px-4 sm:px-5">
            <KeyValue label="Phone">
              {client.phone ? (
                <a href={`tel:${client.phone.replace(/[^\d+]/g, "")}`} className="figures inline-flex min-h-11 items-center gap-1.5 hover:underline sm:min-h-0">
                  <Phone className="size-3.5 shrink-0 text-ink-3" aria-hidden />
                  {client.phone}
                </a>
              ) : (
                <span className="font-normal text-ink-3">No phone</span>
              )}
            </KeyValue>
            <KeyValue label="Email">
              {client.email ? (
                <a href={`mailto:${client.email}`} className="inline-flex min-h-11 items-center gap-1.5 break-all hover:underline sm:min-h-0">
                  <Mail className="size-3.5 shrink-0 text-ink-3" aria-hidden />
                  {client.email}
                </a>
              ) : (
                <span className="font-normal text-ink-3">No email</span>
              )}
            </KeyValue>
            <KeyValue label="Address">
              {client.address ? (
                <a href={mapsUrl(client.address)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
                  <MapPin className="size-3.5 shrink-0 text-ink-3" aria-hidden />
                  {client.address}
                </a>
              ) : (
                <span className="font-normal text-ink-3">No address</span>
              )}
            </KeyValue>
            {client.abn && (
              <KeyValue label="ABN">
                <span className="figures">{client.abn}</span>
              </KeyValue>
            )}
          </dl>
        </Panel>
      </section>

      <section aria-labelledby="projects" className="mt-10">
        <GroupTitle id="projects" action={<NewProjectButton clients={clients} clientId={client.id} label="New project" />}>
          Projects
        </GroupTitle>
        <div>
          {projects.length ? (
            <ListFrame>
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className={`${listRow} sm:grid-cols-[minmax(0,1fr)_7rem_8rem]`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                      <span className="mt-0.5 block truncate text-caption text-ink-3">
                        <span className="figures">{formatProjectNo(p.number)}</span>
                        {p.siteAddress ? ` · ${p.siteAddress}` : ""}
                      </span>
                    </span>
                    <span className="col-start-1 row-start-2 sm:col-start-auto sm:row-start-auto">
                      <StatusPill status={p.status} />
                    </span>
                    <span className="row-span-2 text-right sm:row-span-1">
                      {latestByProject.has(p.id) ? (
                        <Money cents={latestByProject.get(p.id)!} className="text-sm font-medium text-ink" />
                      ) : (
                        <span className="text-caption text-ink-3">No estimates</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ListFrame>
          ) : (
            <EmptyState title={`No projects for ${client.name} yet`}>
              Make a project for each job you do for them, so their estimates stay together.
            </EmptyState>
          )}
        </div>
      </section>

      <section aria-labelledby="estimates" className="mt-10">
        <GroupTitle
          id="estimates"
          action={
            estimates.length > 0 && (
              <p className="text-xs">
                <QuoteSummary estimates={estimates} />
              </p>
            )
          }
        >
          Estimates
        </GroupTitle>
        {estimates.length ? (
          <EstimateRows rows={estimates} showClient={false} />
        ) : (
          <p className="text-sm text-ink-3">No estimates yet.</p>
        )}
      </section>
    </article>
  );
}
