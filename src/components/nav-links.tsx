"use client";

import { FileText, FolderOpen, Plus, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const main = [
  { href: "/estimates", label: "Estimates", icon: FileText },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/clients", label: "Clients", icon: Users },
];
const settings = { href: "/settings/ai", label: "Settings", icon: Settings, section: "/settings" };

type NavLink = (typeof main)[number] & { section?: string };

// /estimates/new is its own task, not the list.
const isActive = (pathname: string, l: NavLink) =>
  pathname.startsWith(l.section ?? l.href) && !(l.href === "/estimates" && pathname.startsWith("/estimates/new"));

/** Reads the URL, so it renders inside Suspense; the fallback is the same links with nothing marked current. */
export function ActiveSidebarNav() {
  return <SidebarNav pathname={usePathname()} />;
}

export function ActiveBottomNav() {
  return <BottomNav pathname={usePathname()} />;
}

function SidebarLink({ link, pathname }: { link: NavLink; pathname: string }) {
  const active = isActive(pathname, link);
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={`flex h-7 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink transition-colors ${
        active ? "bg-hover" : "hover:bg-hover/70"
      }`}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      {link.label}
    </Link>
  );
}

const newEstimate: NavLink = { href: "/estimates/new", label: "New estimate", icon: Plus };

/** Sidebar navigation from 768px up: the way to start work first, the work grouped under a label, Settings at the foot. */
export function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main" className="flex flex-1 flex-col pt-1">
      <SidebarLink link={newEstimate} pathname={pathname} />
      <p className="mb-1.5 mt-6 px-2 text-xs font-medium text-label">Work</p>
      <ul className="space-y-0.5">
        {main.map((l) => (
          <li key={l.href}>
            <SidebarLink link={l} pathname={pathname} />
          </li>
        ))}
      </ul>
      <div className="mt-auto border-b border-border pb-3">
        <SidebarLink link={settings} pathname={pathname} />
      </div>
    </nav>
  );
}

/** Phones: a bottom tab bar with New in the middle, clear of the home indicator. */
export function BottomNav({ pathname }: { pathname: string }) {
  const tabs = [main[0], main[1], null, main[2], settings];
  const creating = pathname.startsWith("/estimates/new");
  return (
    <nav
      aria-label="Main"
      className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {tabs.map((l) => {
          if (!l)
            return (
              <li key="new" className="flex items-center justify-center">
                <Link
                  href="/estimates/new"
                  aria-current={creating ? "page" : undefined}
                  className="flex size-12 items-center justify-center rounded-[14px] border border-primary bg-linear-to-b from-primary-top to-primary text-on-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.16)] transition-transform active:scale-95"
                >
                  <Plus className="size-6" strokeWidth={2.25} aria-hidden />
                  <span className="sr-only">New estimate</span>
                </Link>
              </li>
            );
          const active = isActive(pathname, l);
          const Icon = l.icon;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-2xs transition-colors ${
                  active ? "font-medium text-ink" : "text-ink-3"
                }`}
              >
                <Icon className="size-[1.375rem]" strokeWidth={active ? 2.1 : 1.6} aria-hidden />
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
