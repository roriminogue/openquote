"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

/** A form's submit button that locks and says what's happening while the form sends, so it can't be sent twice. */
export function SubmitButton({
  children,
  pendingLabel,
  className = "",
  variant,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} aria-busy={pending} className={className}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

/** A small text-style submit button (e.g. "Send a new code") that also locks while sending. */
export function SubmitLink({ children, pendingLabel }: { children: React.ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="font-medium text-ink-2 underline underline-offset-4 hover:text-ink disabled:opacity-60">
      {pending ? pendingLabel : children}
    </button>
  );
}
