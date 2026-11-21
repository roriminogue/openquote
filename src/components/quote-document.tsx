import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { CheckCircle2, XCircle } from "lucide-react";
import { createContext, useContext, type KeyboardEvent, type ReactNode } from "react";
import { Money } from "@/components/money";
import { DEFAULT_TERMS, formatAbn } from "@/lib/business-schema";
import { dateFormat } from "@/lib/dates";
import { formatEstimateNo } from "@/lib/pricing";
import type { getQuoteDocument } from "@/lib/proposals";
import { formatQty, keepUnits, unitLabel } from "@/lib/units";

export type PublicQuote = NonNullable<Awaited<ReturnType<typeof getQuoteDocument>>>;

/** A piece of the quote's wording that can be changed in place. */
export type QuoteField =
  | { kind: "title" }
  | { kind: "summary" }
  | { kind: "site" }
  | { kind: "stage"; group: number }
  | { kind: "line"; group: number; line: number }
  | { kind: "point"; list: "scope" | "assumptions" | "exclusions"; index: number }
  | { kind: "option"; index: number; part: "title" | "detail" }
  | { kind: "terms" };

/** Given while the tradie is changing the quote's words: each field calls it with its new text when they leave it. */
export type QuoteEdit = (field: QuoteField, text: string) => void;

const Editing = createContext<QuoteEdit | null>(null);

/**
 * Text that can be changed in place while editing: tap it and type. Single-line fields finish on Return; Escape
 * puts back what was there. When not editing (and always in the PDF) it is plain text.
 */
function Editable({
  field,
  value,
  shown,
  label,
  placeholder,
  multiline = false,
}: {
  field: QuoteField;
  value: string;
  /** How the text reads when not editing (units kept together and so on). */
  shown?: ReactNode;
  label: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const edit = useContext(Editing);
  if (!edit) return <>{shown ?? value}</>;
  const keyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Escape") {
      e.currentTarget.textContent = value;
      e.currentTarget.blur();
    } else if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };
  return (
    <span
      // Remounted with each saved value, so React and the typed text never disagree.
      key={value}
      role="textbox"
      aria-label={label}
      aria-multiline={multiline || undefined}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck
      data-placeholder={placeholder}
      data-field={fieldId(field)}
      onKeyDown={keyDown}
      onBlur={(e) => {
        const raw = e.currentTarget.innerText.replace(/\u00a0/g, " ");
        const text = (multiline ? raw.replace(/\n{3,}/g, "\n\n") : raw.replace(/\s*\n\s*/g, " ")).trim();
        if (text !== value) edit(field, text);
      }}
      className="quote-editable"
    >
      {value}
    </span>
  );
}

/** A field's address on the page (`data-field`), so a new point can be focused once it's drawn. */
export function fieldId(f: QuoteField) {
  return Object.values(f).join("-");
}

/** "Add a point" and the like: only while editing, and never on paper. */
function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="no-print mt-2 inline-flex h-8 items-center gap-1.5 rounded-(--radius-element) px-2 -ml-2 text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-background-muted) hover:text-(--color-text-primary)"
    >
      <span aria-hidden className="text-base leading-none">
        +
      </span>
      {label}
    </button>
  );
}

const dateFmt = dateFormat({ day: "numeric", month: "long", year: "numeric" });

/** A small grey heading for a part of the quote. */
function PartTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div id={id}>
      <Heading level={4} accessibilityLevel={2} color="secondary">
        {children}
      </Heading>
    </div>
  );
}

/**
 * The quote as the client sees it: no app chrome, a printable document with the business's branding, and one
 * clear way to say yes. On paper (or Save as PDF) the card, the buttons and the answer form drop away.
 */
export function QuoteDocument({ q, edit }: { q: PublicQuote; edit?: QuoteEdit }) {
  return (
    <Editing.Provider value={edit ?? null}>
      <Document q={q} edit={edit} />
    </Editing.Provider>
  );
}

function Document({ q, edit }: { q: PublicQuote; edit?: QuoteEdit }) {
  const { estimate: e, org, client, groups, totals, display, decision, send, validUntil: until, expired } = q;
  const gst = totals.gstCents > 0;
  const upgrades = (e.alternatives ?? []).filter((a) => a.kind === "upgrade");
  const savings = (e.alternatives ?? []).filter((a) => a.kind === "saving");

  return (
    <main className="mx-auto w-full max-w-3xl px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:py-12 print:max-w-none print:p-0">
      <article className="rounded-(--radius-container) border border-(--color-border) bg-(--color-background-card) px-4 py-6 shadow-sm sm:px-10 sm:py-10 print:rounded-none print:border-0 print:px-0 print:py-0 print:shadow-none">
        {/* Business header */}
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-(--color-border) pb-6">
          <div className="min-w-0">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt={org.name} className="mb-3 max-h-16 max-w-48 object-contain" />
            ) : null}
            <Text as="p" display="block" type="large" weight="semibold">
              {org.name}
            </Text>
            <div className="mt-1 flex flex-col gap-0.5">
              {org.abn && (
                <Text as="p" display="block" type="supporting" hasTabularNumbers>
                  ABN {formatAbn(org.abn)}
                </Text>
              )}
              {org.address && (
                <Text as="p" display="block" type="supporting">
                  {org.address}
                </Text>
              )}
              {org.phone && (
                <Text as="p" display="block" type="supporting" hasTabularNumbers>
                  <a href={`tel:${org.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                    {org.phone}
                  </a>
                </Text>
              )}
              {org.email && (
                <span className="break-all">
                  <Text as="p" display="block" type="supporting">
                    <a href={`mailto:${org.email}`} className="hover:underline">
                      {org.email}
                    </a>
                  </Text>
                </span>
              )}
            </div>
          </div>
          <div className="sm:text-right">
            <Text as="p" display="block" type="supporting" weight="medium">
              Quote
            </Text>
            <Text as="p" display="block" type="large" weight="semibold" hasTabularNumbers>
              {formatEstimateNo(e.number)}
            </Text>
          </div>
        </header>

        {/* Who and when */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-(--color-border) py-6 sm:grid-cols-4">
          {/* Left out when there's nothing to say (a quote with no client or site yet). */}
          {client?.name && <Meta label="Prepared for">{client.name}</Meta>}
          {(e.siteAddress || edit) && (
            <Meta label="Site">
              <Editable
                field={{ kind: "site" }}
                value={e.siteAddress ?? ""}
                label="Site address"
                placeholder="Add the site address"
              />
            </Meta>
          )}
          <Meta label="Date">{dateFmt.format(send.sentAt)}</Meta>
          <Meta label="Valid until">{dateFmt.format(until)}</Meta>
        </dl>

        <section className="py-6">
          <Heading level={1}>
            <Editable field={{ kind: "title" }} value={e.title} shown={keepUnits(e.title)} label="Title" />
          </Heading>
          {(e.summary || edit) && (
            <div className="mt-3 max-w-[68ch] whitespace-pre-line">
              <Text as="p" display="block" color="secondary">
                <Editable
                  field={{ kind: "summary" }}
                  value={e.summary ?? ""}
                  label="Summary"
                  placeholder="Add a summary of the job"
                  multiline
                />
              </Text>
            </div>
          )}
        </section>

        {/* The work. In print (the PDF) stages may run onto the next page; a grid or flex column never would, and
            WebKit cuts off whatever doesn't fit, so lists here are plain blocks. */}
        <section aria-labelledby="work" className="border-t border-(--color-border) py-6">
          <PartTitle id="work">The work</PartTitle>
          {display.detail === "full" && (
            <Text as="p" display="block" type="supporting">
              Prices exclude GST; GST is added to the total.
            </Text>
          )}
          <ol className="mt-4 space-y-5">
            {groups.map((g, gi) => (
              <li key={g.id}>
                <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-(--color-border) pb-2">
                  <h3 className="flex min-w-0 gap-2">
                    <Text weight="semibold">
                      <span className="tabular-nums text-(--color-text-secondary)">{gi + 1}</span>
                    </Text>
                    <Text weight="semibold">
                      <Editable field={{ kind: "stage", group: gi }} value={g.name} label={`Stage ${gi + 1} name`} />
                    </Text>
                  </h3>
                  {display.showGroupTotals && (
                    <Text weight="semibold">
                      <Money cents={g.priceCents} />
                    </Text>
                  )}
                </div>
                {display.detail !== "total" && (
                  <ul className="mt-2 space-y-1.5">
                    {g.lines.map((l, li) => (
                      // Top-aligned: both sides' first line is the same height, so the price sits on the
                      // description's first line (baseline alignment went by the bullet and set prices high).
                      <li key={l.id} className="flex items-start justify-between gap-4">
                        <span className="flex gap-2.5">
                          <span
                            aria-hidden
                            className="mt-[0.6em] size-1 shrink-0 rounded-full bg-(--color-text-secondary)"
                          />
                          <Text>
                            <Editable
                              field={{ kind: "line", group: gi, line: li }}
                              value={l.description}
                              shown={keepUnits(l.description)}
                              label={`Stage ${gi + 1}, line ${li + 1}`}
                            />
                            {display.showQuantities && (
                              <Text type="inherit" color="secondary" hasTabularNumbers>
                                {" "}
                                · {formatQty(l.qty)} {unitLabel(l.unit, l.qty)}
                              </Text>
                            )}
                          </Text>
                        </span>
                        {display.showItemPrices && (
                          <span className="shrink-0">
                            <Text>
                              <Money cents={l.priceCents} />
                            </Text>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>

          {/* Totals */}
          <dl data-pdf-keep className="ml-auto mt-8 max-w-xs">
            {gst && (
              <>
                <TotalRow label="Subtotal (ex GST)" cents={totals.subtotalCents} />
                <TotalRow label="GST" cents={totals.gstCents} />
              </>
            )}
            <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-(--color-border-emphasized) pt-3">
              <dt>
                <Text weight="semibold">{gst ? "Total (inc GST)" : "Total"}</Text>
              </dt>
              <dd>
                <Text type="display-3" weight="semibold" hasTabularNumbers>
                  <Money cents={totals.totalCents} />
                </Text>
              </dd>
            </div>
          </dl>
        </section>

        {/* Scope */}
        {(e.scope?.length || e.assumptions?.length || e.exclusions?.length || edit) && (
          <section data-pdf-keep aria-label="Scope" className="grid gap-6 border-t border-(--color-border) py-6 sm:grid-cols-3 print:block print:space-y-6">
            <Points title="Included" list="scope" items={e.scope} />
            <Points title="Assumptions" list="assumptions" items={e.assumptions} />
            <Points title="Not included" list="exclusions" items={e.exclusions} />
          </section>
        )}

        {(upgrades.length > 0 || savings.length > 0) && (
          <section aria-labelledby="options" className="border-t border-(--color-border) py-6">
            <PartTitle id="options">Options you can ask about</PartTitle>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 print:block print:space-y-3">
              {[...upgrades, ...savings].map((a, i) => {
                const index = (e.alternatives ?? []).indexOf(a);
                return (
                  <li
                    key={edit ? i : a.title}
                    className="rounded-(--radius-element) bg-(--color-background-muted) px-4 py-3"
                  >
                    <Text as="p" display="block" weight="medium">
                      <Editable field={{ kind: "option", index, part: "title" }} value={a.title} label="Option" />
                    </Text>
                    <Text as="p" display="block" type="supporting">
                      <Editable
                        field={{ kind: "option", index, part: "detail" }}
                        value={a.detail}
                        label={`${a.title}: detail`}
                        placeholder="Add a detail"
                      />
                    </Text>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section aria-labelledby="terms" className="border-t border-(--color-border) py-6">
          <PartTitle id="terms">Terms</PartTitle>
          <div className="mt-2 whitespace-pre-line">
            <Text as="p" display="block" color="secondary">
              <Editable field={{ kind: "terms" }} value={org.termsMd || DEFAULT_TERMS} label="Terms" multiline />
            </Text>
          </div>
          {edit && (
            <div className="no-print mt-2">
              <Text as="p" display="block" type="supporting">
                These are your terms for every quote.
              </Text>
            </div>
          )}
          <div className="mt-2">
            <Text as="p" display="block" color="secondary">
              This quote is valid until {dateFmt.format(until)}.
            </Text>
          </div>
        </section>

        {/* The answer */}
        <section
          data-pdf-keep
          aria-labelledby="answer"
          // In the PDF the client sees how to say yes; once answered, it's only shown on screen.
          className={`${decision ? "no-print " : ""}rounded-(--radius-container) bg-(--color-background-muted) px-4 py-5 sm:px-6 sm:py-6 print:mt-2 print:border print:border-(--color-border)`}
        >
          {decision?.type === "accepted" ? (
            <Answered
              icon={<CheckCircle2 className="size-5 shrink-0 text-(--color-icon-success)" aria-hidden />}
              title={`Accepted${decision.name ? ` by ${decision.name}` : ""} on ${dateFmt.format(decision.at)}`}
            >
              Thanks. {org.name} can see you’ve accepted and will be in touch to book the work.
            </Answered>
          ) : decision?.type === "declined" ? (
            <Answered
              icon={<XCircle className="size-5 shrink-0 text-(--color-icon-secondary)" aria-hidden />}
              title={`Declined on ${dateFmt.format(decision.at)}`}
            >
              Thanks for letting {org.name} know. Get in touch if anything changes.
            </Answered>
          ) : expired ? (
            <Answered
              icon={<XCircle className="size-5 shrink-0 text-(--color-icon-secondary)" aria-hidden />}
              title={`This quote expired on ${dateFmt.format(until)}`}
            >
              Contact {org.name} for an updated price.
            </Answered>
          ) : (
            <>
              <div id="answer">
                <Heading level={2}>Happy to go ahead?</Heading>
              </div>
              <div className="mt-1">
                <Text as="p" display="block" color="secondary">
                  Reply to this message{org.phone ? ` or call ${org.phone}` : ""} and {org.name} will be in touch to book
                  the work.
                </Text>
              </div>
            </>
          )}
        </section>
        {decision?.type === "accepted" && (
          <p className="hidden pt-6 text-sm print:block">
            Accepted{decision.name ? ` by ${decision.name}` : ""} on {dateFmt.format(decision.at)}.
          </p>
        )}
      </article>
      <div className="no-print mt-6 text-center">
        <Text as="p" display="block" type="supporting">
          Sent with OpenQuote AU
        </Text>
      </div>
    </main>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt>
        <Text type="supporting">{label}</Text>
      </dt>
      <dd className="mt-0.5 break-words">
        <Text weight="medium">{children}</Text>
      </dd>
    </div>
  );
}

function TotalRow({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
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

function Points({
  title,
  list,
  items,
}: {
  title: string;
  list: "scope" | "assumptions" | "exclusions";
  items: string[] | null;
}) {
  const edit = useContext(Editing);
  if (!items?.length && !edit) return null;
  return (
    <div>
      <PartTitle>{title}</PartTitle>
      <ul className="mt-2 space-y-1.5">
        {(items ?? []).map((it, i) => (
          <li key={edit ? i : it} className="flex gap-2.5">
            <span aria-hidden className="mt-[0.6em] size-1 shrink-0 rounded-full bg-(--color-text-secondary)" />
            <Text>
              <Editable
                field={{ kind: "point", list, index: i }}
                value={it}
                label={`${title}, point ${i + 1}`}
                placeholder="New point"
              />
            </Text>
          </li>
        ))}
      </ul>
      {edit && (
        <AddButton
          label="Add a point"
          onClick={() => edit({ kind: "point", list, index: items?.length ?? 0 }, "")}
        />
      )}
    </div>
  );
}

function Answered({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div>
        <Text as="p" display="block" weight="semibold">
          {title}
        </Text>
        <div className="mt-0.5">
          <Text as="p" display="block" color="secondary">
            {children}
          </Text>
        </div>
      </div>
    </div>
  );
}
