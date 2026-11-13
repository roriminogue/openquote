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
  if (!isNative()) return setUpWebKeyboard();
  const root = document.documentElement;
  let up = false;

  // Keep the bar with Done (and the arrows between fields): it's the way out of a long description.
  void Keyboard.setAccessoryBarVisible({ isVisible: true }).catch(() => {});

  const listeners = [
    Keyboard.addListener("keyboardWillShow", () => {
      up = true;
      root.setAttribute("data-keyboard", "");
    }),
    Keyboard.addListener("keyboardDidShow", () => revealIn(window.innerHeight)),
    Keyboard.addListener("keyboardWillHide", () => {
      up = false;
      root.removeAttribute("data-keyboard");
    }),
  ];
  // Moving to another field while the keyboard is up (the arrows, or a tap).
  const onFocus = () => up && requestAnimationFrame(() => revealIn(window.innerHeight));
  document.addEventListener("focusin", onFocus);

  return () => {
    document.removeEventListener("focusin", onFocus);
    for (const l of listeners) void l.then((h) => h.remove());
  };
}

const GAP = 16; // room between the field and the keyboard
const TOP = 72; // never push a field's top under the top bar

/** Scrolls the focused field into view if it's under the keyboard. `visible` is the height above the keyboard. */
function revealIn(visible: number) {
  const field = document.activeElement;
  if (!(field instanceof HTMLElement) || !field.matches("input, textarea, select, [contenteditable]")) return;
  const box = field.getBoundingClientRect();
  const hidden = box.bottom - (visible - GAP);
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

/**
 * The Home Screen web version has no keyboard plugin, so Safari would pan the whole page up whenever a field gets
 * focus, even one well above the keyboard. Instead, a tap on a field that isn't focused yet focuses it without
 * scrolling; the page then moves only if the field would be under the keyboard, and just far enough to show it.
 * Safari shrinks the visible area while the keyboard is up, which is also how the tab bar knows to hide.
 */
function setUpWebKeyboard() {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};
  const root = document.documentElement;
  let up = false;

  const onTouchEnd = (e: TouchEvent) => {
    const field = (e.target as Element | null)?.closest?.("input, textarea, [contenteditable]");
    if (!(field instanceof HTMLElement) || field === document.activeElement || !typesText(field)) return;
    e.preventDefault();
    field.focus({ preventScroll: true });
  };
  const onResize = () => {
    const nowUp = window.innerHeight - viewport.height > 120;
    root.toggleAttribute("data-keyboard", nowUp);
    if (nowUp && !up) requestAnimationFrame(() => revealIn(viewport.height));
    up = nowUp;
  };
  const onFocus = () => up && requestAnimationFrame(() => revealIn(viewport.height));

  document.addEventListener("touchend", onTouchEnd, { passive: false });
  document.addEventListener("focusin", onFocus);
  viewport.addEventListener("resize", onResize);
  return () => {
    document.removeEventListener("touchend", onTouchEnd);
    document.removeEventListener("focusin", onFocus);
    viewport.removeEventListener("resize", onResize);
  };
}

const NOT_TEXT = new Set(["button", "checkbox", "radio", "range", "color", "file", "submit", "reset", "image", "hidden"]);
function typesText(el: HTMLElement) {
  if (el instanceof HTMLInputElement) return !el.disabled && !el.readOnly && !NOT_TEXT.has(el.type);
  if (el instanceof HTMLTextAreaElement) return !el.disabled && !el.readOnly;
  return el.isContentEditable;
}
