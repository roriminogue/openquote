import Link from "next/link";
import type { listEstimates } from "@/lib/estimate/queries";
import { formatEstimateNo } from "@/lib/pricing";
import { EstimateStatus } from "./estimate-view";
import { Money } from "./money";
import { ListFrame, listHeader, listRow } from "./records";
import { dateFormat } from "@/lib/dates";
import { keepUnits } from "@/lib/units";

const dateFmt = dateFormat({ day: "numeric", month: "short" });

type Rows = Awaited<ReturnType<typeof listEstimates>>;

const cols = "md:grid-cols-[5.5rem_minmax(0,1fr)_9rem_6.5rem_7.5rem]";

/** Estimates as a quiet table: number, what and who, status, total. Rows link to the estimate. */
export function EstimateRows({
  rows,
  showClient = true,
}: {
  rows: Rows;
  showClient?: boolean;
}) {
  return (
    <div>
      <ListFrame
        header={
          <div aria-hidden className={`${listHeader} ${cols}`}>
            <span>Number</span>
            <span>Job</span>
            <span>Status</span>
            <span>Created</span>
            <span className="text-right">Total</span>
          </div>
        }
      >
        {rows.map(({ estimate: e, totals, lineCount, clientName }) => (
          <li key={e.id}>
            <Link href={`/estimates/${e.id}`} className={`${listRow} ${cols}`}>
              <span className="figures hidden text-sm text-ink-3 md:block">
                {formatEstimateNo(e.number)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">
                  {e.title ? keepUnits(e.title) : e.title}
                </span>
                <span className="mt-0.5 block truncate text-caption text-ink-3">
                  <span className="figures md:hidden">
                    {formatEstimateNo(e.number)} ·{" "}
                  </span>
                  {showClient && clientName ? `${clientName} · ` : ""}
                  {lineCount} lines
                  <span className="md:hidden">
                    {" "}
                    · {dateFmt.format(e.createdAt)}
                  </span>
                </span>
              </span>
              <span className="hidden md:block">
                <EstimateStatus status={e.status} />
              </span>
              <span className="figures hidden text-sm text-ink-3 md:block">
                {dateFmt.format(e.createdAt)}
              </span>
              <Money
                cents={totals.totalCents}
                className="text-right text-sm font-medium text-ink"
              />
            </Link>
          </li>
        ))}
      </ListFrame>
    </div>
  );
}
