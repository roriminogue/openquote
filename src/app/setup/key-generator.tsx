"use client";

import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { Check, Copy, KeyRound } from "lucide-react";
import { useState } from "react";

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
    <div className="mt-3">
      {key ? (
        <div className="flex flex-wrap items-center gap-2">
          <code className="break-all rounded-md bg-(--color-background-muted) px-2.5 py-2 font-mono text-[0.8125rem] text-(--color-text-primary)">
            {key}
          </code>
          <Button
            label={copied ? "Copied" : "Copy"}
            variant="secondary"
            icon={<Icon icon={copied ? Check : Copy} />}
            onClick={async () => {
              await navigator.clipboard.writeText(key);
              setCopied(true);
            }}
          />
        </div>
      ) : (
        <Button label="Generate a key" variant="secondary" icon={<Icon icon={KeyRound} />} onClick={make} />
      )}
    </div>
  );
}
