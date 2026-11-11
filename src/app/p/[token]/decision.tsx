"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Icon } from "@astryxdesign/core/Icon";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Check, Printer } from "lucide-react";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { acceptQuote, declineQuote, type DecisionState } from "./actions";

export function PrintButton() {
  return <Button label="Save as PDF" size="sm" icon={<Icon icon={Printer} />} onClick={() => window.print()} />;
}

/** Accept (typed name + tick) or decline (optional reason). Shown until the client answers. */
export function Decision({
  token,
  version,
  business,
  prefillName,
  prefillEmail,
}: {
  token: string;
  /** The estimate version this page is showing. */
  version: number;
  business: string;
  prefillName: string;
  prefillEmail: string;
}) {
  const [mode, setMode] = useState<"accept" | "decline">("accept");
  // Controlled, so a validation error doesn't wipe what the client typed (form actions reset uncontrolled fields).
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [agree, setAgree] = useState(false);
  const [reason, setReason] = useState("");
  const [accState, accept, accepting] = useActionState<DecisionState, FormData>(
    acceptQuote.bind(null, token, version),
    {
      status: "idle",
    },
  );
  const [decState, decline, declining] = useActionState<DecisionState, FormData>(
    declineQuote.bind(null, token, version),
    { status: "idle" },
  );
  // Submitted by hand rather than with <form action>: React resets a form after an action, which also unticked the
  // (controlled) "I accept" box behind React's back, so a client hitting an error had to tick it again.
  const submitWith = (dispatch: (data: FormData) => void) => (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };
  const bad = (state: DecisionState, f: string) => (state.field === f ? ({ type: "error" } as const) : undefined);

  if (mode === "decline") {
    return (
      <form onSubmit={submitWith(decline)} noValidate className="flex flex-col gap-4">
        <TextArea
          label="Anything we should know?"
          description={`Helps ${business} understand. For example price, timing or scope.`}
          isOptional
          htmlName="reason"
          rows={3}
          value={reason}
          onChange={setReason}
          width="100%"
        />
        {decState.status === "error" && <Problem state={decState} />}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" label={declining ? "Sending…" : "Decline quote"} isLoading={declining} />
          <Button label="Back" variant="ghost" onClick={() => setMode("accept")} />
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submitWith(accept)} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Your full name"
          htmlName="name"
          value={name}
          onChange={setName}
          autoComplete="name"
          autoCapitalize="words"
          status={bad(accState, "name")}
          width="100%"
        />
        <TextInput
          type="email"
          label="Email"
          isOptional
          htmlName="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          status={bad(accState, "email")}
          width="100%"
        />
      </div>
      <CheckboxInput
        label={`I accept this quote, its scope and its terms, and I’m happy for ${business} to go ahead.`}
        htmlName="agree"
        value={agree}
        onChange={setAgree}
      />
      {accState.status === "error" && <Problem state={accState} />}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="submit"
          label={accepting ? "Accepting…" : "Accept quote"}
          variant="primary"
          size="lg"
          icon={<Icon icon={Check} />}
          isLoading={accepting}
          width="100%"
        />
        <Button label="Decline" variant="ghost" onClick={() => setMode("decline")} width="100%" />
      </div>
    </form>
  );
}

/** An answer that didn't go through. When the quote changed under them, offer the new version in one tap. */
function Problem({ state }: { state: DecisionState }) {
  return (
    <Banner
      status="error"
      title={state.message ?? "That didn't go through. Try again."}
      description={
        state.field === "version" ? (
          <span className="mt-1 inline-block">
            <Button label="Show the latest version" size="sm" onClick={() => window.location.reload()} />
          </span>
        ) : undefined
      }
    />
  );
}
