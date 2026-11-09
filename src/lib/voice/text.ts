// Text handling for voice input (pure, for tests): joining dictated words onto what's already typed, spotting
// which words the tidy-up changed, and refusing a tidy-up that rewrote too much.

/** Adds dictated text after what's already in the box, with one space (or a new line kept) between them. */
export function joinSpoken(before: string, spoken: string): string {
  const s = spoken.trim();
  if (!s) return before;
  const b = before.replace(/[ \t]+$/, "");
  if (!b) return s;
  return /\n$/.test(b) ? b + s : `${b} ${s}`;
}

// Keeps "1.8" and "H4" whole; drops a full stop that ends a sentence.
const words = (text: string) => (text.toLowerCase().match(/[\p{L}\p{N}×.'-]+/gu) ?? []).map((w) => w.replace(/\.+$/, "")).filter(Boolean);

/** Words in the tidied text that weren't in what was heard, in order and without repeats (for "Fixed: …"). */
export function changedWords(heard: string, tidied: string, max = 4): string[] {
  const before = new Set(words(heard));
  const out: string[] = [];
  for (const raw of tidied.match(/[\p{L}\p{N}×.'-]+/gu) ?? []) {
    const w = raw.replace(/[.]+$/, "");
    // Numbers and units written as digits ("4 × 3 m") aren't worth pointing out.
    if (!w || /^[\d.,×x]+$/i.test(w) || /^(m|mm|cm|m²|m2|kg|l|lm|ea)$/i.test(w)) continue;
    if (before.has(w.toLowerCase()) || out.some((o) => o.toLowerCase() === w.toLowerCase())) continue;
    out.push(w);
    if (out.length === max) break;
  }
  return out;
}

/**
 * A tidy-up should fix misheard words, not rewrite the job. Accept it only when it's a similar length and keeps
 * most of the original words.
 */
export function tidyLooksSafe(heard: string, tidied: string): boolean {
  const h = heard.trim();
  const t = tidied.trim();
  if (!t) return false;
  const ratio = t.length / Math.max(h.length, 1);
  if (ratio < 0.6 || ratio > 1.6) return false;
  const original = words(h);
  if (original.length < 4) return true;
  const kept = new Set(words(t));
  const keptShare = original.filter((w) => kept.has(w)).length / original.length;
  return keptShare >= 0.5;
}
