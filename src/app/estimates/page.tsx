import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EstimateRows } from "@/components/estimate-rows";
import { LinkButton } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { listEstimates } from "@/lib/estimate/queries";

export const metadata: Metadata = { title: "Estimates" };

export default function EstimatesPage() {
  return (
    <>
      <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.01em]">Estimates</h1>
      <Suspense fallback={<ListSkeleton />}>
        <EstimateList />
      </Suspense>
    </>
  );
}

async function EstimateList() {
  const member = await requireMember();
  const rows = await listEstimates(member.orgId);

  if (!rows.length) return <EmptyState />;

  return <EstimateRows rows={rows} />;
}

const examples = [
  "Build a 4 × 3 m merbau deck, 600 mm high, two steps, oil finish",
  "Retile a 2.4 × 2 m bathroom floor to ceiling, new walk-in shower",
  "Replace 20 m of paling fence, reuse the posts",
];

function EmptyState() {
  return (
    <div className="mt-8 max-w-xl">
      <p className="text-[1.0625rem] text-ink-2">
        Describe a job the way you&rsquo;d tell a mate on the phone. OpenQuote prices it with your rates in under a
        minute, line by line.
      </p>
      <LinkButton href="/estimates/new" size="lg" className="mt-6">
        Describe your first job
        <ArrowRight className="size-5" aria-hidden />
      </LinkButton>
      <h2 className="mt-10 font-bold">Try one of these</h2>
      <ul className="mt-3 space-y-2">
        {examples.map((ex) => (
          <li key={ex}>
            <Link
              href={`/estimates/new?describe=${encodeURIComponent(ex)}`}
              className="block rounded-tape border border-hairline bg-surface px-4 py-3 text-ink-2 transition-colors hover:border-ink hover:text-ink"
            >
              {ex}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="mt-6 divide-y divide-hairline border-y border-hairline" aria-busy="true" aria-label="Loading estimates">
      {[0, 1, 2].map((i) => (
        <li key={i} className="space-y-3 px-1 py-5 sm:px-3">
          <div className="h-4 w-2/3 animate-pulse rounded-tape bg-surface-2" />
          <div className="h-1.5 w-full animate-pulse rounded-sm bg-surface-2" />
        </li>
      ))}
    </ul>
  );
}
