import { splitAud } from "./money";

export type BladeSegment = { name: string; cents: number };

/**
 * The tape: a graduated yellow blade whose stage segments are as long as their share of the money, ending in the
 * case window that shows the reading. `extent` (0–1) lets the blade run out while an estimate is still streaming.
 */
export function Blade({
  segments,
  totalCents,
  caption,
  extent = 1,
  live = false,
}: {
  segments: BladeSegment[];
  totalCents: number;
  caption: string;
  extent?: number;
  live?: boolean;
}) {
  const sum = segments.reduce((s, g) => s + Math.max(0, g.cents), 0);
  const reading = splitAud(totalCents);

  return (
    <figure className="m-0">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-stretch sm:gap-0">
        {/* Blade */}
        <div className="relative min-h-16 flex-1 sm:min-h-0">
          <div
            className="graduations absolute inset-y-0 left-0 flex overflow-hidden rounded-tape bg-blade transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:left-auto sm:right-0 sm:rounded-r-none"
            style={{ width: `${Math.max(0.04, Math.min(1, extent)) * 100}%` }}
          >
            {segments.map((g, i) => (
              <div
                key={`${i}-${g.name}`}
                className="@container relative h-full min-w-7 border-r-2 border-on-blade last:border-r-0"
                style={{ flexGrow: sum > 0 ? Math.max(g.cents, sum * 0.015) : 1, flexBasis: 0 }}
                title={g.name}
              >
                <span className="absolute bottom-1.5 left-1.5 right-1 flex items-baseline gap-1.5 text-on-blade">
                  <span className="figures text-[0.9375rem] font-bold leading-none">{i + 1}</span>
                  <span className="label hidden truncate text-[0.6875rem] @[7.5rem]:block">{g.name}</span>
                </span>
              </div>
            ))}
            {live && <span aria-hidden className="absolute inset-y-0 right-0 w-1 animate-pulse bg-on-blade/70" />}
          </div>
        </div>

        {/* Case window */}
        <div className="flex items-baseline justify-between gap-4 rounded-tape bg-case px-4 py-3 text-on-case sm:min-w-[15rem] sm:flex-col sm:items-end sm:justify-center sm:rounded-l-none">
          <span className="label text-on-case/70">{caption}</span>
          <span className="figures text-[2.5rem] font-bold leading-none tracking-[-0.01em] sm:text-[3.25rem]" aria-live={live ? "polite" : undefined}>
            {reading.sign}${reading.dollars}
            <span className="text-[0.5em] text-blade">.{reading.cents}</span>
          </span>
        </div>
      </div>
    </figure>
  );
}

/** A 6px blade for list rows: same proportions, no labels. */
export function MiniBlade({ segments, share = 1 }: { segments: BladeSegment[]; share?: number }) {
  const sum = segments.reduce((s, g) => s + Math.max(0, g.cents), 0);
  if (!segments.length) return <div className="h-1.5 rounded-sm bg-hairline" aria-hidden />;
  return (
    <div
      className="flex h-1.5 overflow-hidden rounded-sm bg-blade"
      style={{ width: `${Math.max(0.06, Math.min(1, share)) * 100}%` }}
      aria-hidden
    >
      {segments.map((g, i) => (
        <span
          key={i}
          className="h-full border-r border-on-blade/80 last:border-r-0"
          style={{ flexGrow: sum > 0 ? Math.max(g.cents, sum * 0.02) : 1, flexBasis: 0 }}
        />
      ))}
    </div>
  );
}
