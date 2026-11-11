"use client";

import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { Banner } from "@astryxdesign/core/Banner";
import { Check, Copy, CopyPlus, Pencil, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { duplicateQuote } from "@/app/estimates/[id]/actions";
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
          <Button label="Print or PDF" onClick={() => window.print()} icon={<Icon icon={Printer} />} width="100%">
            <span className="sm:hidden">Print</span>
            <span className="hidden sm:inline">Print or PDF</span>
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
