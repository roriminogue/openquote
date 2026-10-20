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
      <Link href="/estimates" className="inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-ink-3 hover:text-ink">
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

  return <EstimateView estimate={data.estimate} gstRatePct={data.org.gstRate} groups={data.groups} totals={data.totals} />;
}

function DetailSkeleton() {
  return (
    <div className="mt-4 space-y-6" aria-busy="true" aria-label="Loading estimate">
      <div className="h-9 w-2/3 animate-pulse rounded-tape bg-surface-2" />
      <div className="h-20 animate-pulse rounded-tape bg-surface-2" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-tape bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
