import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { Link } from "@astryxdesign/core/Link";
import { List, ListItem } from "@astryxdesign/core/List";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Text } from "@astryxdesign/core/Text";
import type { schema } from "@/db";
import { EstimateRows } from "@/components/estimate-rows";
import { Money } from "@/components/money";
import { EditClientButton, NewProjectButton } from "@/components/record-editors";
import { mapsUrl, StatusPill } from "@/components/records";
import { SectionTitle } from "@/components/section-title";
import type { listEstimates } from "@/lib/estimate/queries";
import { formatProjectNo, type ClientOption, type ProjectOption } from "@/lib/project-schema";
import { QuoteSummary } from "./project-view";

/** Nothing set yet, in the secondary colour. */
function Unset({ children }: { children: string }) {
  return <Text color="secondary">{children}</Text>;
}

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
    <article className="mt-3">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1">
          <Heading level={1}>{client.name}</Heading>
          <div className="mt-2">
            <Text as="p" type="supporting">
              {client.kind === "company" ? "Business" : "Person"}
              {client.kind === "company" && client.contactName ? ` · Contact: ${client.contactName}` : ""}
            </Text>
          </div>
        </div>
        <div className="no-print shrink-0">
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
        </div>
      </header>

      <section aria-labelledby="details" className="mt-8">
        <SectionTitle id="details">Details</SectionTitle>
        <Card>
          <MetadataList label={{ width: 96 }}>
            <MetadataListItem label="Phone">
              {client.phone ? (
                <Link href={`tel:${client.phone.replace(/[^\d+]/g, "")}`} color="primary">
                  {client.phone}
                </Link>
              ) : (
                <Unset>No phone</Unset>
              )}
            </MetadataListItem>
            <MetadataListItem label="Email">
              {client.email ? (
                <span className="break-all">
                  <Link href={`mailto:${client.email}`} color="primary">
                    {client.email}
                  </Link>
                </span>
              ) : (
                <Unset>No email</Unset>
              )}
            </MetadataListItem>
            <MetadataListItem label="Address">
              {client.address ? (
                <Link href={mapsUrl(client.address)} isExternalLink color="primary">
                  {client.address}
                </Link>
              ) : (
                <Unset>No address</Unset>
              )}
            </MetadataListItem>
            {client.abn ? (
              <MetadataListItem label="ABN">
                <Text hasTabularNumbers>{client.abn}</Text>
              </MetadataListItem>
            ) : null}
          </MetadataList>
        </Card>
      </section>

      <section aria-labelledby="projects" className="mt-10">
        <SectionTitle
          id="projects"
          action={
            <span className="no-print">
              <NewProjectButton clients={clients} clientId={client.id} label="New project" />
            </span>
          }
        >
          Projects
        </SectionTitle>
        {projects.length ? (
          <List hasDividers edge="flush" density="spacious">
            {projects.map((p) => (
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
                    {[formatProjectNo(p.number), p.siteAddress].filter(Boolean).join(" · ")}
                  </Text>
                }
                endContent={
                  <span className="flex flex-col items-end gap-1">
                    {latestByProject.has(p.id) ? (
                      <Text weight="medium">
                        <Money cents={latestByProject.get(p.id)!} />
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
          <EmptyState
            title={`No projects for ${client.name} yet`}
            description="Make a project for each job you do for them, so their estimates stay together."
          />
        )}
      </section>

      <section aria-labelledby="estimates" className="mt-10">
        <SectionTitle id="estimates" action={estimates.length > 0 && <QuoteSummary estimates={estimates} />}>
          Estimates
        </SectionTitle>
        {estimates.length ? (
          <EstimateRows rows={estimates} showClient={false} />
        ) : (
          <Text as="p" type="supporting">
            No estimates yet.
          </Text>
        )}
      </section>
    </article>
  );
}
