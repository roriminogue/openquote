"use client";

import { useState } from "react";
import { Money } from "./money";

export type Stage = { id?: string; name: string; cents: number };

/** A neutral ramp, darkest first, with a minimum step so neighbouring stages stay distinct without more hues. */
export function stageShade(i: number, n: number) {
  const step = n <= 1 ? 0 : Math.max(10, 70 / (n - 1));
  const pct = Math.max(14, Math.round(88 - i * step));
  return `color-mix(in oklab, var(--ink) ${pct}%, var(--bg))`;
}

/**
 * Where the money goes: a thin bar split by stage, with a legend that jumps to each stage. Pointing at a legend
 * row lifts its segment and dims the rest, so the bar and the list read as one thing.
 */
export function Breakdown({ stages, legend = true }: { stages: Stage[]; legend?: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const sum = stages.reduce((s, g) => s + Math.max(0, g.cents), 0);
  if (!stages.length) return <div className="h-2 rounded-full bg-hover" aria-hidden />;
  return (
    <div>
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {stages.map((g, i) => (
          <span
            key={`${i}-${g.name}`}
            className="h-full transition-opacity duration-150 first:rounded-l-full last:rounded-r-full"
            style={{
              flexGrow: sum > 0 ? Math.max(g.cents, sum * 0.012) : 1,
              flexBasis: 0,
              background: stageShade(i, stages.length),
              opacity: active === null || active === i ? 1 : 0.25,
            }}
          />
        ))}
      </div>
      {legend && (
        <ol className="mt-3 divide-y divide-dashed divide-border" onMouseLeave={() => setActive(null)}>
          {stages.map((g, i) => {
            const body = (
              <>
                <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: stageShade(i, stages.length) }} />
                <span className="min-w-0 flex-1 truncate text-ink">{g.name}</span>
                <span className="figures shrink-0 text-ink-3">{sum > 0 ? Math.round((g.cents / sum) * 100) : 0}%</span>
                <Money cents={g.cents} className="w-24 shrink-0 text-right font-medium text-ink" />
              </>
            );
            return (
              <li key={`${i}-${g.name}`} onMouseEnter={() => setActive(i)}>
                {g.id ? (
                  <a
                    href={`#g-${g.id}`}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="-mx-2 flex h-10 items-center gap-2.5 rounded-md px-2 text-sm transition-colors hover:bg-hover"
                  >
                    {body}
                  </a>
                ) : (
                  <span className="flex h-10 items-center gap-2.5 text-sm">{body}</span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
