import { Mail } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Button, Field, Input, Notice } from "@/components/ui";
import { sendMagicLink, signInWithGoogle } from "./actions";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthFrame title="Sign in" intro="Quote jobs from the site in minutes, priced with your own rates.">
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
        <div className="flex items-start gap-3 rounded-tape bg-surface p-4">
          <Mail className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-[1.0625rem]">
            Check <strong className="font-semibold">{sent}</strong> for a sign-in link. Open it on this device.
          </p>
        </div>
        <a href="/login" className="inline-block font-semibold text-ink-2 underline hover:text-ink">
          Use a different email
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form action={sendMagicLink} className="space-y-4">
        <Field id="email" label="Email">
          <Input id="email" name="email" type="email" required autoComplete="email" inputMode="email" spellCheck={false} />
        </Field>
        <Button size="lg" className="w-full">
          Email me a sign-in link
        </Button>
      </form>
      <div className="flex items-center gap-3 text-ink-3" aria-hidden>
        <span className="h-px flex-1 bg-hairline" />
        <span className="label">or</span>
        <span className="h-px flex-1 bg-hairline" />
      </div>
      <form action={signInWithGoogle}>
        <Button variant="secondary" size="lg" className="w-full">
          Continue with Google
        </Button>
      </form>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
