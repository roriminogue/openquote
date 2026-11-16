/**
 * The splash in index.html (the logo on the page colour) stays up while the database opens and the first screen
 * loads, then fades out once: when a real screen is on the page (see hideSplashOnFirstScreen), when opening fails,
 * and as a fallback after a few seconds so it can never get stuck.
 */
export function hideSplash() {
  const el = document.getElementById("splash");
  if (!el || el.dataset.hide !== undefined) return;
  el.dataset.hide = "";
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  window.setTimeout(() => el.remove(), reduce ? 0 : 220);
}

/**
 * Hides the splash once a real screen is drawn: one with its main heading (every screen has an h1). Waiting for that,
 * rather than for the router's first render, keeps the splash up through a redirect (a new install goes to
 * "Set up your business") instead of uncovering an in-between frame.
 */
export function hideSplashOnFirstScreen() {
  const root = document.getElementById("root");
  if (!root) return hideSplash();
  const check = () => {
    if (!root.querySelector("h1")) return false;
    observer.disconnect();
    requestAnimationFrame(hideSplash);
    return true;
  };
  const observer = new MutationObserver(() => void check());
  if (!check()) observer.observe(root, { childList: true, subtree: true });
}
