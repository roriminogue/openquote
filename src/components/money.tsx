// Money in tabular figures, cents set back a touch so the dollars read first.

const dollars = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });

export function splitAud(cents: number) {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  return {
    sign: negative ? "−" : "",
    dollars: dollars.format(Math.floor(abs / 100)),
    cents: String(abs % 100).padStart(2, "0"),
  };
}

/**
 * `quiet` sets the cents back in the secondary text colour; leave it off where the figure is already secondary, so
 * contrast holds. Size, weight and colour come from the surrounding text unless `className` says otherwise.
 */
export function Money({ cents, className = "", quiet = true }: { cents: number; className?: string; quiet?: boolean }) {
  const m = splitAud(cents);
  return (
    <span className={`whitespace-nowrap tabular-nums ${className}`}>
      {m.sign}${m.dollars}
      <span className={quiet ? "text-[0.85em] text-(--color-text-secondary)" : ""}>.{m.cents}</span>
    </span>
  );
}
