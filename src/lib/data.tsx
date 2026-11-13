import { createContext, startTransition, use, useContext, useEffect, useState, type ReactNode } from "react";
import { onDatabaseChange } from "@/db";

// Reading data in screens. A loader component calls useQuery(key, fn): the first render suspends (the nearest
// <Suspense> shows its skeleton) and later renders get the answer. After any change to the database every query is
// asked again, inside a transition, so the screen keeps showing the old answer until the new one is ready instead
// of flashing a skeleton. The key must name everything the query depends on (ids, filters).

const VersionContext = createContext(0);
const cache = new Map<string, { version: number; promise: Promise<unknown> }>();

export function DataProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  useEffect(() => onDatabaseChange(() => startTransition(() => setVersion((v) => v + 1))), []);
  return <VersionContext value={version}>{children}</VersionContext>;
}

export function useQuery<T>(key: string, fn: () => Promise<T>): T {
  const version = useContext(VersionContext);
  const id = `${version}|${key}`;
  let entry = cache.get(id);
  if (!entry) {
    entry = { version, promise: fn() };
    cache.set(id, entry);
    // Keep the answers the screen may still be showing (this version and the one before); drop older ones.
    for (const [k, e] of cache) if (e.version < version - 1) cache.delete(k);
  }
  return use(entry.promise) as T;
}

/** Kept for code written against Next.js: screens now re-read their data after any change on their own. */
export function refresh() {}
