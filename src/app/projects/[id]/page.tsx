import { ArrowLeft, MapPin, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EstimateRows } from "@/components/estimate-rows";
import { Money } from "@/components/money";
import { EditProjectButton } from "@/components/record-editors";
import { mapsUrl, StatusPill } from "@/components/records";
import { LinkButton, Rule } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { listEstimates } from "@/lib/estimate/queries";
import { formatProjectNo, getClient, getProject, listClients } from "@/lib/projects";

export const metadata: Metadata = { title: "Project" };

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <>
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Projects
      </Link>
      <Suspense fallback={<div className="mt-4 h-9 w-2/3 animate-pulse rounded-tape bg-surface-2" aria-busy="true" />}>
        <Project params={params} />
      </Suspense>
    </>
  );
}

const dateFmt = new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const fmtDate = (d: string | null) => (d ? dateFmt.format(new Date(`${d}T00:00:00`)) : null);

async function Project({ params }: Pick<PageProps<"/projects/[id]">, "params">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const member = await requireMember();
  const project = await getProject(member.orgId, id);
  if (!project) notFound();
  const [client, estimates, clients] = await Promise.all([
    getClient(member.orgId, project.clientId),
    listEstimates(member.orgId, { projectId: id }),
    listClients(member.orgId),
  ]);
  const quoted = estimates.reduce((s, r) => s + r.totals.totalCents, 0);
  const start = fmtDate(project.startDate);
  const finish = fmtDate(project.endDate);

  return (
    <article className="mt-4">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.01em] sm:text-[2.125rem]">{project.name}</h1>
            <StatusPill status={project.status} />
          </div>
          <p className="figures mt-1 text-[0.9375rem] font-semibold text-ink-3">{formatProjectNo(project.number)}</p>
        </div>
        <div className="flex gap-2">
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
            <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            Estimate
          </LinkButton>
        </div>
      </header>

      <dl className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2">
        <Fact label="Client">
          {client ? (
            <Link href={`/clients/${client.id}`} className="font-semibold underline underline-offset-4 hover:no-underline">
              {client.name}
            </Link>
          ) : (
            "—"
          )}
          {client?.kind === "company" && client.contactName && <span className="text-ink-3"> · {client.contactName}</span>}
        </Fact>
        <Fact label="Site">
          {project.siteAddress ? (
            <a href={mapsUrl(project.siteAddress)} target="_blank" rel="noreferrer" className="group inline-flex items-start gap-1.5">
              <MapPin className="mt-1 size-4 shrink-0 text-ink-3" aria-hidden />
              <span className="underline underline-offset-4 group-hover:no-underline">{project.siteAddress}</span>
            </a>
          ) : (
            <span className="text-ink-3">No site address</span>
          )}
        </Fact>
        <Fact label="When">
          {start || finish ? (
            <span className="figures">
              {start ?? "?"} → {finish ?? "?"}
            </span>
          ) : (
            <span className="text-ink-3">Not scheduled</span>
          )}
        </Fact>
        <Fact label="Quoted">
          {estimates.length ? (
            <>
              <Money cents={quoted} className="text-[1.25rem] font-bold" />
              <span className="text-ink-3">
                {" "}
                across {estimates.length} {estimates.length === 1 ? "estimate" : "estimates"}
              </span>
            </>
          ) : (
            <span className="text-ink-3">Nothing yet</span>
          )}
        </Fact>
        {project.notes && (
          <div className="sm:col-span-2">
            <dt className="label text-ink-3">Notes</dt>
            <dd className="mt-1 max-w-[68ch] whitespace-pre-line text-ink-2">{project.notes}</dd>
          </div>
        )}
      </dl>

      <section aria-labelledby="estimates" className="mt-10">
        <Rule />
        <h2 id="estimates" className="mt-4 text-[1.25rem] font-bold">
          Estimates
        </h2>
        {estimates.length ? (
          <EstimateRows rows={estimates} />
        ) : (
          <p className="mt-2 text-ink-2">
            No estimates for this project yet.{" "}
            <Link href={`/estimates/new?project=${project.id}`} className="font-semibold text-ink underline underline-offset-4">
              Price the first one
            </Link>
          </p>
        )}
      </section>
    </article>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="label text-ink-3">{label}</dt>
      <dd className="mt-1 text-[1.0625rem]">{children}</dd>
    </div>
  );
}
