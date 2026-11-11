import { Skeleton } from "@astryxdesign/core/Skeleton";
import type { Metadata } from "next";
import { BackLink } from "@/components/back-link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { listEstimates } from "@/lib/estimate/queries";
import { getClient, getProject, listClients } from "@/lib/projects";
import { ProjectView } from "@/components/views/project-view";
import { deleteProjectRecord } from "@/app/actions/delete";
import { DeleteRecord } from "@/components/delete-record";

export const metadata: Metadata = { title: "Project" };

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <>
      <BackLink href="/projects" label="Projects" />
      <Suspense
        fallback={
          <div className="mt-3" aria-busy="true" aria-label="Loading">
            <Skeleton width="66%" height={36} />
          </div>
        }
      >
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
  return (
    <>
      <ProjectView project={project} client={client} estimates={estimates} clients={clients} />
      <DeleteRecord
        label="Delete project"
        question={`Delete ${project.name}?`}
        consequence={
          estimates.length
            ? `Its ${estimates.length === 1 ? "estimate stays" : `${estimates.length} estimates stay`} in Estimates, just no longer in a project.`
            : "It has no estimates."
        }
        action={deleteProjectRecord.bind(null, id)}
        then="/projects"
      />
    </>
  );
}
