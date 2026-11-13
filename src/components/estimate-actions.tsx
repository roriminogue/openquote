import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { Banner } from "@astryxdesign/core/Banner";
import { Check, Copy, CopyPlus, Pencil, Printer } from "lucide-react";
import { useRouter } from "@/lib/navigation";
import { useEffect, useState, useTransition } from "react";
import { duplicateQuote } from "@/app/estimates/[id]/actions";
import { isNative } from "@/db/storage";
import { quotePdf } from "@/lib/pdf-web";
import { shareMadePdf, sharePdf } from "@/lib/share";
import { SendQuoteButton, type SendTarget } from "./send-quote";

/**
 * Send to the client, edit the lines (or, once accepted and locked, duplicate it as a new estimate), copy the
 * estimate as text, or print it (print also saves a PDF). On a phone Send takes its own full-width row and the
 * rest share the row under it; from 640px they sit in one line.
 */
export function EstimateActions({
  text,
  editHref,
  duplicateId,
  send,
}: {
  text: string;
  editHref?: string;
  /** Offered instead of Edit on an accepted quote: copies it into a new draft. */
  duplicateId?: string;
  send?: SendTarget;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState<"ok" | "failed" | null>(null);
  const [duplicating, startDuplicate] = useTransition();
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  function duplicate() {
    if (!duplicateId) return;
    setDuplicateError(null);
    startDuplicate(async () => {
      const res = await duplicateQuote(duplicateId).catch(
        () => ({ ok: false, error: "That didn't work. Try again." }) as const,
      );
      if (!res.ok) return setDuplicateError(res.error);
      // Straight into the editor, where the changes get priced.
      router.push(`/estimates/${res.id}/edit`);
    });
  }

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  // Print or PDF: the iPhone app makes the PDF natively. The web version makes it itself (Safari keeps asking
  // "Allow printing?" otherwise) and opens the Share sheet; if making it took too long for the Share sheet to open
  // from that tap, the button says "Share PDF" and the next tap opens it straight away.
  const web = !isNative();
  const pdfName = `${send?.title ?? "Estimate"} (your copy)`;
  const [pdf, setPdf] = useState<{ of: string; bytes: Uint8Array } | null>(null);
  const ready = pdf?.of === text ? pdf.bytes : null;
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    if (web) void import("@/lib/pdf-web"); // load the PDF code early, so the first tap is quick
  }, [web]);

  async function print(e: React.MouseEvent) {
    if (!web) return void sharePdf(pdfName);
    setPrinting(true);
    try {
      let bytes = ready;
      if (!bytes) {
        const page = (e.currentTarget as HTMLElement).closest('main, [role="main"]') ?? document.querySelector('main, [role="main"]');
        if (!page) return;
        bytes = await quotePdf(page as HTMLElement);
        setPdf({ of: text, bytes });
      }
      await shareMadePdf(pdfName, bytes);
    } catch (err) {
      if ((err as Error)?.name !== "NotAllowedError") console.error(err);
    } finally {
      setPrinting(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
    } catch {
      setCopied("failed");
    }
  }

  return (
    <div className="no-print flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
      {/* Each button sits in its own box: full width in its phone grid cell, its own width from 640px. */}
      {/* An accepted quote is locked: the next step is a new estimate for any changes, not sending it again. */}
      {duplicateId ? (
        <div className="sm:shrink-0">
          <Button
            label={duplicating ? "Duplicating…" : "Duplicate as new estimate"}
            variant="primary"
            icon={<Icon icon={CopyPlus} />}
            onClick={duplicate}
            isLoading={duplicating}
            width="100%"
          />
        </div>
      ) : (
        send && (
          <div className="sm:shrink-0">
            <SendQuoteButton target={send} />
          </div>
        )
      )}
      <div className={`grid gap-2 sm:flex ${editHref ? "grid-cols-3" : "grid-cols-2"}`}>
        {editHref && (
          <div className="sm:shrink-0">
            <Button
              href={editHref}
              label="Edit"
              variant={send ? "secondary" : "primary"}
              icon={<Icon icon={Pencil} />}
              width="100%"
            />
          </div>
        )}
        <div className="sm:shrink-0">
          <Button
            label={copied === "ok" ? "Copied" : copied === "failed" ? "Couldn’t copy" : "Copy as text"}
            onClick={copy}
            icon={<Icon icon={copied === "ok" ? Check : Copy} color={copied === "ok" ? "success" : undefined} />}
            width="100%"
          >
            {copied === "ok" ? (
              "Copied"
            ) : copied === "failed" ? (
              "Couldn’t copy"
            ) : (
              <>
                <span className="sm:hidden">Copy</span>
                <span className="hidden sm:inline">Copy as text</span>
              </>
            )}
          </Button>
        </div>
        <div className="sm:shrink-0">
          <Button
            label={printing ? "Making the PDF…" : web && ready ? "Share PDF" : "Print or PDF"}
            onClick={(e) => void print(e)}
            isLoading={printing}
            icon={<Icon icon={Printer} />}
            width="100%"
          >
            {web && ready ? (
              "Share PDF"
            ) : (
              <>
                <span className="sm:hidden">Print</span>
                <span className="hidden sm:inline">Print or PDF</span>
              </>
            )}
          </Button>
        </div>
      </div>
      {duplicateError && <Banner status="error" title={duplicateError} />}
      <span role="status" className="sr-only">
        {copied === "ok" ? "Copied the estimate as text" : copied === "failed" ? "Couldn’t copy the estimate" : ""}
      </span>
    </div>
  );
}
