import { Skeleton } from "@astryxdesign/core/Skeleton";
import { BackLink } from "@/components/back-link";
import { notFound } from "@/lib/navigation";
import { Suspense } from "react";
import { useParams } from "react-router";
import { requireMember } from "@/lib/auth";
import { useQuery } from "@/lib/data";
import { listEstimates } from "@/lib/estimate/queries";
import { getClient, listClients, listProjects } from "@/lib/projects";
import { ClientView } from "@/components/views/client-view";
import { deleteClientRecord } from "@/app/actions/delete";
import { DeleteRecord } from "@/components/delete-record";

export default function ClientPage() {
  return (
    <>
      <BackLink href="/clients" label="Clients" />
      <Suspense
        fallback={
          <div className="mt-3" aria-busy="true" aria-label="Loading">
            <Skeleton width="66%" height={36} />
          </div>
        }
      >
        <Client />
      </Suspense>
    </>
  );
}

function Client() {
  const id = useParams().id ?? "";
  const loaded = useQuery(`client:${id}`, async () => {
    const member = await requireMember();
    const client = await getClient(member.orgId, id);
    if (!client) return null;
    const [allProjects, estimates, clients] = await Promise.all([
      listProjects(member.orgId),
      listEstimates(member.orgId, { clientId: id }),
      listClients(member.orgId),
    ]);
    return { client, allProjects, estimates, clients };
  });
  if (!loaded) notFound();
  const { client, allProjects, estimates, clients } = loaded;
  return (
    <>
      <ClientView client={client} allProjects={allProjects} estimates={estimates} clients={clients} />
      <DeleteRecord
        label="Delete client"
        question={`Delete ${client.name}?`}
        consequence={
          estimates.length
            ? `Their ${estimates.length === 1 ? "estimate stays" : `${estimates.length} estimates stay`} in Estimates, without a client.`
            : "They have no estimates."
        }
        action={deleteClientRecord.bind(null, id)}
        then="/clients"
      />
    </>
  );
}
