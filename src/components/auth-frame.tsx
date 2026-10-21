import type { ReactNode } from "react";
import { Wordmark } from "./app-shell";

/**
 * Sign-in and onboarding: a narrow card on a dotted field, with a line of what the app does at the foot so the
 * first screen says something before anyone types.
 */
export function AuthFrame({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="dots flex min-h-dvh flex-1 flex-col bg-bg">
      <main className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center px-4 py-12">
        <Wordmark className="mb-8 justify-center" />
        <div className="rounded-[14px] bg-surface p-6 shadow-raised sm:p-8">
          <h1 className="font-display text-title font-medium leading-8">{title}</h1>
          {intro && <div className="mt-1 text-sm text-ink-3">{intro}</div>}
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-xs text-ink-3">
          Describe a job, get a priced estimate with your own rates. Open source.
        </p>
      </main>
    </div>
  );
}
