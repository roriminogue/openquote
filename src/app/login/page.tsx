import { Mail } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Button, Field, Input, Notice } from "@/components/ui";
import { sendCode, verifyCode } from "./actions";
import { CODE_ERRORS, LOGIN_ERRORS, messageFor } from "@/lib/auth-messages";
import { z } from "zod";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthFrame title="Sign in to OpenQuote" intro="Quote jobs from the site in minutes, priced with your own rates.">
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
  const sent = typeof params.sent === "string" && z.email().safeParse(params.sent).success ? params.sent : undefined;
  const lastEmail = typeof params.email === "string" && z.email().safeParse(params.email).success ? params.email : undefined;

  // Step 2: type the code from the email.
  if (sent) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-subtle p-4">
          <Mail className="mt-0.5 size-5 shrink-0 text-ink-2" aria-hidden />
          <p className="text-body">
            We emailed a 6-digit code to <strong className="break-all font-medium">{sent}</strong>. It can take a minute to
            arrive, so check your junk folder too. If the email has a Sign in link instead, open it in this browser.
          </p>
        </div>
        <form action={verifyCode} className="space-y-3">
          <input type="hidden" name="email" value={sent} />
          <Field id="code" label="Code">
            <Input
              id="code"
              name="code"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              maxLength={12}
              placeholder="123456"
              aria-invalid={codeError ? true : undefined}
              className="figures tracking-[0.2em]"
            />
          </Field>
          {codeError && <Notice tone="error">{codeError}</Notice>}
          <Button className="w-full">Sign in</Button>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <form action={sendCode}>
            <input type="hidden" name="email" value={sent} />
            <button className="font-medium text-ink-2 underline underline-offset-4 hover:text-ink">Send a new code</button>
          </form>
          <a href="/login" className="font-medium text-ink-2 underline underline-offset-4 hover:text-ink">
            Use a different email
          </a>
        </div>
      </div>
    );
  }

  // Step 1: your email.
  return (
    <form action={sendCode} className="space-y-3">
      <Field id="email" label="Email">
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          defaultValue={lastEmail}
          placeholder="you@business.com.au"
        />
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      <Button className="w-full">Email me a code</Button>
    </form>
  );
}
