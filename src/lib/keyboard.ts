import { Keyboard } from "@capacitor/keyboard";
import { isNative } from "@/db/storage";

/**
 * The iPhone keyboard slides up over the page, and the page doesn't move. iOS would normally pan the whole page up
 * when a field gets focus; the keyboard plugin stops that (capacitor.config.ts). Once the keyboard is up, the web
 * view quietly shrinks to the space above it, out of sight behind the keyboard, so sheets still fit.
 *
 * While the keyboard is up, <html data-keyboard> hides the tab bar (it would otherwise sit on top of the keyboard).
 * The page moves only when the field being typed in would be under the keyboard, and then just far enough to
 * show it.
 */
export function setUpKeyboard() {
  if (!isNative()) return () => {};
  const root = document.documentElement;
  let up = false;

  // Keep the bar with Done (and the arrows between fields): it's the way out of a long description.
  void Keyboard.setAccessoryBarVisible({ isVisible: true }).catch(() => {});

  const listeners = [
    Keyboard.addListener("keyboardWillShow", () => {
      up = true;
      root.setAttribute("data-keyboard", "");
    }),
    Keyboard.addListener("keyboardDidShow", () => reveal()),
    Keyboard.addListener("keyboardWillHide", () => {
      up = false;
      root.removeAttribute("data-keyboard");
    }),
  ];
  // Moving to another field while the keyboard is up (the arrows, or a tap).
  const onFocus = () => up && requestAnimationFrame(() => reveal());
  document.addEventListener("focusin", onFocus);

  return () => {
    document.removeEventListener("focusin", onFocus);
    for (const l of listeners) void l.then((h) => h.remove());
  };
}

const GAP = 16; // room between the field and the keyboard
const TOP = 72; // never push a field's top under the top bar

function reveal() {
  const field = document.activeElement;
  if (!(field instanceof HTMLElement) || !field.matches("input, textarea, select, [contenteditable]")) return;
  const box = field.getBoundingClientRect();
  // The web view now ends at the keyboard's top, so the window's height is the visible height.
  const hidden = box.bottom - (window.innerHeight - GAP);
  if (hidden <= 0) return;
  const by = Math.max(0, Math.min(hidden, box.top - TOP));
  if (by > 0) (scroller(field) ?? window).scrollBy({ top: by, behavior: "smooth" });
}

/** The nearest box that scrolls (a sheet's body), or none for the page itself. */
function scroller(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p);
    if ((overflowY === "auto" || overflowY === "scroll") && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
}
