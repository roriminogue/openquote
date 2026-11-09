import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { EstimateView } from "@/components/estimate-view";
import { getEstimate } from "@/lib/estimate/queries";
import { getClient } from "@/lib/projects";
import { proposalActivity } from "@/lib/proposals";
import { deleteEstimateRecord } from "@/app/actions/delete";
import { DeleteRecord } from "@/components/delete-record";
import { formatEstimateNo } from "@/lib/pricing";

export const metadata: Metadata = { title: "Estimate" };

export default function EstimatePage({ params }: PageProps<"/estimates/[id]">) {
  return (
    <>
      <Link
        href="/estimates"
        className="no-print -ml-2 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-ink-3 transition-colors hover:bg-hover hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Estimates
      </Link>
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
      {/* React puts this in <head>: each estimate's tab reads "EST-1010 Fence replacement", not just "Estimate". */}
      <title>{`${number} ${data.estimate.title ?? "Estimate"} · OpenQuote AU`}</title>
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
          client: client ? { name: client.name, firstName: (name ?? client.name).split(" ")[0], phone: client.phone, email: client.email } : null,
          detail: data.estimate.displayOptions?.detail ?? "groups",
          sent: !!activity,
        }}
      />
      <DeleteRecord
        label="Delete estimate"
        question={`Delete ${number}?`}
        consequence={activity ? "Its lines, history and the client's link go with it, so the link stops working." : "Its lines and history go with it."}
        action={deleteEstimateRecord.bind(null, id)}
        then="/estimates"
      />
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="mt-5 space-y-6" aria-busy="true" aria-label="Loading estimate">
      <div className="h-9 w-2/3 animate-pulse rounded-lg bg-hover" />
      <div className="h-48 animate-pulse rounded-xl bg-hover" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-hover" />
        ))}
      </div>
    </div>
  );
}
