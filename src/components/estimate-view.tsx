import { Badge, type BadgeProps } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Link } from "@astryxdesign/core/Link";
import { Text } from "@astryxdesign/core/Text";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Eye, Send, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Breakdown } from "@/components/breakdown";
import { SectionTitle } from "@/components/section-title";
import { EstimateActions } from "@/components/estimate-actions";
import type { SendTarget } from "@/components/send-quote";
import { Money } from "@/components/money";
import { validateEstimate } from "@/lib/estimate/price";
import { PRICE_BOOK, priceBookCheckedLabel } from "@/lib/price-book";
import type { EstimateContext, GroupView, LineView } from "@/lib/estimate/queries";
import { estimateAsText } from "@/lib/estimate/text";
import { formatProjectNo } from "@/lib/project-schema";
import { formatAud, formatEstimateNo, type EstimateTotals } from "@/lib/pricing";
import { formatQty, keepUnits, unitLabel } from "@/lib/units";
import type { schema } from "@/db";
import { LocalTime } from "@/components/local-time";
import { dateFormat } from "@/lib/dates";

type Estimate = typeof schema.estimates.$inferSelect;

const typeLabel: Record<LineView["type"], string> = {
  material: "Materials",
  labour: "Labour",
  subbie: "Subcontractor",
  other: "Other",
};

/** Sent is the one status still waiting on someone, so it is the one in orange; the rest stay grey. */
export const ESTIMATE_STATUS: Record<Estimate["status"], [string, BadgeProps["variant"]]> = {
  draft: ["Draft", "neutral"],
  sent: ["Sent", "orange"],
  accepted: ["Accepted", "neutral"],
  declined: ["Declined", "neutral"],
  invoiced: ["Invoiced", "neutral"],
  archived: ["Archived", "neutral"],
};

export function EstimateStatus({ status }: { status: Estimate["status"] }) {
  const [label, variant] = ESTIMATE_STATUS[status] ?? [status, "neutral"];
  return <Badge variant={variant} label={label} />;
}

const dateFmt = dateFormat({ day: "numeric", month: "long", year: "numeric" });

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
    <article className="mt-3">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
        <div className="min-w-0 xl:flex-1">
          <div className="max-w-3xl">
            <Heading level={1}>{e.title ? keepUnits(e.title) : e.title}</Heading>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <EstimateStatus status={e.status} />
            <Text type="supporting" hasTabularNumbers color="primary">
              {formatEstimateNo(e.number)}
            </Text>
            <Text type="supporting">· {dateFmt.format(e.createdAt)}</Text>
          </div>
          {/* Who, which project and where, as one line of text that wraps where it needs to. */}
          {meta.length > 0 && (
            <div className="mt-1">
              <Text as="p" type="supporting">
                {meta.join(" · ")}
              </Text>
            </div>
          )}
        </div>
        <EstimateActions
          text={text}
          editHref={activity?.decision?.type === "accepted" ? undefined : `/estimates/${e.id}/edit`}
          duplicateId={activity?.decision?.type === "accepted" ? e.id : undefined}
          send={send}
        />
      </header>

      {activity && <ClientActivity activity={activity} />}

      {/* Edited since it was shared: the link already shows the new version, but the client won't know to look. */}
      {activity && !activity.decision && e.currentVersion > activity.sharedVersion && (
        <div className="no-print mt-3">
          <Banner
            status="info"
            title="You've changed this since you shared it"
            description="Your client's link shows the new version, but they won't know to look again. Tap Share again to send it to them."
          />
        </div>
      )}

      <section aria-label="Totals" className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-0">
        <Stat
          className="col-span-2 sm:col-span-1"
          label={totals.gstCents > 0 ? "Total inc GST" : "Total"}
          value={<Money cents={totals.totalCents} />}
          big
          sub={
            totals.gstCents > 0 ? (
              <>
                <Money cents={totals.subtotalCents} quiet={false} /> ex GST ·{" "}
                <Money cents={totals.gstCents} quiet={false} /> GST {gstRatePct}%
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
          value={`${totals.marginPct.toFixed(1)}%`}
          sub={`${lineCount} lines across ${groups.length} ${groups.length === 1 ? "stage" : "stages"}`}
        />
      </section>

      {warnings.length > 0 && (
        <section aria-label="Check before sending" className="mt-6 flex flex-col gap-2">
          {warnings.map((w) => (
            <Banner key={w} status="warning" title={w} />
          ))}
        </section>
      )}

      <section aria-labelledby="money" className="mt-10">
        <SectionTitle id="money">Where the money goes</SectionTitle>
        <Card padding={0}>
          <div className="px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
            <Breakdown
              stages={groups.map((g) => ({
                id: g.id,
                name: g.name,
                cents: g.priceCents,
              }))}
            />
          </div>
        </Card>
      </section>

      {e.summary && (
        <div className="mt-10 max-w-[68ch]">
          <Text as="p" color="secondary">
            {e.summary}
          </Text>
        </div>
      )}

      <section aria-labelledby="schedule" className="mt-10">
        <SectionTitle id="schedule">Schedule</SectionTitle>
        <Schedule groups={groups} />
        <dl className="ml-auto mt-2 max-w-xs">
          <TotalRow label="Price ex GST" cents={totals.subtotalCents} />
          {totals.gstCents > 0 && <TotalRow label={`GST (${gstRatePct}%)`} cents={totals.gstCents} />}
          <div className="flex items-baseline justify-between gap-4 border-t border-(--color-border) py-3">
            <dt>
              <Text weight="medium">Total</Text>
            </dt>
            <dd>
              <Text type="large" weight="semibold">
                <Money cents={totals.totalCents} />
              </Text>
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
          <SectionTitle id="options">Options to offer</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <OptionList title="Upgrades" icon="up" items={upgrades} />
            <OptionList title="Ways to save" icon="down" items={savings} />
          </div>
        </section>
      )}
    </article>
  );
}

/**
 * A figure in a column: small grey label, the number, a grey line under it. From 640px the columns are split by
 * hairlines; on a phone the total takes the full width and the other two share a row under it.
 */
function Stat({
  label,
  value,
  sub,
  big = false,
  className = "",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  big?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 border-(--color-border) sm:border-l sm:px-6 sm:first:border-l-0 sm:first:pl-0 ${className}`}
    >
      <Text as="p" type="supporting" weight="medium">
        {label}
      </Text>
      <div className="mt-1.5">
        <Text
          as="p"
          type={big ? "display-3" : "large"}
          size={big ? undefined : "2xl"}
          weight="semibold"
          hasTabularNumbers
        >
          {value}
        </Text>
      </div>
      {sub && (
        <div className="mt-2">
          <Text as="p" type="supporting">
            {sub}
          </Text>
        </div>
      )}
    </div>
  );
}

export type Activity = {
  token: string;
  sentAt: Date;
  /** The estimate version last shared with the client. */
  sharedVersion: number;
  views: number;
  lastViewedAt: Date | null;
  decision: {
    type: "accepted" | "declined";
    name: string | null;
    reason: string | null;
    totalCents: number | null;
    at: Date;
  } | null;
};

/** What the client has done with the quote: sent, opened, accepted or declined. */
function ClientActivity({ activity: a }: { activity: Activity }) {
  const d = a.decision;
  // Lucide icons drawn here rather than through Astryx's Icon: this part renders on the server, and a component
  // can't be handed to a client component from there.
  const Glyph = d?.type === "accepted" ? CheckCircle2 : d?.type === "declined" ? XCircle : a.views ? Eye : Send;
  return (
    <section aria-label="Client activity" className="no-print mt-6">
      <Card variant={d?.type === "accepted" ? "green" : "muted"} padding={3}>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div className="flex min-w-0 flex-1 basis-64 items-start gap-2.5">
            <Glyph
              aria-hidden
              className={`mt-0.5 size-5 shrink-0 ${d?.type === "accepted" ? "text-(--color-icon-success)" : "text-(--color-icon-secondary)"}`}
            />
            <div className="min-w-0">
              <Text as="p" weight="medium">
                {d?.type === "accepted" ? (
                  <>
                    Accepted by {d.name} · <LocalTime date={d.at} />
                  </>
                ) : d?.type === "declined" ? (
                  <>
                    Declined · <LocalTime date={d.at} />
                  </>
                ) : a.views ? (
                  <>
                    Opened {a.views === 1 ? "once" : `${a.views} times`}, last <LocalTime date={a.lastViewedAt!} />
                  </>
                ) : (
                  "Sent, not opened yet"
                )}
              </Text>
              <div className="mt-0.5">
                <Text as="p" type="supporting">
                  {d?.type === "accepted" ? (
                    `${d.totalCents !== null ? `Accepted at ${formatAud(d.totalCents)} inc GST. ` : ""}Accepted quotes are locked. To price any changes, duplicate it as a new estimate.`
                  ) : d?.type === "declined" ? (
                    d.reason ? (
                      `“${d.reason}”`
                    ) : (
                      "No reason given."
                    )
                  ) : (
                    <>
                      Shared <LocalTime date={a.sentAt} />. You&apos;ll see here when they open, accept or decline it.
                    </>
                  )}
                </Text>
              </div>
            </div>
          </div>
          <span className="pl-7 sm:pl-0">
            <Link href={`/p/${a.token}`} isExternalLink color="primary" hasUnderline>
              Client view
            </Link>
          </span>
        </div>
      </Card>
    </section>
  );
}

function TotalRow({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt>
        <Text color="secondary">{label}</Text>
      </dt>
      <dd>
        <Text>
          <Money cents={cents} />
        </Text>
      </dd>
    </div>
  );
}

/**
 * Where a price came from. The tradie's own figures sit quietly on a solid chip; an AI guess is the one with a
 * dashed edge and darker text, because it's the one to check. Tapping a chip on a phone shows what it means.
 */
export function SourceBadge({ source }: { source: LineView["source"] }) {
  if (source === "ai")
    return (
      <Tooltip
        content="The AI estimated this price: nothing in your rates or the price book matched"
        hasHoverIndication={false}
      >
        <span
          tabIndex={0}
          className="inline-flex h-5 items-center whitespace-nowrap rounded-full border border-dashed border-(--color-border-emphasized) px-2 text-xs font-medium text-(--color-text-primary)"
        >
          Check price
        </span>
      </Tooltip>
    );
  const label = {
    rate_rule: "Your rate",
    kit: "Kit",
    supplier: "Supplier",
    manual: "Manual",
    price_book: "Price book",
  }[source];
  const chip = (
    <span className="inline-flex h-5 items-center whitespace-nowrap rounded-full bg-(--color-neutral) px-2 text-xs font-medium text-(--color-text-secondary)">
      {label}
    </span>
  );
  if (source !== "price_book") return chip;
  return (
    <Tooltip
      content={`Typical price, ${PRICE_BOOK.region}, checked ${priceBookCheckedLabel()}`}
      hasHoverIndication={false}
    >
      <span tabIndex={0} className="inline-flex">
        {chip}
      </span>
    </Tooltip>
  );
}

/**
 * The rate the client pays (your cost plus this line's markup), so quantity × rate = amount on the page. Showing
 * the cost here made "2 hrs at $75" read as $180. Your cost is in the tooltip, the summary and the editor.
 */
function Rate({ l }: { l: LineView }) {
  const rate = l.qty > 0 ? Math.round(l.priceCents / l.qty) : l.unitCostCents;
  return (
    <Tooltip content={`Your cost ${formatAud(l.unitCostCents)} + ${l.markupPct}% markup`} hasHoverIndication={false}>
      <span>{formatAud(rate)}</span>
    </Tooltip>
  );
}

const cols = "sm:grid-cols-[minmax(0,1fr)_6.5rem_7rem_5.5rem_7rem]";

/**
 * One schedule for every width: from 640px (and on paper) the line's parts sit in columns under a header; on
 * phones they fold into a description, a qty × rate line, and the amount on the right.
 */
function Schedule({ groups }: { groups: GroupView[] }) {
  return (
    <div className="text-(length:--text-body-size) text-(--color-text-primary) sm:text-sm">
      <div
        aria-hidden
        className={`hidden h-10 items-center gap-x-4 border-b border-(--color-border) font-medium text-(--color-text-secondary) sm:grid ${cols}`}
      >
        <span>Description</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Rate</span>
        <span>Source</span>
        <span className="text-right">Amount</span>
      </div>
      {groups.map((g, gi) => (
        <section key={g.id} id={`g-${g.id}`} aria-labelledby={`gh-${g.id}`} className="scroll-mt-24 pt-6">
          <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-(--color-border) pb-2.5">
            <h3 id={`gh-${g.id}`} className="font-semibold">
              <span className="mr-2.5 tabular-nums text-(--color-text-secondary)">{gi + 1}</span>
              {g.name}
            </h3>
            <Money cents={g.priceCents} className="font-semibold" />
          </div>
          <ul className="divide-y divide-dashed divide-(--color-border)">
            {g.lines.map((l) => (
              <li key={l.id} className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 py-3 ${cols}`}>
                <div className="min-w-0">
                  <p className="break-words leading-snug">{keepUnits(l.description)}</p>
                  <p className="mt-0.5 hidden text-xs text-(--color-text-secondary) sm:block">{typeLabel[l.type]}</p>
                  {l.notes && (
                    <p className="mt-1 max-w-[62ch] text-sm text-(--color-text-secondary) sm:text-xs">{l.notes}</p>
                  )}
                </div>
                <div className="col-start-1 row-start-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm tabular-nums text-(--color-text-secondary) sm:contents">
                  <span className="whitespace-nowrap sm:text-right sm:text-(--color-text-primary)">
                    <span className="sr-only">Quantity </span>
                    {formatQty(l.qty)} <span className="text-(--color-text-secondary)">{unitLabel(l.unit, l.qty)}</span>
                  </span>
                  <span aria-hidden className="sm:hidden">
                    ×
                  </span>
                  <span className="whitespace-nowrap sm:text-right sm:text-(--color-text-primary)">
                    <span className="sr-only">at </span>
                    <Rate l={l} />
                  </span>
                  <span className="ml-1.5 sm:ml-0">
                    <SourceBadge source={l.source} />
                  </span>
                </div>
                <Money
                  cents={l.priceCents}
                  className="col-start-2 row-start-1 text-right sm:col-start-auto sm:row-start-auto"
                />
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
      <Heading level={4} accessibilityLevel={3} color="secondary">
        {title}
      </Heading>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2.5">
            <span aria-hidden className="mt-[0.6em] size-1 shrink-0 rounded-full bg-(--color-text-secondary)" />
            <Text>{it}</Text>
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
  return (
    <Card padding={0}>
      <div className="flex items-center gap-2 px-4 pt-4 sm:px-5">
        {icon === "up" ? (
          <ArrowUpRight aria-hidden className="size-4 text-(--color-icon-secondary)" />
        ) : (
          <ArrowDownRight aria-hidden className="size-4 text-(--color-icon-secondary)" />
        )}
        <Heading level={4} accessibilityLevel={3} color="secondary">
          {title}
        </Heading>
      </div>
      <ul className="divide-y divide-dashed divide-(--color-border) px-4 sm:px-5">
        {items.map((a) => (
          <li key={a.title} className="py-4">
            <Text as="p" weight="medium">
              {a.title}
            </Text>
            <div className="mt-0.5">
              <Text as="p" type="supporting">
                {a.detail}
              </Text>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
