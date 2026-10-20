// Money as it reads on the tape: dollars large, cents set back.

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

export function Money({ cents, className = "" }: { cents: number; className?: string }) {
  const m = splitAud(cents);
  return (
    <span className={`figures whitespace-nowrap ${className}`}>
      {m.sign}${m.dollars}
      <span className="text-[0.82em]">.{m.cents}</span>
    </span>
  );
}
