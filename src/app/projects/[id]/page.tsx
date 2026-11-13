import { Skeleton } from "@astryxdesign/core/Skeleton";
import { BackLink } from "@/components/back-link";
import { notFound } from "@/lib/navigation";
import { Suspense } from "react";
import { useParams } from "react-router";
import { requireMember } from "@/lib/auth";
import { useQuery } from "@/lib/data";
import { listEstimates } from "@/lib/estimate/queries";
import { getClient, getProject, listClients } from "@/lib/projects";
import { ProjectView } from "@/components/views/project-view";
import { deleteProjectRecord } from "@/app/actions/delete";
import { DeleteRecord } from "@/components/delete-record";

export default function ProjectPage() {
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
        <Project />
      </Suspense>
    </>
  );
}

function Project() {
  const id = useParams().id ?? "";
  const loaded = useQuery(`project:${id}`, async () => {
    const member = await requireMember();
    const project = await getProject(member.orgId, id);
    if (!project) return null;
    const [client, estimates, clients] = await Promise.all([
      getClient(member.orgId, project.clientId),
      listEstimates(member.orgId, { projectId: id }),
      listClients(member.orgId),
    ]);
    return { project, client, estimates, clients };
  });
  if (!loaded) notFound();
  const { project, client, estimates, clients } = loaded;
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
