import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { Theme } from "@astryxdesign/core/theme";
import { ArrowLeft, Share2 } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router";
import { QuoteDocument } from "@/components/quote-document";
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
 * The quote as the client will get it: the document, always light (it's paper), with Share PDF on top. Once shared
 * it records the send, marks a draft as sent, and opens the Share sheet with the PDF and the message from the Send
 * sheet. Reached from Send to client (?detail=…); without one it shows the quote as last sent.
 */
export default function QuotePage() {
  return (
    <Theme theme={openquoteTheme} mode="light">
      <div className="min-h-dvh bg-(--color-background-surface) print:min-h-0">
        <Suspense>
          <Quote />
        </Suspense>
      </div>
    </Theme>
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
  if (!q) notFound();

  // Web version: make the PDF as soon as the quote is on screen, so Share PDF can open the Share sheet straight
  // from the tap (it won't open after a wait). The iPhone app makes its PDF natively when tapped.
  const docRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<{ of: unknown; bytes: Uint8Array } | null>(null);
  const made = pdf?.of === q ? pdf.bytes : null; // a PDF of an older version of the quote doesn't count
  const web = !isNative();
  useEffect(() => {
    const article = docRef.current?.querySelector("article");
    if (!web || !q || !article) return;
    let live = true;
    quotePdf(article).then(
      (bytes) => live && setPdf({ of: q, bytes }),
      (e) => live && setError(`Couldn't make the PDF: ${(e as Error)?.message ?? e}`),
    );
    return () => {
      live = false;
    };
  }, [web, q]);
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

  return (
    <>
      <div className="no-print sticky top-0 z-10 border-b border-(--color-border) bg-(--color-background-surface) px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Button label="Back" variant="ghost" icon={<Icon icon={ArrowLeft} />} onClick={() => router.back()} />
          <Button
            label={busy || making ? "Making the PDF…" : "Share PDF"}
            variant="primary"
            icon={<Icon icon={Share2} />}
            onClick={share}
            isLoading={busy || making}
            isDisabled={making}
          />
        </div>
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
      <div ref={docRef}>
        <QuoteDocument q={q} />
      </div>
    </>
  );
}
