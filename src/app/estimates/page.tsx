import { Heading } from "@astryxdesign/core/Heading";
import { List, ListItem } from "@astryxdesign/core/List";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Text } from "@astryxdesign/core/Text";
import { FileText } from "lucide-react";
import { Suspense } from "react";
import { BackupReminder } from "@/components/backup-reminder";
import { DemoBanner } from "@/components/demo-banner";
import { isDemo } from "@/lib/demo";
import { EstimateRows } from "@/components/estimate-rows";
import { NewEstimateButton } from "@/components/new-estimate-button";
import { PageTitle } from "@/components/page-title";
import { requireMember } from "@/lib/auth";
import { useQuery } from "@/lib/data";
import { listEstimates } from "@/lib/estimate/queries";

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

function EstimateList() {
  const { orgId, rows } = useQuery("estimates", async () => {
    const { orgId } = await requireMember();
    return { orgId, rows: await listEstimates(orgId) };
  });

  if (!rows.length) return <FirstEstimate />;

  return (
    <>
      {isDemo() ? <DemoBanner /> : <BackupReminder orgId={orgId} />}
      <div className="mt-6">
        <EstimateRows rows={rows} />
      </div>
    </>
  );
}

const examples = [
  ["Deck", "Build a 4 × 3 m merbau deck, 600 mm high, two steps, oil finish"],
  ["Bathroom", "Retile a 2.4 × 2 m bathroom floor to ceiling, new walk-in shower"],
  ["Fence", "Replace 20 m of paling fence, reuse the posts"],
] as const;

/**
 * No estimates yet: what OpenQuote AU does and the way in, beside three jobs to try. One panel across the column;
 * the two halves stack on a phone and sit side by side from 768px.
 */
function FirstEstimate() {
  return (
    <section className="raised-surface mt-8 grid grid-cols-1 overflow-hidden md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col p-5 sm:p-8">
        <span
          aria-hidden
          className="mb-5 grid size-10 place-items-center rounded-(--radius-element) bg-(--color-background-muted) text-(--color-text-primary)"
        >
          <FileText size={20} strokeWidth={2} />
        </span>
        <Heading level={2}>Price your first job</Heading>
        <div className="mt-2 max-w-[44ch]">
          <Text as="p" color="secondary">
            Describe it the way you&rsquo;d tell a mate on the phone. OpenQuote AU breaks it into stages and prices each
            line with your rates, usually in under a minute.
          </Text>
        </div>
        <div className="mt-6 max-sm:[&>*]:w-full md:mt-auto md:pt-8">
          <NewEstimateButton label="Describe a job" />
        </div>
      </div>
      <div className="border-t border-(--color-border) p-3 sm:p-5 md:border-t-0 md:border-l">
        <List
          hasDividers
          edge="flush"
          header={
            <div className="pt-2">
              <Text type="supporting" weight="medium">
                Or start from an example
              </Text>
            </div>
          }
        >
          {examples.map(([label, text]) => (
            <ListItem
              key={label}
              href={`/estimates/new?describe=${encodeURIComponent(text)}`}
              label={label}
              description={text}
            />
          ))}
        </List>
      </div>
    </section>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-3" aria-busy="true" aria-label="Loading estimates">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} height={56} index={i} />
      ))}
    </div>
  );
}
