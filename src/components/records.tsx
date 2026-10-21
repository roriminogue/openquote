import { Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Input, PageTitle, type Tone } from "./ui";

// Small shared pieces for the Projects and Clients pages.

export const STATUS_LABEL: Record<string, string> = {
  quoting: "Quoting",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<string, Tone> = {
  quoting: "accent",
  active: "neutral",
  on_hold: "muted",
  completed: "muted",
  cancelled: "muted",
};

/** Project status as a dot and a word. Orange marks work still being priced; everything else stays grey. */
export function StatusPill({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{STATUS_LABEL[status] ?? status}</Badge>;
}

/** GET search form: the query lives in the URL so results can be shared and survive a refresh. */
export function SearchBox({ q, placeholder, children }: { q: string; placeholder: string; children?: ReactNode }) {
  return (
    <form role="search" className="relative w-full">
      {children}
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
      <Input type="search" name="q" defaultValue={q} placeholder={placeholder} aria-label={placeholder} className="pl-9" autoComplete="off" />
    </form>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return <PageTitle title={title} description={description} action={action} />;
}

/** Filters as text tabs on a hairline: the current one is ink with an underline, counts sit beside each. */
export function FilterTabs({ items, label }: { items: { href: string; label: string; count?: number; on: boolean }[]; label: string }) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-5 border-b border-border">
        {items.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              aria-current={t.on ? "page" : undefined}
              className={`relative -mb-px flex h-11 items-center gap-1.5 border-b-2 text-sm font-medium transition-colors sm:h-9 ${
                t.on ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink"
              }`}
            >
              {t.label}
              <span className="figures text-caption text-ink-4">{t.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** An open table shared by the record lists: a grey header over a hairline, rows split by hairlines. */
export function ListFrame({ header, children }: { header?: ReactNode; children: ReactNode }) {
  return (
    <div className="-mx-3">
      {header}
      <ul className="divide-y divide-border border-b border-border">{children}</ul>
    </div>
  );
}

/** Header row classes for a ListFrame. */
export const listHeader = "hidden h-10 items-center gap-x-4 border-b border-border px-3 text-sm font-medium text-ink-3 md:grid";
/** Row link classes for a ListFrame. */
export const listRow = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-lg px-3 py-3 transition-colors hover:bg-hover/60";

export function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
