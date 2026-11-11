// The OpenQuote AU logo. Kept apart from the app shell so sign-in and setup, which show only the logo, don't
// load the shell's navigation and menus.

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
