import Link from "next/link";
import type { listEstimates } from "@/lib/estimate/queries";
import { formatEstimateNo } from "@/lib/pricing";
import { MiniBlade } from "./blade";
import { Money } from "./money";

const dateFmt = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" });

export function EstimateRows({ rows }: { rows: Awaited<ReturnType<typeof listEstimates>> }) {
  // Bars are as long as the money: the biggest estimate in view runs the full width.
  const max = Math.max(...rows.map((r) => r.totals.totalCents));
  return (
    <ul className="mt-6 divide-y divide-hairline border-y border-hairline">
      {rows.map(({ estimate: e, groups, totals, lineCount }) => (
        <li key={e.id}>
          <Link
            href={`/estimates/${e.id}`}
            className="group grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-2 px-1 py-4 transition-colors hover:bg-surface sm:grid-cols-[5.5rem_1fr_auto] sm:px-3"
          >
            <span className="figures order-2 col-span-2 text-sm font-semibold text-ink-3 sm:order-none sm:col-span-1 sm:text-[0.9375rem]">
              {formatEstimateNo(e.number)}
              <span className="sm:hidden">
                {" "}
                · {dateFmt.format(e.createdAt)} · {lineCount} lines
              </span>
            </span>
            <span className="order-1 min-w-0 sm:order-none">
              <span className="block truncate text-[1.0625rem] font-semibold text-ink group-hover:underline">{e.title}</span>
              <span className="mt-0.5 hidden text-sm text-ink-3 sm:block">
                {dateFmt.format(e.createdAt)} · {lineCount} lines · {groups.length} stages
              </span>
            </span>
            <Money cents={totals.totalCents} className="order-1 text-[1.25rem] font-bold sm:order-none" />
            <span className="order-3 col-span-2 sm:col-span-3 sm:col-start-2">
              <MiniBlade segments={groups.map((g) => ({ name: g.name, cents: g.priceCents }))} share={max > 0 ? totals.totalCents / max : 1} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
