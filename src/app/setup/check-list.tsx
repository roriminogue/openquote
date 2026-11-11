import { CheckCircle2, CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Wordmark } from "@/components/wordmark";

// How the setup page looks. The page itself only works out what is and isn't configured.

export type Check = { ok: boolean | "info"; title: string; detail: ReactNode };

export function SetupFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 bg-(--color-background-surface)">
      <main className="mx-auto w-full max-w-2xl px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(3.5rem,calc(env(safe-area-inset-top)+2rem))] sm:py-14">
        <Wordmark />
        <div className="mt-10">
          <Heading level={1}>Set up OpenQuote AU</Heading>
        </div>
        {children}
      </main>
    </div>
  );
}

export function ChecksLoading() {
  return <div className="mt-8 h-80 animate-pulse rounded-xl bg-(--color-skeleton)" aria-busy="true" />;
}

/** Each thing a fresh install needs, with a tick, a warning or a note, and how to fix it in plain English. */
export function CheckList({ checks }: { checks: Check[] }) {
  return (
    <>
      <div className="mt-1.5">
        <Text as="p" color="secondary">
          Fix anything marked below, redeploy, then refresh this page.
        </Text>
      </div>
      <ul className="mt-6 divide-y divide-(--color-border) border-y border-(--color-border)">
        {checks.map((c) => (
          <li key={c.title} className="flex gap-3 py-4">
            {c.ok === "info" ? (
              <Info className="mt-0.5 size-5 shrink-0 text-(--color-icon-secondary)" aria-hidden />
            ) : c.ok ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-(--color-icon-success)" aria-hidden />
            ) : (
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-(--color-icon-warning)" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <Text as="p" weight="medium">
                {c.title}
                {c.ok === false && <span className="sr-only"> (needs attention)</span>}
              </Text>
              <div className="mt-0.5">
                <Text as="div" color="secondary">
                  {c.detail}
                </Text>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Everything is green: say so, and point at sign-in. */
export function ReadyNotice({ hasBusiness }: { hasBusiness: boolean }) {
  return (
    <div className="mt-6 flex flex-col gap-4">
      <Banner
        status="success"
        title={hasBusiness ? "All set." : "Ready. Create your business next."}
        description="Sign in with your email, create your business, then add your AI key and rates in Settings."
      />
      <div className="sm:w-48">
        <Button label="Go to sign in" variant="primary" size="lg" width="100%" href="/login" />
      </div>
    </div>
  );
}

/** Once a business exists, a visitor who isn't signed in sees only this. */
export function SignedOutNotice() {
  return (
    <div className="mt-3 flex flex-col gap-6">
      <Text as="p" color="secondary">
        This OpenQuote AU is set up. Sign in to see its setup details.
      </Text>
      <div className="sm:w-48">
        <Button label="Sign in" variant="primary" size="lg" width="100%" href="/login" />
      </div>
    </div>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="break-all rounded bg-(--color-background-muted) px-1 py-0.5 font-mono text-[0.875em] text-(--color-text-primary)">
      {children}
    </code>
  );
}
