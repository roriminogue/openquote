import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { Theme } from "@astryxdesign/core/theme";
import { ArrowLeft, Share2 } from "lucide-react";
import { Suspense, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router";
import { QuoteDocument } from "@/components/quote-document";
import { requireMember } from "@/lib/auth";
import { useQuery } from "@/lib/data";
import { notFound, useRouter } from "@/lib/navigation";
import { formatEstimateNo } from "@/lib/pricing";
import { DETAIL_LEVELS, type DetailLevel } from "@/lib/proposal-schema";
import { getQuoteDocument, shareEstimate } from "@/lib/proposals";
import { sharePdf } from "@/lib/share";
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

  async function share() {
    setError(null);
    setBusy(true);
    try {
      const shared = await sharePdf(`${formatEstimateNo(q!.estimate.number)} ${q!.estimate.title}`, message);
      // Counts as sent once it actually went somewhere (not when the Share sheet was closed).
      if (detail && shared.completed) await shareEstimate((await requireMember()).orgId, id, detail);
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
            label={busy ? "Making the PDF…" : "Share PDF"}
            variant="primary"
            icon={<Icon icon={Share2} />}
            onClick={share}
            isLoading={busy}
          />
        </div>
        {error && (
          <div className="mx-auto mt-2 max-w-3xl">
            <Banner status="error" title={error} />
          </div>
        )}
      </div>
      <QuoteDocument q={q} />
    </>
  );
}
