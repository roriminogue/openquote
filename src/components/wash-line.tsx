"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A line the AI just wrote: it sits on a yellow wash until it has been on screen for a moment, then settles.
 * The wash is state, not a timer, so it also shows with reduced motion (only the fade is dropped).
 */
export function WashLine({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLLIElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(([entry]) => {
      clearTimeout(timer);
      if (entry.isIntersecting) timer = setTimeout(() => setSeen(true), 1500);
    }, { threshold: 0.9 });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <li ref={ref} className={`transition-colors duration-700 ease-out ${seen ? "bg-transparent" : "bg-blade-wash"} ${className}`}>
      {children}
    </li>
  );
}
