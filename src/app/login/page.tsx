import { Mail } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Button, Field, Input, Notice } from "@/components/ui";
import { sendMagicLink, signInWithGoogle, signInWithPassword, verifyCode } from "./actions";

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
  const { sent, error, codeError, email: lastEmail } = await searchParams;
  // The iPhone app adds this to its user agent. Google refuses to sign in inside embedded browsers.
  const inApp = (await headers()).get("user-agent")?.includes("OpenQuoteApp") ?? false;

  if (typeof sent === "string") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-subtle p-4">
          <Mail className="mt-0.5 size-5 shrink-0 text-ink-2" aria-hidden />
          <p className="text-body">
            We emailed a sign-in link to <strong className="break-all font-medium">{sent}</strong>.{" "}
            {inApp ? "Open the email on this phone and tap Sign in. It brings you back to OpenQuote." : "Open it on this device."}
          </p>
        </div>
        <details className="group" open={typeof codeError === "string"}>
          <summary className="cursor-pointer list-none text-sm font-medium text-ink-2 underline underline-offset-4 hover:text-ink [&::-webkit-details-marker]:hidden">
            Got a 6-digit code instead?
          </summary>
          <form action={verifyCode} className="mt-3 space-y-3">
            <input type="hidden" name="email" value={sent} />
            <Field id="code" label="Code">
              <Input
                id="code"
                name="code"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9 ]*"
                maxLength={12}
                placeholder="123456"
                aria-invalid={codeError ? true : undefined}
                className="figures tracking-[0.2em]"
              />
            </Field>
            {typeof codeError === "string" && <Notice tone="error">{codeError}</Notice>}
            <Button className="w-full">Sign in</Button>
          </form>
        </details>
        <a href="/login" className="inline-block text-sm font-medium text-ink-2 underline underline-offset-4 hover:text-ink">
          Use a different email
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form action={signInWithPassword} className="space-y-3">
        <Field id="email" label="Email">
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            inputMode="email"
            spellCheck={false}
            defaultValue={typeof lastEmail === "string" ? lastEmail : undefined}
            placeholder="you@business.com.au"
          />
        </Field>
        <Field id="password" label="Password">
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </Field>
        <Button className="w-full">Sign in</Button>
      </form>
      {error && <Notice tone="error">{error}</Notice>}
      <details className="group">
        <summary className="cursor-pointer list-none text-sm font-medium text-ink-2 underline underline-offset-4 hover:text-ink [&::-webkit-details-marker]:hidden">
          No password yet? Email me a sign-in link
        </summary>
        <form action={sendMagicLink} className="mt-3 space-y-3">
          <Field id="linkEmail" label="Email">
            <Input id="linkEmail" name="email" type="email" required autoComplete="email" inputMode="email" spellCheck={false} placeholder="you@business.com.au" />
          </Field>
          <Button variant="secondary" className="w-full">
            Email me a sign-in link
          </Button>
        </form>
      </details>
      {!inApp && (
        <>
          <div className="flex items-center gap-3 text-xs text-ink-3" aria-hidden>
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <form action={signInWithGoogle}>
            <Button variant="secondary" className="w-full">
              <GoogleG />
              Continue with Google
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

/** Google's "G", as their sign-in guidelines ask for on the button. */
function GoogleG() {
  return (
    <svg viewBox="0 0 18 18" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}
