import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { EstimateView } from "@/components/estimate-view";
import { getEstimate, getEstimateHeading } from "@/lib/estimate/queries";
import { getClient } from "@/lib/projects";
import { proposalActivity } from "@/lib/proposals";
import { deleteEstimateRecord } from "@/app/actions/delete";
import { DeleteRecord } from "@/components/delete-record";
import { formatEstimateNo } from "@/lib/pricing";
import { BackLink } from "@/components/back-link";
import { Skeleton } from "@astryxdesign/core/Skeleton";

/**
 * Each estimate's tab reads "EST-1010 Fence replacement", not just "Estimate". Set through metadata rather than a
 * <title> in the page: a page-level <title> lost to the plain one whenever a save or share refreshed the page.
 */
export async function generateMetadata({ params }: PageProps<"/estimates/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { title: "Estimate" };
  const member = await requireMember();
  const row = await getEstimateHeading(member.orgId, id);
  return { title: row ? `${formatEstimateNo(row.number)} ${row.title}` : "Estimate" };
}

export default function EstimatePage({ params }: PageProps<"/estimates/[id]">) {
  return (
    <>
      <BackLink href="/estimates" label="Estimates" />
      <Suspense fallback={<DetailSkeleton />}>
        <EstimateDetail params={params} />
      </Suspense>
    </>
  );
}

async function EstimateDetail({ params }: Pick<PageProps<"/estimates/[id]">, "params">) {
  const { id } = await params;
  const member = await requireMember();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getEstimate(member.orgId, id);
  if (!data) notFound();

  const [activity, client] = await Promise.all([
    proposalActivity(member.orgId, id),
    data.estimate.clientId ? getClient(member.orgId, data.estimate.clientId) : null,
  ]);
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
            ? "Its lines, history and the client's link go with it, so the link stops working."
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
