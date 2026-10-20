import { ArrowDownRight, ArrowUpRight, TriangleAlert } from "lucide-react";
import { Blade } from "@/components/blade";
import { Money } from "@/components/money";
import { Rule } from "@/components/ui";
import { StickyReading } from "@/components/sticky-reading";
import { validateEstimate } from "@/lib/estimate/price";
import type { EstimateContext, GroupView, LineView } from "@/lib/estimate/queries";
import { formatProjectNo } from "@/lib/project-schema";
import { formatAud, formatEstimateNo, type EstimateTotals } from "@/lib/pricing";
import type { schema } from "@/db";

const typeLabel: Record<LineView["type"], string> = {
  material: "Materials",
  labour: "Labour",
  subbie: "Subbie",
  other: "Other",
};

const dateFmt = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" });

/** The estimate as the tradie checks it: the tape, the stages and lines, totals, scope and options. */
export function EstimateView({
  estimate: e,
  gstRatePct,
  groups,
  totals,
  context,
}: {
  context?: EstimateContext;
  estimate: typeof schema.estimates.$inferSelect;
  gstRatePct: number;
  groups: GroupView[];
  totals: EstimateTotals;
}) {
  const warnings = validateEstimate(e.description, groups);
  const markupCents = totals.subtotalCents - totals.costCents;
  const upgrades = (e.alternatives ?? []).filter((a) => a.kind === "upgrade");
  const savings = (e.alternatives ?? []).filter((a) => a.kind === "saving");

  return (
    <article className="mt-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="max-w-3xl text-[1.75rem] font-bold leading-tight tracking-[-0.01em] sm:text-[2.125rem]">{e.title}</h1>
        <p className="figures text-[0.9375rem] font-semibold text-ink-3">
          {formatEstimateNo(e.number)} · {dateFmt.format(e.createdAt)} · Draft
        </p>
      </header>
      {(context?.clientName || context?.projectName || e.siteAddress) && (
        <p className="mt-1.5 text-[1.0625rem] text-ink-2">
          {[
            context?.clientName,
            context?.projectName && `${context.projectName} (${formatProjectNo(context.projectNumber!)})`,
            e.siteAddress,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      <StickyReading
        watch="reading"
        until="totals-block"
        title={e.title}
        cents={totals.totalCents}
        label={totals.gstCents > 0 ? "Total inc GST" : "Total"}
      />
      <div className="mt-6" id="reading">
        <Blade
          segments={groups.map((g) => ({ name: g.name, cents: g.priceCents }))}
          totalCents={totals.totalCents}
          caption={totals.gstCents > 0 ? "Total inc GST" : "Total"}
        />
      </div>

      {warnings.length > 0 && (
        <ul className="mt-6 space-y-2" aria-label="Check before sending">
          {warnings.map((w) => (
            <li key={w} className="flex items-start gap-2.5 rounded-tape bg-mark-wash px-3.5 py-2.5 text-mark">
              <TriangleAlert className="mt-0.5 size-[1.125rem] shrink-0" aria-hidden />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}

      {e.summary && <p className="mt-8 max-w-[68ch] text-[1.0625rem] leading-relaxed text-ink-2">{e.summary}</p>}

      <section aria-labelledby="stages" className="mt-8">
        <h2 id="stages" className="sr-only">
          Stages and line items
        </h2>
        <div className="space-y-6">
          {groups.map((g, gi) => (
            <section key={g.id} aria-labelledby={`g-${g.id}`}>
              <Rule />
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <h3 id={`g-${g.id}`} className="text-[1.25rem] font-bold leading-snug">
                  <span className="figures mr-2 text-ink-3">{gi + 1}</span>
                  {g.name}
                </h3>
                <Money cents={g.priceCents} className="text-[1.25rem] font-bold" />
              </div>
              <ul className="mt-1 divide-y divide-hairline">
                {g.lines.map((l) => (
                  <li key={l.id} className="grid grid-cols-[1fr_auto] gap-x-4 py-2">
                    <div className="min-w-0">
                      <p className="break-words text-[1.0625rem] leading-snug text-ink">{l.description}</p>
                      <p className="figures mt-0.5 text-[0.9375rem] text-ink-3">
                        {formatQty(l.qty)} {l.unit} × {formatAud(l.unitCostCents)}
                        <span aria-hidden> · </span>
                        {typeLabel[l.type]}
                        <span aria-hidden> · </span>
                        {l.source === "rate_rule" ? (
                          <span className="font-semibold text-ink-2">Your rate</span>
                        ) : (
                          "AI price"
                        )}
                        <span aria-hidden> · </span>+{l.markupPct}%
                      </p>
                      {l.notes && <p className="mt-1 max-w-[68ch] text-[0.9375rem] text-ink-3">{l.notes}</p>}
                    </div>
                    <Money cents={l.priceCents} className="text-[1.0625rem] font-semibold" />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <section aria-labelledby="totals" className="mt-8" id="totals-block">
        <Rule />
        <div className="ml-auto max-w-md">
        <h2 id="totals" className="mt-4 text-[1.25rem] font-bold">
          Totals
        </h2>
        <dl className="mt-2 divide-y divide-hairline text-[1.0625rem]">
          <Row label="Cost" cents={totals.costCents} />
          <Row label={`Markup (${totals.costCents ? Math.round((markupCents / totals.costCents) * 100) : 0}%)`} cents={markupCents} />
          <Row label="Price ex GST" cents={totals.subtotalCents} />
          {totals.gstCents > 0 && <Row label={`GST (${gstRatePct}%)`} cents={totals.gstCents} />}
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="font-bold">Total</dt>
            <dd>
              <Money cents={totals.totalCents} className="text-[1.5rem] font-bold" />
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2.5 text-ink-3">
            <dt>Margin</dt>
            <dd className="figures font-semibold">{totals.marginPct.toFixed(1)}%</dd>
          </div>
        </dl>
        </div>
      </section>

      {(e.scope?.length || e.assumptions?.length || e.exclusions?.length) && (
        <section aria-label="Scope" className="mt-10">
          <Rule />
          <div className="mt-5 grid gap-8 sm:grid-cols-3">
            <TextList title="Scope of work" items={e.scope} />
            <TextList title="Assumptions" items={e.assumptions} />
            <TextList title="Not included" items={e.exclusions} />
          </div>
        </section>
      )}

      {(upgrades.length > 0 || savings.length > 0) && (
        <section aria-labelledby="options" className="mt-10">
          <Rule />
          <h2 id="options" className="mt-5 text-[1.25rem] font-bold">
            Options to offer
          </h2>
          <div className="mt-4 grid gap-8 sm:grid-cols-2">
            <OptionList title="Upgrades" icon="up" items={upgrades} />
            <OptionList title="Ways to save" icon="down" items={savings} />
          </div>
        </section>
      )}
          </article>
  );
}

function formatQty(qty: number) {
  return Number.isInteger(qty) ? String(qty) : qty.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function Row({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-ink-2">{label}</dt>
      <dd>
        <Money cents={cents} className="font-semibold" />
      </dd>
    </div>
  );
}

function TextList({ title, items }: { title: string; items: string[] | null }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="font-bold">{title}</h3>
      <ul className="mt-2 space-y-1.5 text-ink-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2.5">
            <span aria-hidden className="mt-[0.7em] h-px w-2.5 shrink-0 bg-ink-3" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OptionList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: "up" | "down";
  items: { title: string; detail: string }[];
}) {
  if (!items.length) return null;
  const Icon = icon === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <div>
      <h3 className="flex items-center gap-1.5 font-bold">
        <Icon className="size-[1.125rem]" aria-hidden />
        {title}
      </h3>
      <ul className="mt-2 divide-y divide-hairline">
        {items.map((a) => (
          <li key={a.title} className="py-3">
            <p className="font-semibold text-ink">{a.title}</p>
            <p className="mt-0.5 text-ink-2">{a.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

