import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { FileText, Send } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
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

/** Short enough that all three fit across a phone, even the selected one in bold. The line under them explains. */
const SHORT: Record<DetailLevel, string> = {
  total: "Total",
  groups: "Stages",
  full: "Every line",
};

/**
 * Send to client: pick what they see and write the message, then preview the quote and share it as a PDF from the
 * phone's own Share sheet (Messages, WhatsApp, Mail).
 */
export function SendQuoteButton({ target }: { target: SendTarget }) {
  const router = useNavigate();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<DetailLevel>(target.detail);
  const greeting = target.client ? `Hi ${target.client.firstName}` : "Hi";
  const [message, setMessage] = useState(
    `${greeting}, here's your quote for ${target.title.toLowerCase()} from ${target.businessName}. Let me know if you're happy to go ahead.`,
  );
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
              "No client on this estimate yet. You can still send the PDF to anyone."
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

          <TextArea
            id="message"
            label="Message"
            description="Sent with the PDF."
            rows={4}
            value={message}
            onChange={setMessage}
            width="100%"
          />

          <Button
            label="Preview and share PDF"
            variant="primary"
            size="lg"
            icon={<Icon icon={FileText} />}
            onClick={() => {
              setOpen(false);
              void router(`/estimates/${target.estimateId}/quote?detail=${detail}`, { state: { message } });
            }}
            width="100%"
          />
        </div>
      </Sheet>
    </>
  );
}
