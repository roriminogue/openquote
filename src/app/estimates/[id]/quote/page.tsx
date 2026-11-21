import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { Icon } from "@astryxdesign/core/Icon";
import { Theme } from "@astryxdesign/core/theme";
import { ArrowLeft, Check, PencilLine, Share2 } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router";
import { fieldId, QuoteDocument, type PublicQuote, type QuoteField } from "@/components/quote-document";
import { DEFAULT_TERMS } from "@/lib/business-schema";
import { toEditGroups, type EditAlternative, type EditGroup } from "@/lib/estimate/edit-schema";
import { saveEstimate } from "../edit/actions";
import { saveTerms } from "./actions";
import { requireMember } from "@/lib/auth";
import { useQuery } from "@/lib/data";
import { notFound, useRouter } from "@/lib/navigation";
import { formatEstimateNo } from "@/lib/pricing";
import { DETAIL_LEVELS, type DetailLevel } from "@/lib/proposal-schema";
import { getQuoteDocument, shareEstimate } from "@/lib/proposals";
import { isNative } from "@/db/storage";
import { quotePdf } from "@/lib/pdf-web";
import { shareMadePdf, sharePdf } from "@/lib/share";
import { openquoteTheme } from "@/themes/openquote/openquote.js";

/**
 * The quote as the client will get it: the document, always light (it's paper), on the app's own page in the app's
 * own Light or Dark, with Back and Share PDF on top. Once shared
 * it records the send, marks a draft as sent, and opens the Share sheet with the PDF and the message from the Send
 * sheet. Reached from Send to client (?detail=…); without one it shows the quote as last sent. Edit turns every
 * piece of its wording into text you can tap and change, saved to the estimate (prices stay in the estimate editor).
 */
export default function QuotePage() {
  return (
    <div className="min-h-dvh bg-(--color-background-surface) print:min-h-0 print:bg-white">
      <Suspense>
        <Quote />
      </Suspense>
    </div>
  );
}

function Quote() {
  const id = useParams().id ?? "";
  const router = useRouter();
  const [sp] = useSearchParams();
  const message = (useLocation().state as { message?: string } | null)?.message;
  const asked = sp.get("detail");
  const detail = DETAIL_LEVELS.some(([k]) => k === asked) ? (asked as DetailLevel) : undefined;
  const q = useQuery(`quote:${id}:${detail ?? ""}`, async () => getQuoteDocument((await requireMember()).orgId, id, detail));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // While editing, the changed words (saved together on Done, as one new version of the estimate).
  const [draft, setDraftState] = useState<Draft | null>(null);
  // The same draft, current as soon as a field is left: Done reads it before React has drawn the last change.
  const latest = useRef<Draft | null>(null);
  const setDraft = (d: Draft | null) => {
    latest.current = d;
    setDraftState(d);
  };
  const editing = !!draft;
  if (!q) notFound();
  const locked = q.estimate.status === "accepted";

  // Web version: make the PDF as soon as the quote is on screen, so Share PDF can open the Share sheet straight
  // from the tap (it won't open after a wait). The iPhone app makes its PDF natively when tapped.
  const docRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<{ of: unknown; bytes: Uint8Array } | null>(null);
  const made = pdf?.of === q ? pdf.bytes : null; // a PDF of an older version of the quote doesn't count
  const web = !isNative();
  useEffect(() => {
    const article = docRef.current?.querySelector("article");
    // Not while editing: the page then has underlines and empty fields the client mustn't get. Done saves, which
    // reloads the quote, which makes a fresh PDF.
    if (!web || !q || !article || editing) return;
    let live = true;
    quotePdf(article, { title: `${formatEstimateNo(q.estimate.number)} ${q.estimate.title}`, author: q.org.name }).then(
      (bytes) => live && setPdf({ of: q, bytes }),
      (e) => live && setError(`Couldn't make the PDF: ${(e as Error)?.message ?? e}`),
    );
    return () => {
      live = false;
    };
  }, [web, q, editing]);
  const making = web && !made && !error;
  // On a computer the PDF opens in a new tab instead of a Share sheet: ask before counting it as sent.
  const [opened, setOpened] = useState(false);
  const [markedSent, setMarkedSent] = useState(false);

  async function share() {
    setError(null);
    setBusy(true);
    try {
      const name = `${formatEstimateNo(q!.estimate.number)} ${q!.estimate.title}`;
      const shared = web ? await shareMadePdf(name, made!, message) : await sharePdf(name, message);
      // Counts as sent once it actually went somewhere (not when the Share sheet was closed).
      if (detail && shared.completed) await shareEstimate((await requireMember()).orgId, id, detail);
      if (detail && "openedOnly" in shared && shared.openedOnly) setOpened(true);
    } catch (e) {
      setError((e as Error)?.message || "Couldn't make the PDF. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function change(field: QuoteField, text: string) {
    if (!latest.current) return;
    setDraft(applyChange(latest.current, field, text));
    // A new point: put the cursor in it once it's drawn.
    if (field.kind === "point" && text === "")
      setTimeout(() => document.querySelector<HTMLElement>(`[data-field="${fieldId(field)}"]`)?.focus());
  }

  async function done() {
    if (!draft) return;
    // Whatever is being typed in is saved too: leaving the field records it first.
    (document.activeElement as HTMLElement | null)?.blur?.();
    await new Promise((r) => setTimeout(r));
    const d = latest.current!;
    const before = draftOf(q!);
    setError(null);
    setBusy(true);
    try {
      const { terms, ...words } = d;
      const { terms: termsBefore, ...wordsBefore } = before;
      if (JSON.stringify(clean(words)) !== JSON.stringify(clean(wordsBefore))) {
        const res = await saveEstimate(id, clean(words));
        if (!res.ok) return setError(res.error);
      }
      if (terms.trim() !== termsBefore.trim()) {
        const res = await saveTerms(terms);
        if (!res.ok) return setError(res.error);
      }
      setDraft(null);
    } finally {
      setBusy(false);
    }
  }
  const shown = draft ? withDraft(q, draft) : q;

  return (
    <>
      <div className="no-print sticky top-0 z-10 border-b border-(--color-border) bg-(--color-background-surface) px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          {editing ? (
            <Button
              label="Cancel"
              variant="ghost"
              onClick={() => {
                setDraft(null);
                setError(null);
              }}
              isDisabled={busy}
            />
          ) : (
            <Button label="Back" variant="ghost" icon={<Icon icon={ArrowLeft} />} onClick={() => router.back()} />
          )}
          <div className="flex items-center gap-2">
            {editing ? (
              <Button
                label={busy ? "Saving…" : "Done"}
                variant="primary"
                icon={<Icon icon={Check} />}
                onClick={done}
                isLoading={busy}
              />
            ) : (
              <>
                {!locked && (
                  <Button
                    label="Edit"
                    variant="secondary"
                    icon={<Icon icon={PencilLine} />}
                    onClick={() => {
                      setError(null);
                      setDraft(draftOf(q));
                    }}
                    isDisabled={busy}
                  />
                )}
                <Button
                  label={busy || making ? "Making the PDF…" : "Share PDF"}
                  variant="primary"
                  icon={<Icon icon={Share2} />}
                  onClick={share}
                  isLoading={busy || making}
                  isDisabled={making}
                />
              </>
            )}
          </div>
        </div>
        {editing && (
          <div className="mx-auto mt-1 flex max-w-3xl flex-col items-start gap-x-4 sm:flex-row sm:items-center sm:justify-between">
            <Text as="p" type="supporting">
              Tap any underlined words to change them.
            </Text>
            <span className="-ml-2 sm:ml-0">
              <Button label="Change prices" variant="ghost" size="sm" href={`/estimates/${id}/edit`} />
            </span>
          </div>
        )}
        {opened && detail && (
          <div className="mx-auto mt-2 max-w-3xl">
            <Banner
              status={markedSent ? "success" : "info"}
              title={markedSent ? "Marked as sent." : "The PDF opened in a new tab."}
              description={markedSent ? undefined : "Save it or attach it to an email. Sent it to the client?"}
              endContent={
                markedSent ? undefined : (
                  <Button
                    label="Mark as sent"
                    size="sm"
                    variant="primary"
                    onClick={async () => {
                      await shareEstimate((await requireMember()).orgId, id, detail);
                      setMarkedSent(true);
                    }}
                  />
                )
              }
            />
          </div>
        )}
        {error && (
          <div className="mx-auto mt-2 max-w-3xl">
            <Banner status="error" title={error} />
          </div>
        )}
      </div>
      {/* Only the paper is light; the bar above and the page around it stay in the app's mode. */}
      <div ref={docRef}>
        <Theme theme={openquoteTheme} mode="light">
          <QuoteDocument q={shown} edit={editing ? change : undefined} />
        </Theme>
      </div>
    </>
  );
}

/** The quote's words as they are being edited. */
type Draft = {
  title: string;
  siteAddress: string;
  summary: string;
  scope: string[];
  assumptions: string[];
  exclusions: string[];
  alternatives: EditAlternative[];
  groups: EditGroup[];
  terms: string;
};

function draftOf(q: PublicQuote): Draft {
  const e = q.estimate;
  return {
    title: e.title,
    siteAddress: e.siteAddress ?? "",
    summary: e.summary ?? "",
    scope: e.scope ?? [],
    assumptions: e.assumptions ?? [],
    exclusions: e.exclusions ?? [],
    alternatives: e.alternatives ?? [],
    groups: toEditGroups(q.groups),
    terms: q.org.termsMd || DEFAULT_TERMS,
  };
}

/** The draft as the save wants it: points left empty dropped. */
function clean(d: Omit<Draft, "terms">) {
  const points = (xs: string[]) => xs.map((x) => x.trim()).filter(Boolean);
  return {
    ...d,
    scope: points(d.scope),
    assumptions: points(d.assumptions),
    exclusions: points(d.exclusions),
    alternatives: d.alternatives.filter((a) => a.title.trim()),
  };
}

function applyChange(d: Draft, f: QuoteField, text: string): Draft {
  switch (f.kind) {
    case "title":
      return { ...d, title: text };
    case "summary":
      return { ...d, summary: text };
    case "site":
      return { ...d, siteAddress: text };
    case "terms":
      return { ...d, terms: text };
    case "stage":
      return { ...d, groups: d.groups.map((g, i) => (i === f.group ? { ...g, name: text } : g)) };
    case "line":
      return {
        ...d,
        groups: d.groups.map((g, i) =>
          i !== f.group ? g : { ...g, lines: g.lines.map((l, j) => (j === f.line ? { ...l, description: text } : l)) },
        ),
      };
    case "point": {
      const list = d[f.list];
      // Past the end adds a point; a point emptied goes (unless it's the one just added, still being typed).
      const next =
        f.index >= list.length
          ? [...list, text]
          : text === ""
            ? list.filter((_, i) => i !== f.index)
            : list.map((x, i) => (i === f.index ? text : x));
      return { ...d, [f.list]: next };
    }
    case "option":
      return {
        ...d,
        alternatives: d.alternatives.map((a, i) => (i === f.index ? { ...a, [f.part]: text } : a)),
      };
  }
}

/** The quote with the draft's words in it, to show while editing. */
function withDraft(q: PublicQuote, d: Draft): PublicQuote {
  return {
    ...q,
    estimate: {
      ...q.estimate,
      title: d.title,
      siteAddress: d.siteAddress || null,
      summary: d.summary || null,
      scope: d.scope,
      assumptions: d.assumptions,
      exclusions: d.exclusions,
      alternatives: d.alternatives,
    },
    groups: q.groups.map((g, gi) => ({
      ...g,
      name: d.groups[gi]?.name ?? g.name,
      lines: g.lines.map((l, li) => ({ ...l, description: d.groups[gi]?.lines[li]?.description ?? l.description })),
    })),
    org: { ...q.org, termsMd: d.terms },
  };
}
