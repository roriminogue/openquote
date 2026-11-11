"use client";

import { Text } from "@astryxdesign/core/Text";
import { useState } from "react";
import { Money } from "./money";

export type Stage = { id?: string; name: string; cents: number };

/** A neutral ramp, darkest first, with a minimum step so neighbouring stages stay distinct without more hues. */
export function stageShade(i: number, n: number) {
  const step = n <= 1 ? 0 : Math.max(10, 70 / (n - 1));
  const pct = Math.max(14, Math.round(88 - i * step));
  return `color-mix(in oklab, var(--color-text-primary) ${pct}%, var(--color-background-card))`;
}

/**
 * Where the money goes: a thin bar split by stage, with a legend that jumps to each stage. Pointing at a legend
 * row lifts its segment and dims the rest, so the bar and the list read as one thing.
 */
export function Breakdown({ stages, legend = true }: { stages: Stage[]; legend?: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const sum = stages.reduce((s, g) => s + Math.max(0, g.cents), 0);
  if (!stages.length) return <div className="h-1.5 rounded-full bg-(--color-neutral)" aria-hidden />;
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
        <ol className="mt-2 divide-y divide-dashed divide-(--color-border)" onMouseLeave={() => setActive(null)}>
          {stages.map((g, i) => {
            const body = (
              <>
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: stageShade(i, stages.length) }}
                />
                <span className="min-w-0 flex-1">
                  <Text maxLines={1} hasTruncateTooltip={false}>
                    {g.name}
                  </Text>
                </span>
                <Text color="secondary" hasTabularNumbers>
                  {sum > 0 ? Math.round((g.cents / sum) * 100) : 0}%
                </Text>
                <Text weight="medium">
                  <Money cents={g.cents} className="inline-block w-24 text-right" />
                </Text>
              </>
            );
            return (
              <li key={`${i}-${g.name}`} onMouseEnter={() => setActive(i)}>
                {g.id ? (
                  <a
                    href={`#g-${g.id}`}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="-mx-2 flex min-h-11 items-center gap-2.5 rounded-(--radius-element) px-2 transition-colors hover:bg-(--color-overlay-hover)"
                  >
                    {body}
                  </a>
                ) : (
                  <span className="flex min-h-11 items-center gap-2.5">{body}</span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
