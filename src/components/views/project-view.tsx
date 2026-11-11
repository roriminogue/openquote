import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { Link } from "@astryxdesign/core/Link";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Text } from "@astryxdesign/core/Text";
import { Plus } from "lucide-react";
import type { schema } from "@/db";
import { EstimateRows } from "@/components/estimate-rows";
import { Money } from "@/components/money";
import { EditProjectButton } from "@/components/record-editors";
import { mapsUrl, StatusPill } from "@/components/records";
import { SectionTitle } from "@/components/section-title";
import type { listEstimates } from "@/lib/estimate/queries";
import { formatProjectNo, type ClientOption } from "@/lib/project-schema";
import { dateFormat } from "@/lib/dates";

const dateFmt = dateFormat({ day: "numeric", month: "short", year: "numeric" });
const fmtDate = (d: string | null) => (d ? dateFmt.format(new Date(`${d}T00:00:00`)) : null);

type Estimates = Awaited<ReturnType<typeof listEstimates>>;

/** Latest quote, and the spread when there is more than one estimate. Never a sum: they're alternatives. */
export function QuoteSummary({ estimates }: { estimates: Estimates }) {
  if (!estimates.length) return <Text type="supporting">Nothing quoted yet</Text>;
  const totals = estimates.map((r) => r.totals.totalCents);
  const min = Math.min(...totals);
  const max = Math.max(...totals);
  return (
    <Text type="supporting">
      <Text type="inherit" color="primary" weight="medium">
        <Money cents={totals[0]} />
      </Text>{" "}
      latest
      {estimates.length > 1 && min !== max && (
        <>
          {" "}
          · range <Money cents={min} quiet={false} /> to <Money cents={max} quiet={false} />
        </>
      )}
    </Text>
  );
}

/** Nothing set yet, in the secondary colour. */
function Unset({ children }: { children: string }) {
  return <Text color="secondary">{children}</Text>;
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
  const newEstimate = `/estimates/new?project=${project.id}`;

  return (
    <article className="mt-3">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1">
          <Heading level={1}>{project.name}</Heading>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <StatusPill status={project.status} />
            <Text type="supporting" color="primary" hasTabularNumbers>
              {formatProjectNo(project.number)}
            </Text>
            {client && <Text type="supporting">· {client.name}</Text>}
          </div>
        </div>
        <div className="no-print grid shrink-0 grid-cols-2 gap-2 sm:flex">
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
          <Button
            href={newEstimate}
            label="New estimate"
            variant="primary"
            icon={<Plus aria-hidden className="size-4" />}
            width="100%"
          />
        </div>
      </header>

      <section aria-labelledby="details" className="mt-8">
        <SectionTitle id="details">Details</SectionTitle>
        <Card>
          <MetadataList label={{ width: 96 }}>
            <MetadataListItem label="Client">
              {client ? (
                <Text>
                  <Link href={`/clients/${client.id}`} color="primary">
                    {client.name}
                  </Link>
                  {client.kind === "company" && client.contactName && (
                    <Text type="inherit" color="secondary">
                      {" "}
                      · {client.contactName}
                    </Text>
                  )}
                </Text>
              ) : (
                <Unset>No client</Unset>
              )}
            </MetadataListItem>
            <MetadataListItem label="Site">
              {project.siteAddress ? (
                <Link href={mapsUrl(project.siteAddress)} isExternalLink color="primary">
                  {project.siteAddress}
                </Link>
              ) : (
                <Unset>No site address</Unset>
              )}
            </MetadataListItem>
            <MetadataListItem label="When">
              {start || finish ? (
                <Text hasTabularNumbers>
                  {start ?? "Start not set"} to {finish ?? "finish not set"}
                </Text>
              ) : (
                <Unset>Not scheduled</Unset>
              )}
            </MetadataListItem>
            {project.notes ? (
              <MetadataListItem label="Notes">
                <span className="whitespace-pre-line">
                  <Text color="secondary">{project.notes}</Text>
                </span>
              </MetadataListItem>
            ) : null}
          </MetadataList>
        </Card>
      </section>

      <section aria-labelledby="estimates" className="mt-10">
        <SectionTitle id="estimates" action={<QuoteSummary estimates={estimates} />}>
          Estimates
        </SectionTitle>
        {estimates.length ? (
          <EstimateRows rows={estimates} showClient={false} />
        ) : (
          <EmptyState
            title="No estimates for this job yet"
            description="Describe the work and the estimate is filed here with the client and site already filled in."
            actions={<Button href={newEstimate} label="Price this job" variant="primary" />}
          />
        )}
      </section>
    </article>
  );
}
