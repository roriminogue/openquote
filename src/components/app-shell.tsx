import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { AccountMenu } from "./account-menu";
import { ActiveBottomNav, ActiveSidebarNav, BottomNav, SidebarNav } from "./nav-links";

/** Mark: a quote sheet whose last line, the total, is set in hi-vis orange. */
export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="6.5" fill="currentColor" />
      <path d="M7 8h10M7 12h10" stroke="var(--bg)" strokeWidth="2" strokeLinecap="round" />
      <path d="M12.5 16.5H17" stroke="var(--accent)" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 text-ink ${className}`}>
      <Mark className="size-[22px] shrink-0" />
      <span translate="no" className="font-display text-[1.0625rem] font-semibold tracking-[-0.01em]">
        OpenQuote
      </span>
    </span>
  );
}

/**
 * Signed-in frame. From 768px: a 256px sidebar on the page colour behind a hairline, grouped nav with small grey
 * labels and the account at the foot. On phones: a slim top bar and a bottom tab bar with New in the middle.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-40 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-2"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh flex-1">
        <div className="no-print hidden w-64 shrink-0 border-r border-border bg-sidebar md:block">
          <aside className="sticky top-0 flex h-dvh flex-col px-3 pb-3">
            <Link href="/estimates" className="flex h-14 items-center px-1.5" aria-label="OpenQuote estimates">
              <Wordmark />
            </Link>
            <Suspense fallback={<SidebarNav pathname="" />}>
              <ActiveSidebarNav />
            </Suspense>
            <Suspense fallback={<div className="h-9" />}>
              <SidebarAccount />
            </Suspense>
          </aside>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-20 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between border-b border-border bg-bg px-4 pt-[env(safe-area-inset-top)] md:hidden">
            <Link href="/estimates" aria-label="OpenQuote estimates">
              <Wordmark />
            </Link>
            <Suspense>
              <MobileAccount />
            </Suspense>
          </header>
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto w-full max-w-[60rem] flex-1 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-6 outline-none sm:px-6 md:px-16 md:pb-8 md:pt-14"
          >
            {children}
          </main>
        </div>
      </div>
      <Suspense fallback={<BottomNav pathname="" />}>
        <ActiveBottomNav />
      </Suspense>
    </>
  );
}

async function SidebarAccount() {
  const user = await getAuthUser();
  if (!user?.email) return null;
  return <AccountMenu email={user.email} />;
}

async function MobileAccount() {
  const user = await getAuthUser();
  if (!user?.email) return null;
  return <AccountMenu email={user.email} compact />;
}
