// Daily cap on AI estimates that use the install's shared key (pure, for tests). A business using its own key pays
// for it directly, so it isn't capped; the cap stops one account on a shared install running up the owner's bill.

export const DEFAULT_DAILY_LIMIT = 100;

/** AI_DAILY_LIMIT: a whole number of estimates per business per 24 hours, or "0" for no limit. */
export function dailyLimit(raw: string | undefined): number | null {
  const v = raw?.trim();
  if (!v) return DEFAULT_DAILY_LIMIT;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) return DEFAULT_DAILY_LIMIT;
  return n === 0 ? null : n;
}

export function overLimit(usedLast24h: number, limit: number | null): boolean {
  return limit !== null && usedLast24h >= limit;
}
