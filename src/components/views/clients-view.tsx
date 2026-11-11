import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { List, ListItem } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";
import { Money } from "@/components/money";
import { NewClientButton } from "@/components/record-editors";
import { PageHeader, SearchBox } from "@/components/records";
import type { ClientOption } from "@/lib/project-schema";
import { matches, type Quoted } from "@/lib/records-overview";

export function ClientsView({ all, q }: { all: (ClientOption & Quoted & { projectCount: number })[]; q: string }) {
  const shown = all.filter((c) => matches(q, c.name, c.contactName, c.email, c.phone, c.address));

  return (
    <>
      <PageHeader title="Clients" description="The people and businesses you quote for." action={<NewClientButton />} />
      {all.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No clients yet"
            description="Add a client once and their address can fill in the site for every new project."
            actions={<NewClientButton variant="primary" />}
          />
        </div>
      ) : (
        <>
          <div className="mt-6">
            <SearchBox q={q} placeholder="Search name, email, phone or address" />
          </div>
          <div className="mt-2">
            {shown.length ? (
              <List hasDividers edge="flush" density="spacious">
                {shown.map((c) => {
                  const contact = [c.kind === "company" ? c.contactName : null, c.phone, c.email]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <ListItem
                      key={c.id}
                      href={`/clients/${c.id}`}
                      label={
                        <Text weight="medium" maxLines={2}>
                          {c.name}
                        </Text>
                      }
                      description={
                        <Text type="supporting" maxLines={2}>
                          {[c.kind === "company" ? "Business" : "Person", contact].filter(Boolean).join(" · ")}
                        </Text>
                      }
                      endContent={
                        <span className="flex flex-col items-end gap-0.5">
                          {c.estimateCount > 0 ? (
                            <Text weight="medium">
                              <Money cents={c.quotedCents} />
                            </Text>
                          ) : (
                            <Text type="supporting">Nothing quoted</Text>
                          )}
                          <Text type="supporting" hasTabularNumbers>
                            {c.projectCount} {c.projectCount === 1 ? "project" : "projects"}
                          </Text>
                        </span>
                      }
                    />
                  );
                })}
              </List>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="Nothing matches"
                  description={`No clients match “${q}”.`}
                  actions={<Button href="/clients" label="Show all clients" />}
                />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
