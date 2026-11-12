import { notFound } from "@/lib/navigation";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { EstimateView } from "@/components/estimate-view";
import { getEstimate } from "@/lib/estimate/queries";
import { useQuery } from "@/lib/data";
import { useParams } from "react-router";
import { getClient } from "@/lib/projects";
import { proposalActivity } from "@/lib/proposals";
import { deleteEstimateRecord } from "@/app/actions/delete";
import { DeleteRecord } from "@/components/delete-record";
import { formatEstimateNo } from "@/lib/pricing";
import { BackLink } from "@/components/back-link";
import { Skeleton } from "@astryxdesign/core/Skeleton";

export default function EstimatePage() {
  return (
    <>
      <BackLink href="/estimates" label="Estimates" />
      <Suspense fallback={<DetailSkeleton />}>
        <EstimateDetail />
      </Suspense>
    </>
  );
}

function EstimateDetail() {
  const id = useParams().id ?? "";
  const loaded = useQuery(`estimate:${id}`, async () => {
    const member = await requireMember();
    const data = await getEstimate(member.orgId, id);
    if (!data) return null;
    const [activity, client] = await Promise.all([
      proposalActivity(member.orgId, id),
      data.estimate.clientId ? getClient(member.orgId, data.estimate.clientId) : null,
    ]);
    return { data, activity, client };
  });
  if (!loaded) notFound();
  const { data, activity, client } = loaded;
  const name = client?.kind === "company" ? (client.contactName ?? client.name) : client?.name;

  const number = formatEstimateNo(data.estimate.number);
  return (
    <>
      <EstimateView
        estimate={data.estimate}
        gstRatePct={data.org.gstRate}
        groups={data.groups}
        totals={data.totals}
        context={data.context}
        activity={activity}
        send={{
          estimateId: id,
          title: data.estimate.title,
          businessName: data.org.name,
          client: client
            ? {
                name: client.name,
                firstName: (name ?? client.name).split(" ")[0],
                phone: client.phone,
                email: client.email,
              }
            : null,
          detail: data.estimate.displayOptions?.detail ?? "groups",
          sent: !!activity,
        }}
      />
      <DeleteRecord
        label="Delete estimate"
        question={`Delete ${number}?`}
        consequence={
          activity
            ? "Its lines, history and the record of sending it go with it."
            : "Its lines and history go with it."
        }
        action={deleteEstimateRecord.bind(null, id)}
        then="/estimates"
      />
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="mt-5 flex flex-col gap-6" aria-busy="true" aria-label="Loading estimate">
      <Skeleton width="66%" height={36} />
      <Skeleton height={192} radius={4} index={1} />
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={40} index={i + 2} />
        ))}
      </div>
    </div>
  );
}
