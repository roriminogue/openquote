"use client";

import { EllipsisVertical, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** The signed-in person: an initials tile and their email, with sign out behind a small menu. */
export function AccountMenu({ email, compact = false }: { email: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className={`relative ${compact ? "" : "mt-2"}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={
          compact
            ? "-mr-2 flex size-11 items-center justify-center rounded-lg hover:bg-hover"
            : "flex h-9 w-full items-center gap-2 rounded-lg px-1.5 text-left transition-colors hover:bg-hover"
        }
      >
        <span
          aria-hidden
          className="flex size-5 shrink-0 items-center justify-center rounded-md bg-hover text-[0.625rem] font-medium text-ink-2"
        >
          {initials}
        </span>
        {!compact && (
          <>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{email}</span>
            <EllipsisVertical className="size-4 shrink-0 text-ink-3" aria-hidden />
          </>
        )}
        <span className="sr-only">Account menu for {email}</span>
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-30 min-w-48 rounded-[10px] bg-bg p-1 shadow-raised ${compact ? "right-0 top-12" : "bottom-11 left-0 right-0"}`}
        >
          <p className="truncate px-2 py-1.5 text-xs text-ink-3">{email}</p>
          <form action="/auth/signout" method="post">
            <button
              role="menuitem"
              className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm text-ink hover:bg-hover sm:h-8"
            >
              <LogOut className="size-4 text-ink-3" aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
