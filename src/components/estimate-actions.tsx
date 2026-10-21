"use client";

import { Check, Copy, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui";

/** Copy the estimate as text, or print it (the browser's print dialog also saves a PDF). */
export function EstimateActions({ text }: { text: string }) {
  const [copied, setCopied] = useState<"ok" | "failed" | null>(null);

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
    <div className="no-print flex shrink-0 gap-2">
      <Button variant="secondary" onClick={copy} aria-live="polite">
        {copied === "ok" ? <Check className="size-4 text-ok" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied === "ok" ? "Copied" : copied === "failed" ? "Couldn’t copy" : "Copy as text"}
      </Button>
      <Button variant="secondary" onClick={() => window.print()}>
        <Printer className="size-4" aria-hidden />
        <span className="hidden sm:inline">Print or PDF</span>
        <span className="sm:hidden">Print</span>
      </Button>
    </div>
  );
}
