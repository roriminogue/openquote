"use client";

import { useEffect, useState } from "react";
import { Money } from "./money";

/**
 * A slim case strip under the header that appears once the main reading has scrolled away and leaves again when
 * the Totals block arrives, so exactly one reading is on screen while checking lines. It sits above the content
 * like the header does, never over the amount column mid-page.
 */
export function StickyReading({
  watch,
  until,
  title,
  cents,
  label,
}: {
  watch: string;
  until: string;
  title: string;
  cents: number;
  label: string;
}) {
  const [pastReading, setPastReading] = useState(false);
  const [atTotals, setAtTotals] = useState(false);

  useEffect(() => {
    const reading = document.getElementById(watch);
    const totals = document.getElementById(until);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === reading) setPastReading(!e.isIntersecting && e.boundingClientRect.top < 0);
        if (e.target === totals) setAtTotals(e.isIntersecting || e.boundingClientRect.top < 0);
      }
    });
    if (reading) io.observe(reading);
    if (totals) io.observe(totals);
    return () => io.disconnect();
  }, [watch, until]);

  const show = pastReading && !atTotals;

  return (
    <div
      aria-hidden={!show}
      className={`sticky top-14 z-10 -mx-4 h-0 overflow-visible transition-opacity duration-150 ease-out ${show ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <div className="flex items-center justify-between gap-4 bg-case px-4 py-2 text-on-case">
        <span className="min-w-0 truncate text-[0.9375rem] font-semibold">{title}</span>
        <span className="flex shrink-0 items-baseline gap-2.5">
          <span className="label hidden text-on-case/70 sm:inline">{label}</span>
          <Money cents={cents} className="text-[1.25rem] font-bold" />
        </span>
      </div>
    </div>
  );
}
