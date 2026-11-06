import { ArrowDownRight, ArrowUpRight, CheckCircle2, Eye, Send, TriangleAlert, XCircle } from "lucide-react";
import { Breakdown } from "@/components/breakdown";
import { EstimateActions } from "@/components/estimate-actions";
import type { SendTarget } from "@/components/send-quote";
import { Money } from "@/components/money";
import { Badge, GroupTitle, Panel, type Tone } from "@/components/ui";
import { validateEstimate } from "@/lib/estimate/price";
import { PRICE_BOOK, priceBookCheckedLabel } from "@/lib/price-book";
import type { EstimateContext, GroupView, LineView } from "@/lib/estimate/queries";
import { estimateAsText } from "@/lib/estimate/text";
import { formatProjectNo } from "@/lib/project-schema";
import { formatAud, formatEstimateNo, type EstimateTotals } from "@/lib/pricing";
import { formatQty, unitLabel } from "@/lib/units";
import type { schema } from "@/db";

type Estimate = typeof schema.estimates.$inferSelect;

const typeLabel: Record<LineView["type"], string> = {
  material: "Materials",
  labour: "Labour",
  subbie: "Subcontractor",
  other: "Other",
};

export const ESTIMATE_STATUS: Record<Estimate["status"], [string, Tone]> = {
  draft: ["Draft", "neutral"],
  sent: ["Sent", "accent"],
  accepted: ["Accepted", "neutral"],
  declined: ["Declined", "muted"],
  invoiced: ["Invoiced", "neutral"],
  archived: ["Archived", "muted"],
};

export function EstimateStatus({ status }: { status: Estimate["status"] }) {
  const [label, tone] = ESTIMATE_STATUS[status] ?? [status, "neutral"];
  return <Badge tone={tone}>{label}</Badge>;
}

const dateFmt = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" });

/** The estimate as the tradie checks it: the number up top, where it goes, then the schedule line by line. */
export function EstimateView({
  estimate: e,
  gstRatePct,
  groups,
  totals,
  context,
  send,
  activity,
}: {
  context?: EstimateContext;
  estimate: Estimate;
  gstRatePct: number;
  groups: GroupView[];
  totals: EstimateTotals;
  send?: SendTarget;
  activity?: Activity | null;
}) {
  const warnings = validateEstimate(e.description, groups);
  const markupCents = totals.subtotalCents - totals.costCents;
  const upgrades = (e.alternatives ?? []).filter((a) => a.kind === "upgrade");
  const savings = (e.alternatives ?? []).filter((a) => a.kind === "saving");
  const meta = [
    context?.clientName,
    context?.projectName && `${context.projectName} · ${formatProjectNo(context.projectNumber!)}`,
    e.siteAddress,
  ].filter((x): x is string => !!x);
  const text = estimateAsText({
    number: e.number,
    title: e.title,
    meta,
    summary: e.summary,
    groups,
    totals,
    gstRatePct,
    scope: e.scope,
    exclusions: e.exclusions,
  });

  const lineCount = groups.reduce((s, g) => s + g.lines.length, 0);

  return (
    <article className="mt-4">
      <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4 xl:flex-nowrap">
        <div className="min-w-0 basis-full xl:basis-0 xl:flex-1">
          <h1 className="max-w-3xl font-display text-title font-medium leading-8 tracking-[-0.01em]">{e.title}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-ink-3">
            <EstimateStatus status={e.status} />
            <span className="figures text-ink-2">{formatEstimateNo(e.number)}</span>
            {[...meta, dateFmt.format(e.createdAt)].map((m) => (
              <span key={m}>
                <span aria-hidden className="mr-2">·</span>
                {m}
              </span>
            ))}
          </p>
        </div>
        <EstimateActions text={text} editHref={activity?.decision?.type === "accepted" ? undefined : `/estimates/${e.id}/edit`} send={send} />
      </header>

      {activity && <ClientActivity activity={activity} />}

      <section aria-label="Totals" className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-0">
        <Stat
          label={totals.gstCents > 0 ? "Total inc GST" : "Total"}
          value={<Money cents={totals.totalCents} />}
          big
          sub={
            totals.gstCents > 0 ? (
              <>
                <Money cents={totals.subtotalCents} quiet={false} /> ex GST · <Money cents={totals.gstCents} quiet={false} /> GST {gstRatePct}%
              </>
            ) : (
              "No GST on this estimate"
            )
          }
        />
        <Stat
          label="Your cost"
          value={<Money cents={totals.costCents} />}
          sub={
            <>
              <Money cents={markupCents} quiet={false} /> markup on top
            </>
          }
        />
        <Stat
          label="Margin"
          value={<span className="figures">{totals.marginPct.toFixed(1)}%</span>}
          sub={`${lineCount} lines across ${groups.length} ${groups.length === 1 ? "stage" : "stages"}`}
        />
      </section>

      {warnings.length > 0 && (
        <ul className="mt-6 space-y-2" aria-label="Check before sending">
          {warnings.map((w) => (
            <li key={w} className="flex items-start gap-2.5 rounded-[10px] bg-accent-soft px-3.5 py-2.5 text-sm text-accent-ink">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="money" className="mt-10">
        <GroupTitle id="money">Where the money goes</GroupTitle>
        <Panel className="px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
          <Breakdown stages={groups.map((g) => ({ id: g.id, name: g.name, cents: g.priceCents }))} />
        </Panel>
      </section>

      {e.summary && <p className="mt-10 max-w-[68ch] text-sm leading-relaxed text-ink-2">{e.summary}</p>}

      <section aria-labelledby="schedule" className="mt-10">
        <GroupTitle id="schedule">Schedule</GroupTitle>
        <Schedule groups={groups} />
        <dl className="ml-auto mt-2 max-w-xs text-sm">
          <TotalRow label="Price ex GST" cents={totals.subtotalCents} />
          {totals.gstCents > 0 && <TotalRow label={`GST (${gstRatePct}%)`} cents={totals.gstCents} />}
          <div className="flex items-baseline justify-between gap-4 border-t border-border py-3">
            <dt className="font-medium">Total</dt>
            <dd>
              <Money cents={totals.totalCents} className="text-base font-semibold" />
            </dd>
          </div>
        </dl>
      </section>

      {(e.scope?.length || e.assumptions?.length || e.exclusions?.length) && (
        <section aria-label="Scope" className="mt-10 grid gap-8 sm:grid-cols-3">
          <TextList title="Scope of work" items={e.scope} />
          <TextList title="Assumptions" items={e.assumptions} />
          <TextList title="Not included" items={e.exclusions} />
        </section>
      )}

      {(upgrades.length > 0 || savings.length > 0) && (
        <section aria-labelledby="options" className="mt-10">
          <GroupTitle id="options">Options to offer</GroupTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <OptionList title="Upgrades" icon="up" items={upgrades} />
            <OptionList title="Ways to save" icon="down" items={savings} />
          </div>
        </section>
      )}
    </article>
  );
}

/** A figure in a column: small grey label, the number, a grey line under it. Columns split by hairlines. */
function Stat({ label, value, sub, big = false }: { label: string; value: React.ReactNode; sub?: React.ReactNode; big?: boolean }) {
  return (
    <div className="border-border sm:border-l sm:px-6 sm:first:border-l-0 sm:first:pl-0">
      <p className="text-xs font-medium text-ink-3">{label}</p>
      <p className={`mt-1.5 font-semibold leading-none tracking-[-0.01em] text-ink ${big ? "text-figure" : "text-title"}`}>{value}</p>
      {sub && <p className="mt-2 text-xs text-ink-3">{sub}</p>}
    </div>
  );
}

export type Activity = {
  token: string;
  sentAt: Date;
  views: number;
  lastViewedAt: Date | null;
  decision: { type: "accepted" | "declined"; name: string | null; reason: string | null; totalCents: number | null; at: Date } | null;
};

const whenFmt = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** What the client has done with the quote: sent, opened, accepted or declined. */
function ClientActivity({ activity: a }: { activity: Activity }) {
  const d = a.decision;
  return (
    <section
      aria-label="Client activity"
      className={`no-print mt-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-2 rounded-[10px] px-4 py-3 text-sm ${
        d?.type === "accepted" ? "bg-ok-soft" : "bg-subtle"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {d?.type === "accepted" ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
        ) : d?.type === "declined" ? (
          <XCircle className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
        ) : a.views ? (
          <Eye className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
        ) : (
          <Send className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
        )}
        <div>
          <p className="font-medium text-ink">
            {d?.type === "accepted"
              ? `Accepted by ${d.name} · ${whenFmt.format(d.at)}`
              : d?.type === "declined"
                ? `Declined · ${whenFmt.format(d.at)}`
                : a.views
                  ? `Opened ${a.views === 1 ? "once" : `${a.views} times`}, last ${whenFmt.format(a.lastViewedAt!)}`
                  : "Sent, not opened yet"}
          </p>
          <p className="mt-0.5 text-ink-3">
            {d?.type === "accepted"
              ? `${d.totalCents !== null ? `Accepted at ${formatAud(d.totalCents)} inc GST. ` : ""}Accepted quotes are locked. Price any changes as a new estimate.`
              : d?.type === "declined"
                ? d.reason
                  ? `“${d.reason}”`
                  : "No reason given."
                : `Shared ${whenFmt.format(a.sentAt)}. You'll see here when they open, accept or decline it.`}
          </p>
        </div>
      </div>
      <a href={`/p/${a.token}`} target="_blank" rel="noreferrer" className="shrink-0 text-sm font-medium text-ink-2 underline underline-offset-2 hover:text-ink">
        Client view
      </a>
    </section>
  );
}

function TotalRow({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-ink-3">{label}</dt>
      <dd>
        <Money cents={cents} className="text-ink-2" />
      </dd>
    </div>
  );
}

/**
 * Where a price came from. The tradie's own figures sit quietly on a solid chip; an AI guess is the one with a
 * dashed edge and darker text, because it's the one to check.
 */
export function SourceBadge({ source }: { source: LineView["source"] }) {
  if (source === "ai")
    return (
      <span
        title="The AI estimated this price: nothing in your rates or the price book matched"
        className="inline-flex h-5 items-center whitespace-nowrap rounded-full border border-dashed border-ink-3 px-2 text-xs font-medium text-ink"
      >
        Check price
      </span>
    );
  const label = { rate_rule: "Your rate", kit: "Kit", supplier: "Supplier", manual: "Manual", price_book: "Price book" }[source];
  const title =
    source === "price_book" ? `Typical price, ${PRICE_BOOK.region}, checked ${priceBookCheckedLabel()}` : undefined;
  return (
    <span title={title} className="inline-flex h-5 items-center whitespace-nowrap rounded-full bg-subtle px-2 text-xs font-medium text-ink-3">
      {label}
    </span>
  );
}

function Rate({ l }: { l: LineView }) {
  return (
    <>
      {formatAud(l.unitCostCents)}
      {l.markupPct !== l.defaultMarkupPct && <span className="text-ink-3"> +{l.markupPct}%</span>}
    </>
  );
}

const cols = "sm:grid-cols-[minmax(0,1fr)_6.5rem_7rem_5.5rem_7rem]";

/**
 * One schedule for every width: from 640px (and on paper) the line's parts sit in columns under a header; on
 * phones they fold into a description, a qty × rate line, and the amount on the right.
 */
function Schedule({ groups }: { groups: GroupView[] }) {
  return (
    <div className="text-sm">
      <div aria-hidden className={`hidden h-10 items-center gap-x-4 border-b border-border text-sm font-medium text-ink-3 sm:grid ${cols}`}>
        <span>Description</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Rate</span>
        <span>Source</span>
        <span className="text-right">Amount</span>
      </div>
      {groups.map((g, gi) => (
        <section key={g.id} id={`g-${g.id}`} aria-labelledby={`gh-${g.id}`} className="scroll-mt-24 pt-6">
          <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-border pb-2.5">
            <h3 id={`gh-${g.id}`} className="text-sm font-semibold text-ink">
              <span className="figures mr-2.5 text-ink-4">{gi + 1}</span>
              {g.name}
            </h3>
            <Money cents={g.priceCents} className="text-sm font-semibold" />
          </div>
          <ul className="divide-y divide-dashed divide-border">
            {g.lines.map((l) => (
              <li key={l.id} className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 py-3 ${cols}`}>
                <div className="min-w-0">
                  <p className="break-words text-body leading-snug text-ink sm:text-sm">{l.description}</p>
                  <p className="mt-0.5 hidden text-caption text-ink-3 sm:block">{typeLabel[l.type]}</p>
                  {l.notes && <p className="mt-1 max-w-[62ch] text-caption text-ink-3">{l.notes}</p>}
                </div>
                <div className="figures col-start-1 row-start-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-ink-3 sm:contents">
                  <span className="whitespace-nowrap sm:text-right sm:text-ink-2">
                    <span className="sr-only">Quantity </span>
                    {formatQty(l.qty)} <span className="text-ink-3">{unitLabel(l.unit, l.qty)}</span>
                  </span>
                  <span aria-hidden className="sm:hidden">×</span>
                  <span className="whitespace-nowrap sm:text-right sm:text-ink-2">
                    <span className="sr-only">at </span>
                    <Rate l={l} />
                  </span>
                  <span className="ml-1.5 sm:ml-0">
                    <SourceBadge source={l.source} />
                  </span>
                </div>
                <Money cents={l.priceCents} className="col-start-2 row-start-1 text-right text-ink sm:col-start-auto sm:row-start-auto" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TextList({ title, items }: { title: string; items: string[] | null }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="text-sm font-medium text-ink-3">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-ink">
        {items.map((it) => (
          <li key={it} className="flex gap-2.5">
            <span aria-hidden className="mt-[0.6em] size-1 shrink-0 rounded-full bg-ink-4" />
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
    <Panel>
      <h3 className="flex items-center gap-2 px-4 pt-4 text-sm font-medium text-ink-3 sm:px-5">
        <Icon className="size-4" aria-hidden />
        {title}
      </h3>
      <ul className="divide-y divide-dashed divide-border px-4 sm:px-5">
        {items.map((a) => (
          <li key={a.title} className="py-4">
            <p className="text-sm font-medium text-ink">{a.title}</p>
            <p className="mt-0.5 text-sm text-ink-3">{a.detail}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
