import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { AppShell as Shell } from "@astryxdesign/core/AppShell";
import { TopNav } from "@astryxdesign/core/TopNav";
import { getAuthUser } from "@/lib/auth";
import { AccountMenu } from "./account-menu";
import { ActiveSideNav, ActiveTabBar, SideNavLinks, TabBar } from "./nav-links";

/** Mark: a quote sheet whose last line, the total, is set in hi-vis orange. */
export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="6.5" fill="currentColor" />
      <path d="M7 8h10M7 12h10" stroke="var(--color-background-surface)" strokeWidth="2" strokeLinecap="round" />
      <path d="M12.5 16.5H17" stroke="var(--color-accent)" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 text-(--color-text-primary) ${className}`}>
      <Mark className="size-[22px] shrink-0" />
      <span translate="no" className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
        OpenQuote<span className="ml-[0.3em] font-medium text-(--color-text-secondary)">AU</span>
      </span>
    </span>
  );
}

/**
 * Signed-in frame. On a phone: the wordmark and the account in a slim top bar, the page, and a tab bar with New in
 * the middle. From 768px the tab bar gives way to a sidebar. The shell supplies the skip link and the main landmark.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Shell
        height="auto"
        variant="section"
        // Phones first: the server renders the phone layout, and there is no drawer to open, so no menu button.
        mobileNav={{ hasToggle: false, defaultIsMobile: true }}
        topNav={
          <TopNav
            label="OpenQuote AU"
            heading={
              <Link href="/estimates" aria-label="OpenQuote AU estimates" className="flex h-11 items-center rounded-lg">
                <Wordmark />
              </Link>
            }
            endContent={
              <Suspense>
                <Account />
              </Suspense>
            }
          />
        }
        sideNav={
          <Suspense fallback={<SideNavLinks pathname="" />}>
            <ActiveSideNav />
          </Suspense>
        }
      >
        {/* Bottom room on phones keeps the last row clear of the tab bar. */}
        <div className="mx-auto w-full max-w-[60rem] px-4 pb-[6.5rem] pt-5 sm:px-6 md:px-10 md:pb-10 md:pt-8">
          {children}
        </div>
      </Shell>
      <Suspense fallback={<TabBar pathname="" />}>
        <ActiveTabBar />
      </Suspense>
    </>
  );
}

async function Account() {
  const user = await getAuthUser();
  if (!user?.email) return null;
  return <AccountMenu email={user.email} />;
}
