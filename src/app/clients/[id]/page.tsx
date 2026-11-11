import { Skeleton } from "@astryxdesign/core/Skeleton";
import type { Metadata } from "next";
import { BackLink } from "@/components/back-link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { listEstimates } from "@/lib/estimate/queries";
import { getClient, listClients, listProjects } from "@/lib/projects";
import { ClientView } from "@/components/views/client-view";
import { deleteClientRecord } from "@/app/actions/delete";
import { DeleteRecord } from "@/components/delete-record";

export const metadata: Metadata = { title: "Client" };

export default function ClientPage({ params }: PageProps<"/clients/[id]">) {
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
