import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { SideNav, SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav";
import { FileText, FolderOpen, Plus, Settings, Users, type LucideIcon } from "lucide-react";
import Link from "@/lib/link";
import { usePathname } from "@/lib/navigation";

type NavLink = { href: string; label: string; icon: LucideIcon; section?: string };

const NEW = "/estimates/new";

const work: NavLink[] = [
  { href: "/estimates", label: "Estimates", icon: FileText },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/clients", label: "Clients", icon: Users },
];

// Settings opens on Business, the first of its tabs; any settings page keeps the item lit.
const settings: NavLink = { href: "/settings/business", label: "Settings", icon: Settings, section: "/settings" };

function isActive(pathname: string, l: NavLink) {
  // Writing a new estimate lights the New button, not the Estimates list.
  return pathname.startsWith(l.section ?? l.href) && !(l.href === "/estimates" && pathname.startsWith(NEW));
}

/** Sidebar for wide screens. Reads the URL, so it renders inside Suspense. */
export function ActiveSideNav() {
  return <SideNavLinks pathname={usePathname()} />;
}

/** Tab bar for phones. Reads the URL, so it renders inside Suspense. */
export function ActiveTabBar() {
  return <TabBar pathname={usePathname()} />;
}

/** The sidebar for a known path; with an empty path it is also the Suspense fallback. */
export function SideNavLinks({ pathname }: { pathname: string }) {
  const item = (l: NavLink) => (
    <SideNavItem
      key={l.href}
      label={l.label}
      href={l.href}
      icon={l.icon}
      isSelected={isActive(pathname, l)}
    />
  );
  return (
    <SideNav
      topContent={<Button label="New estimate" variant="primary" icon={<Icon icon={Plus} />} href={NEW} width="100%" />}
      footer={item(settings)}
    >
      <SideNavSection title="Work">{work.map(item)}</SideNavSection>
    </SideNav>
  );
}

/**
 * The phone's tab bar: two places either side of New, which is the one thing a tradie opens the app to do. It sits
 * above the home indicator and stays out of print. Hidden from 768px, where the sidebar takes over.
 */
export function TabBar({ pathname }: { pathname: string }) {
  const tab = (l: NavLink) => {
    const on = isActive(pathname, l);
    return (
      <Link
        key={l.href}
        href={l.href}
        aria-current={on ? "page" : undefined}
        className={`flex h-14 min-w-0 flex-col items-center justify-center gap-1 text-[0.6875rem] leading-none outline-offset-[-4px] transition-colors ${
          on ? "font-semibold text-(--color-text-primary)" : "font-medium text-(--color-text-secondary)"
        }`}
      >
        <l.icon aria-hidden className="size-[22px]" strokeWidth={on ? 2.25 : 1.75} />
        <span className="max-w-full truncate px-1">{l.label}</span>
      </Link>
    );
  };
  const creating = pathname.startsWith(NEW);

  return (
    <nav
      aria-label="Main"
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-(--color-border) bg-(--color-background-surface) pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-center px-1">
        {tab(work[0])}
        {tab(work[1])}
        <Link
          href={NEW}
          aria-current={creating ? "page" : undefined}
          className="mx-auto grid size-12 place-items-center rounded-full bg-(--color-accent) text-(--color-on-accent) shadow-(--shadow-low) outline-offset-2 transition-transform active:scale-95"
        >
          <Plus aria-hidden className="size-6" strokeWidth={2.5} />
          <span className="sr-only">New estimate</span>
        </Link>
        {tab(work[2])}
        {tab(settings)}
      </div>
    </nav>
  );
}
