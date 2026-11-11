import { List, ListItem } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";
import type { listEstimates } from "@/lib/estimate/queries";
import { formatEstimateNo } from "@/lib/pricing";
import { EstimateStatus } from "./estimate-view";
import { Money } from "./money";
import { dateFormat } from "@/lib/dates";
import { keepUnits } from "@/lib/units";

const dateFmt = dateFormat({ day: "numeric", month: "short" });

type Rows = Awaited<ReturnType<typeof listEstimates>>;

/**
 * Estimates as rows, newest first: the job, then its number, client, size and date in grey; the total and status
 * on the right. One layout for every width, sized for a thumb on a phone. Each row opens its estimate.
 */
export function EstimateRows({ rows, showClient = true }: { rows: Rows; showClient?: boolean }) {
  return (
    <List hasDividers edge="flush" density="spacious">
      {rows.map(({ estimate: e, totals, lineCount, clientName }) => (
        <ListItem
          key={e.id}
          href={`/estimates/${e.id}`}
          label={
            <Text weight="medium" maxLines={2}>
              {e.title ? keepUnits(e.title) : "Untitled estimate"}
            </Text>
          }
          description={
            <Text type="supporting" maxLines={2} hasTabularNumbers>
              {[
                formatEstimateNo(e.number),
                showClient ? clientName : null,
                `${lineCount} lines`,
                dateFmt.format(e.createdAt),
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          }
          endContent={
            <span className="flex flex-col items-end gap-1">
              <Text weight="medium">
                <Money cents={totals.totalCents} />
              </Text>
              <EstimateStatus status={e.status} />
            </span>
          }
        />
      ))}
    </List>
  );
}
