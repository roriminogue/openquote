import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EstimateRows } from "@/components/estimate-rows";
import { LinkButton, PageTitle } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { listEstimates } from "@/lib/estimate/queries";

export const metadata: Metadata = { title: "Estimates" };

export default function EstimatesPage() {
  return (
    <>
      <PageTitle title="Estimates" description="Every job you’ve priced, newest first." />
      <Suspense fallback={<ListSkeleton />}>
        <EstimateList />
      </Suspense>
    </>
  );
}

async function EstimateList() {
  const member = await requireMember();
  const rows = await listEstimates(member.orgId);

  if (!rows.length) return <FirstEstimate />;

  return (
    <div className="mt-8">
      <EstimateRows rows={rows} />
    </div>
  );
}

const examples = [
  ["Deck", "Build a 4 × 3 m merbau deck, 600 mm high, two steps, oil finish"],
  ["Bathroom", "Retile a 2.4 × 2 m bathroom floor to ceiling, new walk-in shower"],
  ["Fence", "Replace 20 m of paling fence, reuse the posts"],
] as const;

function FirstEstimate() {
  return (
    <div className="dots mt-8 rounded-2xl bg-subtle/60 px-4 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-lg rounded-[14px] bg-surface p-5 shadow-raised sm:p-6">
        <h2 className="font-display text-xl font-medium">Price your first job</h2>
        <p className="mt-1 text-sm text-ink-3">
          Describe it the way you&rsquo;d tell a mate on the phone. OpenQuote AU breaks it into stages and prices each line
          with your rates, usually in under a minute.
        </p>
        <LinkButton href="/estimates/new" variant="accent" className="mt-5">
          Describe a job
          <ArrowRight className="size-4" aria-hidden />
        </LinkButton>
        <h3 className="mt-6 text-xs font-medium text-ink-3">Or start from an example</h3>
        <ul className="mt-1 divide-y divide-dashed divide-border">
          {examples.map(([label, text]) => (
            <li key={label}>
              <Link
                href={`/estimates/new?describe=${encodeURIComponent(text)}`}
                className="group flex min-h-11 items-center gap-3 py-2.5 text-sm text-ink-2 transition-colors hover:text-ink"
              >
                <span className="w-20 shrink-0 font-medium text-ink">{label}</span>
                <span className="min-w-0 flex-1 truncate">{text}</span>
                <ArrowRight className="size-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-8 border-t border-border" aria-busy="true" aria-label="Loading estimates">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between gap-6 border-b border-border py-4">
          <div className="h-4 w-1/2 animate-pulse rounded bg-hover" />
          <div className="h-4 w-20 animate-pulse rounded bg-hover" />
        </div>
      ))}
    </div>
  );
}
