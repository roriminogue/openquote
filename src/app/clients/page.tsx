import { Building2, ChevronRight, User, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Money } from "@/components/money";
import { NewClientButton } from "@/components/record-editors";
import { PageHeader, SearchBox } from "@/components/records";
import { requireMember } from "@/lib/auth";
import { clientsOverview, matches } from "@/lib/records-overview";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage({ searchParams }: PageProps<"/clients">) {
  return (
    <Suspense fallback={<PageHeader title="Clients" />}>
      <Clients searchParams={searchParams} />
    </Suspense>
  );
}

async function Clients({ searchParams }: Pick<PageProps<"/clients">, "searchParams">) {
  const member = await requireMember();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const all = await clientsOverview(member.orgId);
  const shown = all.filter((c) => matches(q, c.name, c.contactName, c.email, c.phone, c.address));

  return (
    <>
      <PageHeader title="Clients" action={<NewClientButton />} />
      {all.length === 0 ? (
        <div className="mt-10 max-w-md">
          <Users className="size-8 text-ink-3" aria-hidden />
          <h2 className="mt-3 text-[1.25rem] font-bold">No clients yet</h2>
          <p className="mt-1 text-ink-2">Add the people and businesses you quote for. Their address can fill in the site for a new project.</p>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <SearchBox q={q} placeholder="Search name, email, phone or address…" />
          </div>
          {shown.length ? (
            <ul className="mt-5 divide-y divide-hairline border-y border-hairline">
              {shown.map((c) => {
                const Icon = c.kind === "company" ? Building2 : User;
                const contact = [c.kind === "company" ? c.contactName : null, c.phone, c.email].filter(Boolean).join(" · ");
                return (
                  <li key={c.id}>
                    <Link href={`/clients/${c.id}`} className="group flex items-center gap-3 px-1 py-4 transition-colors hover:bg-surface sm:px-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-tape bg-surface-2 text-ink-2" aria-hidden>
                        <Icon className="size-[1.125rem]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[1.0625rem] font-semibold group-hover:underline">{c.name}</span>
                        <span className="block truncate text-[0.9375rem] text-ink-3">{contact || c.address || "No contact details"}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        {c.estimateCount > 0 && <Money cents={c.quotedCents} className="block text-[1.125rem] font-bold" />}
                        <span className="text-[0.875rem] text-ink-3">
                          {c.projectCount} {c.projectCount === 1 ? "project" : "projects"}
                        </span>
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-ink-3" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-8 text-ink-3">
              No clients match.{" "}
              <Link href="/clients" className="font-semibold text-ink underline underline-offset-4">
                Show all
              </Link>
            </p>
          )}
        </>
      )}
    </>
  );
}
