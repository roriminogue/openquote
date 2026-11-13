import type { ReactNode } from "react";
import { AppShell as Shell } from "@astryxdesign/core/AppShell";
import { TopNav } from "@astryxdesign/core/TopNav";
import Link from "@/lib/link";
import { ActiveSideNav, ActiveTabBar } from "./nav-links";
import { Wordmark } from "./wordmark";

export { Mark, Wordmark } from "./wordmark";

/**
 * The app's frame. On a phone: the wordmark in a slim top bar, the page, and a tab bar with New in the middle.
 * There's no account to show: everything lives on this phone (Settings → Your data). From 768px the tab bar gives way to a sidebar. The shell supplies the skip link and the main landmark.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Shell
        height="auto"
        variant="section"
        // Phones first: there is no drawer to open, so no menu button.
        mobileNav={{ hasToggle: false, defaultIsMobile: true }}
        topNav={
          <TopNav
            label="OpenQuote AU"
            heading={
              <Link href="/estimates" aria-label="OpenQuote AU estimates" className="flex h-11 items-center rounded-lg pl-2 sm:pl-4 md:pl-0">
                <Wordmark />
              </Link>
            }
          />
        }
        sideNav={<ActiveSideNav />}
      >
        {/* Bottom room on phones keeps the last row clear of the tab bar. */}
        <div className="mx-auto w-full max-w-[60rem] px-4 pb-[6.5rem] pt-5 sm:px-6 md:px-10 md:pb-10 md:pt-8">
          {children}
        </div>
      </Shell>
      <ActiveTabBar />
    </>
  );
}
