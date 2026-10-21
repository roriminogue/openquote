import { CalendarDays, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import type { schema } from "@/db";
import { EstimateRows } from "@/components/estimate-rows";
import { Money } from "@/components/money";
import { EditProjectButton } from "@/components/record-editors";
import { mapsUrl, StatusPill } from "@/components/records";
import { EmptyState, GroupTitle, KeyValue, LinkButton, Panel } from "@/components/ui";
import type { listEstimates } from "@/lib/estimate/queries";
import { formatProjectNo, type ClientOption } from "@/lib/project-schema";

const dateFmt = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" });
const fmtDate = (d: string | null) => (d ? dateFmt.format(new Date(`${d}T00:00:00`)) : null);

type Estimates = Awaited<ReturnType<typeof listEstimates>>;

/** Latest quote, and the spread when there is more than one estimate. Never a sum: they're alternatives. */
export function QuoteSummary({ estimates }: { estimates: Estimates }) {
  if (!estimates.length) return <span className="text-ink-3">Nothing quoted yet</span>;
  const totals = estimates.map((r) => r.totals.totalCents);
  const min = Math.min(...totals);
  const max = Math.max(...totals);
  return (
    <span>
      <Money cents={totals[0]} className="font-medium text-ink" />
      <span className="text-ink-3"> latest</span>
      {estimates.length > 1 && min !== max && (
        <span className="text-ink-3">
          {" "}
          · range <Money cents={min} quiet={false} /> to <Money cents={max} quiet={false} />
        </span>
      )}
    </span>
  );
}

export function ProjectView({
  project,
  client,
  estimates,
  clients,
}: {
  project: typeof schema.projects.$inferSelect;
  client: typeof schema.clients.$inferSelect | null;
  estimates: Estimates;
  clients: ClientOption[];
}) {
  const start = fmtDate(project.startDate);
  const finish = fmtDate(project.endDate);

  return (
    <article className="mt-5">
      <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4 sm:flex-nowrap">
        <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
          <h1 className="font-display text-title font-medium leading-8 tracking-[-0.01em]">{project.name}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-3">
            <StatusPill status={project.status} />
            <span className="figures text-ink-2">{formatProjectNo(project.number)}</span>
            {client && (
              <span>
                <span aria-hidden className="mr-2">·</span>
                {client.name}
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <EditProjectButton
            projectId={project.id}
            clients={clients}
            initial={{
              name: project.name,
              clientId: project.clientId,
              siteAddress: project.siteAddress ?? "",
              status: project.status,
              startDate: project.startDate ?? "",
              endDate: project.endDate ?? "",
              notes: project.notes ?? "",
            }}
          />
          <LinkButton href={`/estimates/new?project=${project.id}`}>
            <Plus className="size-4" aria-hidden />
            New estimate
          </LinkButton>
        </div>
      </header>

      <section aria-labelledby="details" className="mt-8">
        <GroupTitle id="details">Details</GroupTitle>
        <Panel>
          <dl className="divide-y divide-dashed divide-border px-4 sm:px-5">
            <KeyValue label="Client">
              {client ? (
                <Link href={`/clients/${client.id}`} className="hover:underline">
                  {client.name}
                  {client.kind === "company" && client.contactName && <span className="font-normal text-ink-3"> · {client.contactName}</span>}
                </Link>
              ) : (
                <span className="font-normal text-ink-3">No client</span>
              )}
            </KeyValue>
            <KeyValue label="Site">
              {project.siteAddress ? (
                <a href={mapsUrl(project.siteAddress)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
                  <MapPin className="size-3.5 shrink-0 text-ink-3" aria-hidden />
                  {project.siteAddress}
                </a>
              ) : (
                <span className="font-normal text-ink-3">No site address</span>
              )}
            </KeyValue>
            <KeyValue label="When">
              {start || finish ? (
                <span className="figures inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 shrink-0 text-ink-3" aria-hidden />
                  {start ?? "Start not set"} to {finish ?? "finish not set"}
                </span>
              ) : (
                <span className="font-normal text-ink-3">Not scheduled</span>
              )}
            </KeyValue>
            {project.notes && (
              <KeyValue label="Notes">
                <span className="whitespace-pre-line font-normal text-ink-2">{project.notes}</span>
              </KeyValue>
            )}
          </dl>
        </Panel>
      </section>

      <section aria-labelledby="estimates" className="mt-10">
        <GroupTitle
          id="estimates"
          action={
            <p className="text-xs">
              <QuoteSummary estimates={estimates} />
            </p>
          }
        >
          Estimates
        </GroupTitle>
        {estimates.length ? (
          <EstimateRows rows={estimates} showClient={false} />
        ) : (
          <div className="mt-4">
            <EmptyState
              title="No estimates for this job yet"
              action={
                <LinkButton href={`/estimates/new?project=${project.id}`} variant="accent">
                  Price this job
                </LinkButton>
              }
            >
              Describe the work and the estimate is filed here with the client and site already filled in.
            </EmptyState>
          </div>
        )}
      </section>
    </article>
  );
}
