import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "./ui";

// Small shared pieces for the Projects and Clients pages.

export const STATUS_LABEL: Record<string, string> = {
  quoting: "Quoting",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Status as printed on the tape: condensed caps, with yellow reserved for work that's live. */
export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "bg-blade text-on-blade"
      : status === "quoting"
        ? "bg-blade-wash text-ink"
        : status === "completed"
          ? "bg-surface-2 text-ok"
          : "bg-surface-2 text-ink-3";
  return <span className={`label inline-flex h-6 items-center rounded-tape px-2 text-[0.75rem] ${tone}`}>{STATUS_LABEL[status] ?? status}</span>;
}

/** GET search form: the query lives in the URL so results can be shared and survive a refresh. */
export function SearchBox({ q, placeholder, children }: { q: string; placeholder: string; children?: ReactNode }) {
  return (
    <form role="search" className="relative">
      {children}
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-ink-3" aria-hidden />
      <Input type="search" name="q" defaultValue={q} placeholder={placeholder} aria-label={placeholder} className="pl-10" autoComplete="off" />
    </form>
  );
}

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.01em]">{title}</h1>
      {action}
    </div>
  );
}

export function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
