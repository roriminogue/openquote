import { formatAud, formatEstimateNo, type EstimateTotals } from "@/lib/pricing";
import { formatQtyUnit } from "@/lib/units";
import type { GroupView } from "./queries";

/** The estimate as plain text, for pasting into a message or email. Prices are what the client pays. */
export function estimateAsText({
  number,
  title,
  meta,
  summary,
  groups,
  totals,
  gstRatePct,
  scope,
  exclusions,
}: {
  number: number;
  title: string;
  meta: string[];
  summary?: string | null;
  groups: GroupView[];
  totals: EstimateTotals;
  gstRatePct: number;
  scope?: string[] | null;
  exclusions?: string[] | null;
}) {
  const out: string[] = [`${title} (${formatEstimateNo(number)})`];
  if (meta.length) out.push(meta.join(" · "));
  if (summary) out.push("", summary);
  groups.forEach((g, i) => {
    out.push("", `${i + 1}. ${g.name}: ${formatAud(g.priceCents)}`);
    for (const l of g.lines) out.push(`   - ${l.description} (${formatQtyUnit(l.qty, l.unit)}): ${formatAud(l.priceCents)}`);
  });
  out.push("", `Price ex GST: ${formatAud(totals.subtotalCents)}`);
  if (totals.gstCents > 0) out.push(`GST (${gstRatePct}%): ${formatAud(totals.gstCents)}`);
  out.push(`Total${totals.gstCents > 0 ? " inc GST" : ""}: ${formatAud(totals.totalCents)}`);
  if (scope?.length) out.push("", "Scope of work:", ...scope.map((s) => `- ${s}`));
  if (exclusions?.length) out.push("", "Not included:", ...exclusions.map((s) => `- ${s}`));
  return out.join("\n");
}
