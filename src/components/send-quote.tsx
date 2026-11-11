"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Icon } from "@astryxdesign/core/Icon";
import { Link } from "@astryxdesign/core/Link";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Check, Copy, Mail, MessageSquare, Send, Share2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { shareQuote } from "@/app/estimates/[id]/actions";
import { Sheet } from "./sheet";
import { DETAIL_LEVELS, type DetailLevel } from "@/lib/proposal-schema";

export type SendTarget = {
  estimateId: string;
  title: string;
  businessName: string;
  client: {
    name: string;
    firstName: string;
    phone: string | null;
    email: string | null;
  } | null;
  detail: DetailLevel;
  sent: boolean;
};

const noop = () => () => {};

/** Short enough that all three fit across a phone, even the selected one in bold. The line under them explains. */
const SHORT: Record<DetailLevel, string> = {
  total: "Total",
  groups: "Stages",
  full: "Every line",
};

/**
 * Send to client: pick what they see, write the message, then share the private link from the phone's own share
 * sheet (Messages, WhatsApp, email), or copy it. The link is made on the first share and reused after that.
 */
export function SendQuoteButton({ target }: { target: SendTarget }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<DetailLevel>(target.detail);
  const greeting = target.client ? `Hi ${target.client.firstName}` : "Hi";
  const [message, setMessage] = useState(
    `${greeting}, here's your quote for ${target.title.toLowerCase()} from ${target.businessName}. You can accept it online:`,
  );
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Known only in the browser; the server renders without the Share button.
  const canShare = useSyncExternalStore(
    noop,
    () => "share" in navigator,
    () => false,
  );

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
      await navigator.share({
        title: target.title,
        text: `${message}\n`,
        url: u,
      });
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
    if (kind === "sms")
      window.location.href = `sms:${target.client?.phone?.replace(/[^\d+]/g, "") ?? ""}?&body=${body}`;
    else
      window.location.href = `mailto:${target.client?.email ?? ""}?subject=${encodeURIComponent(`Quote: ${target.title}`)}&body=${body}`;
  }

  const contact = target.client ? [target.client.phone, target.client.email].filter(Boolean).join(" · ") : "";

  return (
    <>
      <Button
        label={target.sent ? "Share again" : "Send to client"}
        variant="primary"
        icon={<Icon icon={Send} />}
        onClick={() => setOpen(true)}
        width="100%"
      />
      <Sheet open={open} title="Send to client" onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-6">
          <Text as="p" type="supporting">
            {target.client ? (
              <>
                For{" "}
                <Text type="inherit" weight="medium" color="primary">
                  {target.client.name}
                </Text>
                {contact ? ` · ${contact}` : ""}
              </>
            ) : (
              "No client on this estimate yet. You can still share the link with anyone."
            )}
          </Text>

          <div>
            {/* The control is named for screen readers already; this is the same name, shown. */}
            <div aria-hidden className="mb-1.5">
              <Text as="p" type="label" color="secondary" weight="medium">
                What the client sees
              </Text>
            </div>
            <SegmentedControl
              label="What the client sees"
              value={detail}
              onChange={(next) => setDetail(next as DetailLevel)}
              layout="fill"
            >
              {DETAIL_LEVELS.map(([k]) => (
                <SegmentedControlItem key={k} value={k} label={SHORT[k]} />
              ))}
            </SegmentedControl>
            <div className="mt-1.5">
              <Text as="p" type="supporting">
                {DETAIL_LEVELS.find(([k]) => k === detail)?.[2]} Your costs and markup are never shown.
              </Text>
            </div>
          </div>

          <TextArea id="message" label="Message" rows={4} value={message} onChange={setMessage} width="100%" />

          {error && <Banner status="error" title={error} />}

          <div className="flex flex-col gap-2">
            {canShare && (
              <Button
                label={busy ? "Making the link…" : "Share…"}
                variant="primary"
                size="lg"
                icon={<Icon icon={Share2} />}
                onClick={share}
                isLoading={busy}
                width="100%"
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                label="Text"
                icon={<Icon icon={MessageSquare} />}
                onClick={() => open_("sms")}
                isDisabled={busy}
                width="100%"
              />
              <Button
                label="Email"
                icon={<Icon icon={Mail} />}
                onClick={() => open_("email")}
                isDisabled={busy}
                width="100%"
              />
            </div>
            <Button
              label={copied ? "Copied message and link" : "Copy message and link"}
              variant="ghost"
              icon={<Icon icon={copied ? Check : Copy} color={copied ? "success" : undefined} />}
              onClick={copy}
              isDisabled={busy}
              width="100%"
            />
          </div>

          {url && (
            <Card variant="muted" padding={3}>
              <Text as="p" type="supporting">
                Client link
              </Text>
              <div className="mt-0.5 break-all">
                <Text as="p" weight="medium">
                  {url}
                </Text>
              </div>
              <div className="mt-1.5">
                <Link href={url} isExternalLink color="primary" hasUnderline>
                  See what the client sees
                </Link>
              </div>
            </Card>
          )}
        </div>
      </Sheet>
    </>
  );
}
