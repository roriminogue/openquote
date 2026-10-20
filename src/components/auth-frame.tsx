import type { ReactNode } from "react";
import { Mark } from "./app-shell";

/** Narrow, centred frame for sign-in and onboarding: the blade runs along the top edge. */
export function AuthFrame({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <div aria-hidden className="graduations h-3 bg-blade" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-16 pt-12 sm:pt-20">
        <p className="flex items-center gap-2 text-ink">
          <Mark className="h-5 w-7" />
          <span translate="no" className="font-cond text-lg font-bold tracking-tight">OpenQuote</span>
        </p>
        <h1 className="mt-10 text-[2rem] font-bold leading-tight tracking-[-0.01em]">{title}</h1>
        {intro && <div className="mt-2 text-[1.0625rem] text-ink-2">{intro}</div>}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
