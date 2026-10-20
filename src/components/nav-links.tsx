"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/estimates", label: "Estimates", match: (p: string) => p.startsWith("/estimates") },
  { href: "/settings/ai", label: "Settings", match: (p: string) => p.startsWith("/settings") },
];

/** Reads the URL, so it renders inside Suspense; the fallback is the same links with nothing marked current. */
export function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

export function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main" className="flex h-full items-stretch">
      {links.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center px-2.5 text-[0.9375rem] font-semibold transition-colors sm:px-3 ${
              active ? "text-ink" : "text-ink-3 hover:text-ink"
            }`}
          >
            {l.label}
            {active && <span aria-hidden className="absolute inset-x-2.5 bottom-0 h-[3px] bg-blade sm:inset-x-3" />}
          </Link>
        );
      })}
    </nav>
  );
}
