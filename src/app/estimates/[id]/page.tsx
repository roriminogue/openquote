import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { EstimateView } from "@/components/estimate-view";
import { getEstimate } from "@/lib/estimate/queries";

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

  return <EstimateView estimate={data.estimate} gstRatePct={data.org.gstRate} groups={data.groups} totals={data.totals} context={data.context} />;
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
