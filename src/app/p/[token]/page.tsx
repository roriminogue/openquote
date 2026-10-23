import { eq } from "drizzle-orm";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { db, schema } from "@/db";
import { Money } from "@/components/money";
import { getAuthUser } from "@/lib/auth";
import { DEFAULT_TERMS, formatAbn } from "@/lib/business-schema";
import { formatEstimateNo } from "@/lib/pricing";
import { getPublicProposal, recordView } from "@/lib/proposals";
import { formatQty, unitLabel } from "@/lib/units";
import { Decision, PrintButton } from "./decision";

// The client-facing quote: no app chrome, a printable document with the business's branding, and one clear
// way to say yes. Reached only through its unguessable link.

export const metadata: Metadata = { title: "Quote", robots: { index: false, follow: false } };

const dateFmt = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" });

export default function QuotePage({ params }: PageProps<"/p/[token]">) {
  return (
    <div className="flex-1 bg-subtle print:bg-white">
      <Suspense fallback={<div className="mx-auto mt-10 h-96 max-w-3xl animate-pulse rounded-[14px] bg-hover" aria-busy="true" />}>
        <Quote params={params} />
      </Suspense>
    </div>
  );
}

async function Quote({ params }: Pick<PageProps<"/p/[token]">, "params">) {
  const { token } = await params;
  const q = await getPublicProposal(token);
  if (!q) notFound();
  const { estimate: e, org, client, groups, totals, display, decision, send, validUntil: until, expired } = q;

  // Don't count the business's own previews as client views.
  const user = await getAuthUser();
  const [viewer] = user ? await db.select({ orgId: schema.users.orgId }).from(schema.users).where(eq(schema.users.id, user.id)) : [];
  if (viewer?.orgId !== org.id) await recordView(send.id);

  const gst = totals.gstCents > 0;
  const upgrades = (e.alternatives ?? []).filter((a) => a.kind === "upgrade");
  const savings = (e.alternatives ?? []).filter((a) => a.kind === "saving");

  return (
    <main className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-6 sm:py-12 print:max-w-none print:p-0">
      <div className="no-print mb-3 flex justify-end">
        <PrintButton />
      </div>

      <article className="rounded-[14px] bg-surface px-5 py-6 shadow-raised sm:px-10 sm:py-10 print:rounded-none print:px-0 print:py-0 print:shadow-none">
        {/* Business header */}
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
          <div className="min-w-0">
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- business logo from Supabase Storage
              <img src={org.logoUrl} alt={org.name} className="mb-3 max-h-16 max-w-48 object-contain" />
            ) : null}
            <p className="font-display text-xl font-semibold leading-tight">{org.name}</p>
            <div className="mt-1 space-y-0.5 text-sm text-ink-3">
              {org.abn && <p className="figures">ABN {formatAbn(org.abn)}</p>}
              {org.address && <p>{org.address}</p>}
              {(org.phone || org.email) && (
                <p>
                  {org.phone && (
                    <a href={`tel:${org.phone.replace(/[^\d+]/g, "")}`} className="figures hover:underline">
                      {org.phone}
                    </a>
                  )}
                  {org.phone && org.email && " · "}
                  {org.email && (
                    <a href={`mailto:${org.email}`} className="hover:underline">
                      {org.email}
                    </a>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Quote</p>
            <p className="figures font-display text-xl font-semibold">{formatEstimateNo(e.number)}</p>
          </div>
        </header>

        {/* Who and when */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-border py-6 text-sm sm:grid-cols-4">
          <Meta label="Prepared for">{client?.name ?? "—"}</Meta>
          <Meta label="Site">{e.siteAddress ?? "—"}</Meta>
          <Meta label="Date">{dateFmt.format(send.sentAt)}</Meta>
          <Meta label="Valid until">{dateFmt.format(until)}</Meta>
        </dl>

        <section className="py-6">
          <h1 className="font-display text-title font-medium leading-8">{e.title}</h1>
          {e.summary && <p className="mt-3 max-w-[68ch] text-[0.9375rem] leading-relaxed text-ink-2">{e.summary}</p>}
        </section>

        {/* The work */}
        <section aria-labelledby="work" className="border-t border-border py-6">
          <h2 id="work" className="text-sm font-medium text-ink-3">
            The work
          </h2>
          {display.detail === "full" && <p className="mt-1 text-xs text-ink-3">Prices exclude GST; GST is added to the total.</p>}
          <ol className="mt-4 space-y-5">
            {groups.map((g, gi) => (
              <li key={g.id} className="break-inside-avoid">
                <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-border pb-2">
                  <h3 className="text-[0.9375rem] font-semibold">
                    <span className="figures mr-2 text-ink-4">{gi + 1}</span>
                    {g.name}
                  </h3>
                  {display.showGroupTotals && <Money cents={g.priceCents} className="text-[0.9375rem] font-semibold" />}
                </div>
                {display.detail !== "total" && (
                  <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
                    {g.lines.map((l) => (
                      <li key={l.id} className="flex items-baseline justify-between gap-4">
                        <span className="flex gap-2.5">
                          <span aria-hidden className="mt-[0.55em] size-1 shrink-0 rounded-full bg-ink-4" />
                          <span>
                            {l.description}
                            {display.showQuantities && (
                              <span className="figures text-ink-3">
                                {" "}
                                · {formatQty(l.qty)} {unitLabel(l.unit, l.qty)}
                              </span>
                            )}
                          </span>
                        </span>
                        {display.showItemPrices && <Money cents={l.priceCents} className="shrink-0 text-ink" />}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>

          {/* Totals */}
          <dl className="ml-auto mt-8 max-w-xs text-sm">
            {gst && (
              <>
                <TotalRow label="Subtotal (ex GST)" cents={totals.subtotalCents} />
                <TotalRow label="GST" cents={totals.gstCents} />
              </>
            )}
            <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border-strong pt-3">
              <dt className="font-semibold">{gst ? "Total (inc GST)" : "Total"}</dt>
              <dd>
                <Money cents={totals.totalCents} className="font-display text-2xl font-semibold" />
              </dd>
            </div>
          </dl>
        </section>

        {/* Scope */}
        {(e.scope?.length || e.assumptions?.length || e.exclusions?.length) && (
          <section aria-label="Scope" className="grid gap-6 border-t border-border py-6 sm:grid-cols-3">
            <List title="Included" items={e.scope} />
            <List title="Assumptions" items={e.assumptions} />
            <List title="Not included" items={e.exclusions} />
          </section>
        )}

        {(upgrades.length > 0 || savings.length > 0) && (
          <section aria-labelledby="options" className="border-t border-border py-6">
            <h2 id="options" className="text-sm font-medium text-ink-3">
              Options you can ask about
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {[...upgrades, ...savings].map((a) => (
                <li key={a.title} className="rounded-[10px] bg-subtle px-4 py-3 text-sm">
                  <p className="font-medium text-ink">{a.title}</p>
                  <p className="mt-0.5 text-ink-3">{a.detail}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="terms" className="border-t border-border py-6">
          <h2 id="terms" className="text-sm font-medium text-ink-3">
            Terms
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-2">{org.termsMd || DEFAULT_TERMS}</p>
          <p className="mt-2 text-sm text-ink-2">This quote is valid until {dateFmt.format(until)}.</p>
        </section>

        {/* The answer */}
        <section aria-labelledby="answer" className="no-print rounded-[14px] bg-subtle px-4 py-5 sm:px-6 sm:py-6">
          {decision?.type === "accepted" ? (
            <Answered icon={<CheckCircle2 className="size-5 text-ok" aria-hidden />} title={`Accepted by ${decision.name} on ${dateFmt.format(decision.at)}`}>
              Thanks. {org.name} can see you’ve accepted and will be in touch to book the work.
            </Answered>
          ) : decision?.type === "declined" ? (
            <Answered icon={<XCircle className="size-5 text-ink-3" aria-hidden />} title={`Declined on ${dateFmt.format(decision.at)}`}>
              Thanks for letting {org.name} know. Get in touch if anything changes.
            </Answered>
          ) : expired ? (
            <Answered icon={<XCircle className="size-5 text-ink-3" aria-hidden />} title={`This quote expired on ${dateFmt.format(until)}`}>
              Contact {org.name} for an updated price.
            </Answered>
          ) : (
            <>
              <h2 id="answer" className="font-display text-lg font-semibold">
                Happy to go ahead?
              </h2>
              <p className="mb-4 mt-1 text-sm text-ink-3">Accept below and {org.name} will be in touch to book the work.</p>
              <Decision token={token} business={org.name} prefillName={client?.kind === "individual" ? client.name : (client?.contactName ?? "")} prefillEmail={client?.email ?? ""} />
            </>
          )}
        </section>
        {decision?.type === "accepted" && (
          <p className="hidden pt-6 text-sm print:block">
            Accepted by {decision.name} on {dateFmt.format(decision.at)}.
          </p>
        )}
      </article>
      <p className="no-print mt-6 text-center text-xs text-ink-3">Sent with OpenQuote</p>
    </main>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-ink">{children}</dd>
    </div>
  );
}

function TotalRow({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <dt className="text-ink-3">{label}</dt>
      <dd>
        <Money cents={cents} className="text-ink-2" />
      </dd>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] | null }) {
  if (!items?.length) return null;
  return (
    <div>
      <h2 className="text-sm font-medium text-ink-3">{title}</h2>
      <ul className="mt-2 space-y-1.5 text-sm text-ink">
        {items.map((it) => (
          <li key={it} className="flex gap-2.5">
            <span aria-hidden className="mt-[0.55em] size-1 shrink-0 rounded-full bg-ink-4" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Answered({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-ink-3">{children}</p>
      </div>
    </div>
  );
}
