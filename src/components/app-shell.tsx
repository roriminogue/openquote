import type { ReactNode } from "react";
import { AppShell as Shell } from "@astryxdesign/core/AppShell";
import { TopNav } from "@astryxdesign/core/TopNav";
import { getMember } from "@/lib/auth";
import { useQuery } from "@/lib/data";
import Link from "@/lib/link";
import { AccountMenu } from "./account-menu";
import { ActiveSideNav, ActiveTabBar } from "./nav-links";
import { Wordmark } from "./wordmark";

export { Mark, Wordmark } from "./wordmark";

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
            endContent={<Account />}
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

function Account() {
  const member = useQuery("member", getMember);
  if (!member) return null;
  return <AccountMenu name={member.name || "You"} />;
}
