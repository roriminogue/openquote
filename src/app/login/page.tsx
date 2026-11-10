import type { Metadata } from "next";
import { Suspense } from "react";
import { z } from "zod";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { AuthFrame } from "@/components/auth-frame";
import { TextField } from "@/components/fields";
import { SubmitButton } from "@/components/submit-button";
import { CODE_ERRORS, CODE_NOTICES, LOGIN_ERRORS, messageFor } from "@/lib/auth-messages";
import { sendCode, verifyCode } from "./actions";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthFrame title="Sign in to OpenQuote AU" intro="Quote jobs from the site in minutes, priced with your own rates.">
      <Suspense>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </AuthFrame>
  );
}

async function LoginForm({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  // Only our own messages, and only a real email address, are ever shown from the URL.
  const error = messageFor(LOGIN_ERRORS, params.error);
  const codeError = messageFor(CODE_ERRORS, params.codeError);
  const notice = messageFor(CODE_NOTICES, params.notice);
  const sent = typeof params.sent === "string" && z.email().safeParse(params.sent).success ? params.sent : undefined;
  const lastEmail = typeof params.email === "string" && z.email().safeParse(params.email).success ? params.email : undefined;

  // Step 2: type the code from the email.
  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <Text as="p">
          We emailed a 6-digit code to <strong className="font-semibold [overflow-wrap:anywhere]">{sent}</strong>. It can take a minute
          to arrive, so check your junk folder too. If the email has a Sign in link instead, open it in this browser.
        </Text>
        <form action={verifyCode} className="flex flex-col gap-4">
          <input type="hidden" name="email" value={sent} />
          <TextField
            name="code"
            label="Code"
            size="lg"
            hasAutoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            enterKeyHint="go"
            placeholder="123456"
            controlClassName="tabular-nums tracking-[0.2em]"
            status={codeError ? { type: "error", message: codeError } : undefined}
          />
          {!codeError && notice && <Banner status="info" title={notice} />}
          <SubmitButton label="Sign in" pendingLabel="Signing in…" size="lg" width="100%" />
        </form>
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <form action={sendCode}>
            <input type="hidden" name="email" value={sent} />
            <SubmitButton label="Send a new code" pendingLabel="Sending…" variant="ghost" />
          </form>
          <Button label="Use a different email" variant="ghost" href="/login" />
        </div>
      </div>
    );
  }

  // Step 1: your email. A problem with the address itself is shown on the field; anything else above the button.
  const badEmail = params.error === "invalid_email";
  return (
    <form action={sendCode} className="flex flex-col gap-4">
      <TextField
        name="email"
        label="Email"
        type="email"
        size="lg"
        defaultValue={lastEmail}
        placeholder="you@business.com.au"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        hasAutoCorrect={false}
        hasSpellCheck={false}
        enterKeyHint="send"
        status={error && badEmail ? { type: "error", message: error } : undefined}
      />
      {error && !badEmail && <Banner status="error" title={error} />}
      <SubmitButton label="Email me a code" pendingLabel="Sending your code…" size="lg" width="100%" />
    </form>
  );
}
