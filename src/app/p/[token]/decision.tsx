"use client";

import { Check, Printer } from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field, Input, Notice, Textarea } from "@/components/ui";
import { acceptQuote, declineQuote, type DecisionState } from "./actions";

export function PrintButton() {
  return (
    <Button type="button" variant="secondary" size="sm" onClick={() => window.print()} className="no-print">
      <Printer className="size-3.5" aria-hidden />
      Save as PDF
    </Button>
  );
}

/** Accept (typed name + tick) or decline (optional reason). Shown until the client answers. */
export function Decision({ token, business, prefillName, prefillEmail }: { token: string; business: string; prefillName: string; prefillEmail: string }) {
  const [mode, setMode] = useState<"accept" | "decline">("accept");
  // Controlled, so a validation error doesn't wipe what the client typed (form actions reset uncontrolled fields).
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [agree, setAgree] = useState(false);
  const [reason, setReason] = useState("");
  const [accState, accept, accepting] = useActionState<DecisionState, FormData>(acceptQuote.bind(null, token), { status: "idle" });
  const [decState, decline, declining] = useActionState<DecisionState, FormData>(declineQuote.bind(null, token), { status: "idle" });

  if (mode === "decline") {
    return (
      <form action={decline} className="space-y-4">
        <Field id="reason" label="Anything we should know?" optional hint={`Helps ${business} understand. For example price, timing or scope.`}>
          <Textarea id="reason" name="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        {decState.status === "error" && <Notice tone="error">{decState.message}</Notice>}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={declining}>
            {declining ? "Sending…" : "Decline quote"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setMode("accept")}>
            Back
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form action={accept} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Your full name">
          <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required aria-invalid={accState.field === "name" || undefined} />
        </Field>
        <Field id="email" label="Email" optional>
          <Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={accState.field === "email" || undefined} />
        </Field>
      </div>
      <label className="flex items-start gap-3 text-sm text-ink-2">
        <input type="checkbox" name="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)] sm:size-4" aria-invalid={accState.field === "agree" || undefined} />
        <span>I accept this quote, its scope and its terms, and I&rsquo;m happy for {business} to go ahead.</span>
      </label>
      {accState.status === "error" && <Notice tone="error">{accState.message}</Notice>}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="accent" size="lg" disabled={accepting} className="max-sm:w-full">
          <Check className="size-4" aria-hidden />
          {accepting ? "Accepting…" : "Accept quote"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setMode("decline")} className="max-sm:w-full">
          Decline
        </Button>
      </div>
    </form>
  );
}
