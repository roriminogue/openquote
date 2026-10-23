"use client";

import { Check, Copy, KeyRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";

/** Makes a fresh ENCRYPTION_KEY in the browser (32 random bytes, base64), so nobody needs a terminal for it. */
export function KeyGenerator() {
  const [key, setKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  function make() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    setKey(btoa(String.fromCharCode(...bytes)));
    setCopied(false);
  }
  return (
    <div className="mt-2 space-y-2">
      {key ? (
        <div className="flex flex-wrap items-center gap-2">
          <code className="break-all rounded-md bg-subtle px-2 py-1.5 font-mono text-xs text-ink">{key}</code>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(key);
              setCopied(true);
            }}
          >
            {copied ? <Check className="size-3.5 text-ok" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      ) : (
        <Button type="button" variant="secondary" size="sm" onClick={make}>
          <KeyRound className="size-3.5" aria-hidden />
          Generate a key
        </Button>
      )}
    </div>
  );
}
