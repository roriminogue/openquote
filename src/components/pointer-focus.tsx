import { useEffect } from "react";

/**
 * Remembers whether the last input was a pointer (mouse, touch, pen) or the keyboard, so focus outlines show only
 * for keyboard users (see `html[data-pointer]` in globals.css).
 */
export function PointerFocus() {
  useEffect(() => {
    const root = document.documentElement;
    const pointer = () => root.setAttribute("data-pointer", "");
    const key = (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.key.startsWith("Arrow") || e.key === "Escape") root.removeAttribute("data-pointer");
    };
    window.addEventListener("pointerdown", pointer, true);
    window.addEventListener("keydown", key, true);
    return () => {
      window.removeEventListener("pointerdown", pointer, true);
      window.removeEventListener("keydown", key, true);
    };
  }, []);
  return null;
}
