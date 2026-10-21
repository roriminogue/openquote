import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { listEstimates } from "@/lib/estimate/queries";
import { getClient, getProject, listClients } from "@/lib/projects";
import { ProjectView } from "@/components/views/project-view";

export const metadata: Metadata = { title: "Project" };

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <>
      <Link href="/projects" className="-ml-2 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-ink-3 transition-colors hover:bg-hover hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Projects
      </Link>
      <Suspense fallback={<div className="mt-5 h-9 w-2/3 animate-pulse rounded-lg bg-hover" aria-busy="true" />}>
        <Project params={params} />
      </Suspense>
    </>
  );
}

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
  return <ProjectView project={project} client={client} estimates={estimates} clients={clients} />;
}
