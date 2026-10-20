import { ArrowLeft, ChevronRight, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EstimateRows } from "@/components/estimate-rows";
import { Money } from "@/components/money";
import { EditClientButton, NewProjectButton } from "@/components/record-editors";
import { mapsUrl, StatusPill } from "@/components/records";
import { buttonClass, Rule } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { listEstimates } from "@/lib/estimate/queries";
import { formatProjectNo, getClient, listClients, listProjects } from "@/lib/projects";

export const metadata: Metadata = { title: "Client" };

export default function ClientPage({ params }: PageProps<"/clients/[id]">) {
  return (
    <>
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Clients
      </Link>
      <Suspense fallback={<div className="mt-4 h-9 w-2/3 animate-pulse rounded-tape bg-surface-2" aria-busy="true" />}>
        <Client params={params} />
      </Suspense>
    </>
  );
}

async function Client({ params }: Pick<PageProps<"/clients/[id]">, "params">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const member = await requireMember();
  const client = await getClient(member.orgId, id);
  if (!client) notFound();
  const [allProjects, estimates, clients] = await Promise.all([
    listProjects(member.orgId),
    listEstimates(member.orgId, { clientId: id }),
    listClients(member.orgId),
  ]);
  const projects = allProjects.filter((p) => p.client.id === id);
  const quoted = estimates.reduce((s, r) => s + r.totals.totalCents, 0);

  return (
    <article className="mt-4">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.01em] sm:text-[2.125rem]">{client.name}</h1>
          <p className="mt-1 text-[1.0625rem] text-ink-2">
            {client.kind === "company" ? "Business" : "Person"}
            {client.kind === "company" && client.contactName ? ` · Contact: ${client.contactName}` : ""}
            {client.abn ? <span className="figures"> · ABN {client.abn}</span> : ""}
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

      {(client.phone || client.email) && (
        <div className="mt-6 grid grid-cols-2 gap-2 sm:flex">
          {client.phone && (
            <a href={`tel:${client.phone.replace(/[^\d+]/g, "")}`} className={buttonClass("secondary", "lg", "min-w-0")}>
              <Phone className="size-5 shrink-0" aria-hidden />
              <span className="figures truncate">{client.phone}</span>
            </a>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className={buttonClass("secondary", "lg", "min-w-0")}>
              <Mail className="size-5 shrink-0" aria-hidden />
              <span className="truncate">{client.email}</span>
            </a>
          )}
        </div>
      )}

      <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
        <div>
          <dt className="label text-ink-3">Address</dt>
          <dd className="mt-1 text-[1.0625rem]">
            {client.address ? (
              <a href={mapsUrl(client.address)} target="_blank" rel="noreferrer" className="group inline-flex items-start gap-1.5">
                <MapPin className="mt-1 size-4 shrink-0 text-ink-3" aria-hidden />
                <span className="underline underline-offset-4 group-hover:no-underline">{client.address}</span>
              </a>
            ) : (
              <span className="text-ink-3">No address</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="label text-ink-3">Quoted</dt>
          <dd className="mt-1 text-[1.0625rem]">
            {estimates.length ? <Money cents={quoted} className="text-[1.25rem] font-bold" /> : <span className="text-ink-3">Nothing yet</span>}
          </dd>
        </div>
      </dl>

      <section aria-labelledby="projects" className="mt-10">
        <Rule />
        <div className="mt-4 flex items-center justify-between gap-3">
          <h2 id="projects" className="text-[1.25rem] font-bold">
            Projects
          </h2>
          <NewProjectButton clients={clients} clientId={client.id} label="Project" />
        </div>
        {projects.length ? (
          <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
            {projects.map((p) => (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="group flex items-center gap-3 px-1 py-3.5 transition-colors hover:bg-surface sm:px-3">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2.5">
                      <span className="truncate font-semibold group-hover:underline">{p.name}</span>
                      <StatusPill status={p.status} />
                    </span>
                    <span className="block truncate text-[0.9375rem] text-ink-3">
                      <span className="figures">{formatProjectNo(p.number)}</span>
                      {p.siteAddress ? ` · ${p.siteAddress}` : ""}
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-ink-3" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-ink-2">No projects for {client.name} yet.</p>
        )}
      </section>

      <section aria-labelledby="estimates" className="mt-10">
        <Rule />
        <h2 id="estimates" className="mt-4 text-[1.25rem] font-bold">
          Estimates
        </h2>
        {estimates.length ? <EstimateRows rows={estimates} /> : <p className="mt-2 text-ink-2">No estimates yet.</p>}
      </section>
    </article>
  );
}
