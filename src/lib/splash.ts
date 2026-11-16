/**
 * The splash in index.html (the logo on the page colour, matching iOS's launch image) stays up while the database
 * opens and the first screen loads, then fades out once. Called when the first screen has been drawn, when opening
 * fails, and as a fallback after a few seconds so it can never get stuck.
 */
export function hideSplash() {
  const el = document.getElementById("splash");
  if (!el || el.dataset.hide !== undefined) return;
  el.dataset.hide = "";
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  window.setTimeout(() => el.remove(), reduce ? 0 : 220);
}
