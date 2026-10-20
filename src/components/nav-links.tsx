"use client";

import { FileText, FolderOpen, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/estimates", label: "Estimates", icon: FileText },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings/ai", label: "Settings", icon: Settings, section: "/settings" },
];

const isActive = (pathname: string, l: (typeof links)[number]) => pathname.startsWith(l.section ?? l.href);

/** Reads the URL, so it renders inside Suspense; the fallback is the same links with nothing marked current. */
export function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

export function ActiveBottomNav() {
  return <BottomNav pathname={usePathname()} />;
}

/** Top-bar navigation from 640px up. */
export function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main" className="hidden h-full items-stretch sm:flex">
      {links.map((l) => {
        const active = isActive(pathname, l);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center px-3 text-[0.9375rem] font-semibold transition-colors ${
              active ? "text-ink" : "text-ink-3 hover:text-ink"
            }`}
          >
            {l.label}
            {active && <span aria-hidden className="absolute inset-x-3 bottom-0 h-[3px] bg-blade" />}
          </Link>
        );
      })}
    </nav>
  );
}

/** Phones: a bottom tab bar within thumb reach, clear of the home indicator. */
export function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface-2/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:hidden"
    >
      <ul className="grid grid-cols-4">
        {links.map((l) => {
          const active = isActive(pathname, l);
          const Icon = l.icon;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[0.75rem] font-semibold transition-colors ${
                  active ? "text-ink" : "text-ink-3"
                }`}
              >
                {active && <span aria-hidden className="absolute inset-x-5 top-0 h-[3px] bg-blade" />}
                <Icon className="size-[1.375rem]" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
