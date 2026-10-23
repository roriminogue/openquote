"use client";

import { Check, Copy, ExternalLink, Layers, ListTree, Mail, MessageSquare, Receipt, Send, Share2 } from "lucide-react";
import { useState } from "react";
import { shareQuote } from "@/app/estimates/[id]/actions";
import { Segmented } from "./record-forms";
import { Sheet } from "./sheet";
import { Button, Field, Notice, Textarea } from "./ui";
import { DETAIL_LEVELS, type DetailLevel } from "@/lib/proposal-schema";

export type SendTarget = {
  estimateId: string;
  title: string;
  businessName: string;
  client: { name: string; firstName: string; phone: string | null; email: string | null } | null;
  detail: DetailLevel;
  sent: boolean;
};

/**
 * Send to client: pick what they see, write the message, then share the private link from the phone's own share
 * sheet (Messages, WhatsApp, email), or copy it. The link is made on the first share and reused after that.
 */
export function SendQuoteButton({ target }: { target: SendTarget }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<DetailLevel>(target.detail);
  const greeting = target.client ? `Hi ${target.client.firstName}` : "Hi";
  const [message, setMessage] = useState(`${greeting}, here's your quote for ${target.title.toLowerCase()} from ${target.businessName}. You can accept it online:`);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  async function link() {
    setError(null);
    setBusy(true);
    const res = await shareQuote(target.estimateId, detail);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return null;
    }
    setUrl(res.url);
    return res.url;
  }

  async function share() {
    const u = await link();
    if (!u) return;
    try {
      await navigator.share({ title: target.title, text: `${message}\n`, url: u });
    } catch {
      // Cancelled from the share sheet; the link still exists.
    }
  }

  async function copy() {
    const u = await link();
    if (!u) return;
    try {
      await navigator.clipboard.writeText(`${message}\n${u}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy. Select the link below and copy it.");
    }
  }

  async function open_(kind: "sms" | "email") {
    const u = await link();
    if (!u) return;
    const body = encodeURIComponent(`${message}\n${u}`);
    if (kind === "sms") window.location.href = `sms:${target.client?.phone?.replace(/[^\d+]/g, "") ?? ""}?&body=${body}`;
    else window.location.href = `mailto:${target.client?.email ?? ""}?subject=${encodeURIComponent(`Quote: ${target.title}`)}&body=${body}`;
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Send className="size-3.5" aria-hidden />
        {target.sent ? "Share again" : "Send to client"}
      </Button>
      {open && (
        <Sheet open title="Send to client" onClose={() => setOpen(false)}>
          <div className="space-y-6">
            <p className="text-sm text-ink-3">
              {target.client ? (
                <>
                  For <span className="font-medium text-ink">{target.client.name}</span>
                  {target.client.phone || target.client.email ? ` · ${[target.client.phone, target.client.email].filter(Boolean).join(" · ")}` : ""}
                </>
              ) : (
                "No client on this estimate yet. You can still share the link with anyone."
              )}
            </p>

            <fieldset>
              <legend className="text-sm font-medium">What the client sees</legend>
              <Segmented
                className="mt-1.5"
                value={detail}
                onChange={setDetail}
                options={DETAIL_LEVELS.map(([k, l]) => [k, l, k === "total" ? Receipt : k === "groups" ? Layers : ListTree] as const)}
              />
              <p className="mt-1.5 text-xs text-ink-3">{DETAIL_LEVELS.find(([k]) => k === detail)?.[2]} Your costs and markup are never shown.</p>
            </fieldset>

            <Field id="message" label="Message">
              <Textarea id="message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
            </Field>

            {error && <Notice tone="error">{error}</Notice>}

            <div className="grid gap-2">
              {canShare && (
                <Button size="lg" onClick={share} disabled={busy} className="w-full">
                  <Share2 className="size-4" aria-hidden />
                  {busy ? "Making the link…" : "Share…"}
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => open_("sms")} disabled={busy}>
                  <MessageSquare className="size-4" aria-hidden />
                  Text
                </Button>
                <Button variant="secondary" onClick={() => open_("email")} disabled={busy}>
                  <Mail className="size-4" aria-hidden />
                  Email
                </Button>
              </div>
              <Button variant="ghost" onClick={copy} disabled={busy}>
                {copied ? <Check className="size-4 text-ok" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                {copied ? "Copied message and link" : "Copy message and link"}
              </Button>
            </div>

            {url && (
              <div className="rounded-[10px] bg-subtle px-3 py-2.5 text-xs">
                <p className="text-ink-3">Client link</p>
                <p className="mt-0.5 break-all font-medium text-ink">{url}</p>
                <a href={url} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 font-medium text-ink-2 underline underline-offset-2">
                  See what the client sees <ExternalLink className="size-3" aria-hidden />
                </a>
              </div>
            )}
          </div>
        </Sheet>
      )}
    </>
  );
}
