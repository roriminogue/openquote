import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { List, ListItem } from "@astryxdesign/core/List";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Text } from "@astryxdesign/core/Text";
import type { Metadata } from "next";
import { Suspense } from "react";
import { EstimateRows } from "@/components/estimate-rows";
import { NewEstimateButton } from "@/components/new-estimate-button";
import { PageTitle } from "@/components/page-title";
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
    <div className="mt-6">
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
    <div className="mt-8 max-w-lg">
      <Card elevation="low">
        <Heading level={2}>Price your first job</Heading>
        <div className="mt-1">
          <Text as="p" color="secondary">
            Describe it the way you&rsquo;d tell a mate on the phone. OpenQuote AU breaks it into stages and prices each
            line with your rates, usually in under a minute.
          </Text>
        </div>
        <div className="mt-5">
          <NewEstimateButton label="Describe a job" />
        </div>
        <div className="mt-6">
          <List
            hasDividers
            edge="flush"
            header={
              <Text type="supporting" weight="medium">
                Or start from an example
              </Text>
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
      </Card>
    </div>
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
