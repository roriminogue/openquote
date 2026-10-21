import Link from "next/link";
import { Money } from "@/components/money";
import { NewClientButton } from "@/components/record-editors";
import { ListFrame, listHeader, listRow, PageHeader, SearchBox } from "@/components/records";
import { EmptyState, LinkButton } from "@/components/ui";
import type { ClientOption } from "@/lib/project-schema";
import { matches, type Quoted } from "@/lib/records-overview";

const cols = "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6rem_8rem]";

export function ClientsView({ all, q }: { all: (ClientOption & Quoted & { projectCount: number })[]; q: string }) {
  const shown = all.filter((c) => matches(q, c.name, c.contactName, c.email, c.phone, c.address));

  return (
    <>
      <PageHeader title="Clients" description="The people and businesses you quote for." action={<NewClientButton />} />
      {all.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No clients yet" action={<NewClientButton variant="primary" />}>
            Add a client once and their address can fill in the site for every new project.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-7">
            <SearchBox q={q} placeholder="Search name, email, phone or address…" />
          </div>
          <div className="mt-5">
            {shown.length ? (
              <ListFrame
                header={
                  <div aria-hidden className={`${listHeader} ${cols}`}>
                    <span>Name</span>
                    <span>Contact</span>
                    <span>Projects</span>
                    <span className="text-right">Latest quote</span>
                  </div>
                }
              >
                {shown.map((c) => {
                  const contact = [c.kind === "company" ? c.contactName : null, c.phone, c.email].filter(Boolean).join(" · ");
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/clients/${c.id}`}
                        className={`${listRow} ${cols}`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-ink">{c.name}</span>
                          <span className="mt-0.5 block truncate text-caption text-ink-3">
                            {c.kind === "company" ? "Business" : "Person"}
                            <span className="md:hidden">{contact ? ` · ${contact}` : ""}</span>
                          </span>
                        </span>
                        <span className="hidden truncate text-sm text-ink-2 md:block">{contact || <span className="text-ink-3">No contact details</span>}</span>
                        <span className="figures hidden text-sm text-ink-2 md:block">{c.projectCount}</span>
                        <span className="text-right">
                          {c.estimateCount > 0 ? (
                            <Money cents={c.quotedCents} className="block text-sm font-medium text-ink" />
                          ) : (
                            <span className="text-caption text-ink-3">Nothing quoted</span>
                          )}
                          <span className="text-caption text-ink-3 md:hidden">
                            {c.projectCount} {c.projectCount === 1 ? "project" : "projects"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ListFrame>
            ) : (
              <EmptyState title="Nothing matches" action={<LinkButton href="/clients" variant="secondary">Show all clients</LinkButton>}>
                No clients match &ldquo;{q}&rdquo;.
              </EmptyState>
            )}
          </div>
        </>
      )}
    </>
  );
}
