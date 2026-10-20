import { LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { getAuthUser } from "@/lib/auth";
import { LinkButton } from "./ui";
import { ActiveNavLinks, NavLinks } from "./nav-links";

/** Mark: a tape case with the blade run out. Authored, one stroke weight. */
export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={className} aria-hidden>
      <rect x="1" y="2" width="14" height="16" rx="3" fill="currentColor" />
      <rect x="15" y="11" width="12" height="5" fill="var(--blade)" />
      <path d="M18 11v2.5M21 11v1.5M24 11v2.5" stroke="var(--on-blade)" strokeWidth="1" />
      <circle cx="8" cy="10" r="2.5" fill="var(--blade)" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-30 rounded-tape bg-blade px-4 py-2 font-semibold text-on-blade focus:not-sr-only focus:fixed focus:left-4 focus:top-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-hairline bg-surface-2/95 backdrop-blur-sm supports-[backdrop-filter]:bg-surface-2/85">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4 sm:gap-6">
          <Link href="/estimates" className="flex items-center gap-2 text-ink" aria-label="OpenQuote estimates">
            <Mark className="h-5 w-7 shrink-0" />
            <span translate="no" className="hidden font-cond text-lg font-bold tracking-tight sm:inline">OpenQuote</span>
          </Link>
          <Suspense fallback={<NavLinks pathname="" />}>
            <ActiveNavLinks />
          </Suspense>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <LinkButton href="/estimates/new" className="h-10 px-3 sm:px-4">
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
              <span className="sm:hidden">New</span>
              <span className="hidden sm:inline">New estimate</span>
            </LinkButton>
            <Suspense>
              <Account />
            </Suspense>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 outline-none sm:pt-10">{children}</main>
    </>
  );
}

async function Account() {
  const user = await getAuthUser();
  if (!user) return null;
  return (
    <form action="/auth/signout" method="post">
      <button
        className="inline-flex size-10 items-center justify-center rounded-tape text-ink-2 transition-colors hover:bg-surface hover:text-ink"
        title={`Sign out (${user.email})`}
      >
        <LogOut className="size-[1.125rem]" aria-hidden />
        <span className="sr-only">Sign out {user.email}</span>
      </button>
    </form>
  );
}
