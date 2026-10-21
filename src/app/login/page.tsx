import { Mail } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Button, Field, Input, Notice } from "@/components/ui";
import { sendMagicLink, signInWithGoogle } from "./actions";

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
  const { sent, error } = await searchParams;

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-subtle p-4">
          <Mail className="mt-0.5 size-5 shrink-0 text-ink-2" aria-hidden />
          <p className="text-body">
            Check <strong className="break-all font-medium">{sent}</strong> for a sign-in link. Open it on this device.
          </p>
        </div>
        <a href="/login" className="inline-block text-sm font-medium text-ink-2 underline underline-offset-4 hover:text-ink">
          Use a different email
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form action={sendMagicLink} className="space-y-3">
        <Field id="email" label="Email">
          <Input id="email" name="email" type="email" required autoComplete="email" inputMode="email" spellCheck={false} placeholder="you@business.com.au" />
        </Field>
        <Button className="w-full">
          Email me a sign-in link
        </Button>
      </form>
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
      {error && <Notice tone="error">{error}</Notice>}
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
