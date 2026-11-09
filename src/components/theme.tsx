"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Segmented } from "@/components/record-forms";

// Appearance: follow the device, or always light / always dark. Saved on this device only (localStorage), and
// applied before the first paint by THEME_SCRIPT in the root layout, so there's no flash of the wrong theme.

export type ThemeChoice = "system" | "light" | "dark";
const KEY = "oq-theme";

/** Runs in <head> before anything paints. Kept tiny and dependency-free. A client's quote (/p/…) is always light:
 * it's a document, and should look like paper on the client's phone whatever their setting. */
export const THEME_SCRIPT = `try{var t=location.pathname.indexOf("/p/")===0?"light":localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

function read(): ThemeChoice {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

const listeners = new Set<() => void>();
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function apply(choice: ThemeChoice) {
  const root = document.documentElement;
  try {
    if (choice === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {
    // Private browsing: the choice still applies to this page.
  }
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
  listeners.forEach((fn) => fn());
}

const OPTIONS = [
  ["system", "System", Monitor],
  ["light", "Light", Sun],
  ["dark", "Dark", Moon],
] as const;

export function ThemeSwitch() {
  const choice = useSyncExternalStore(subscribe, read, () => "system" as ThemeChoice);
  return <Segmented value={choice} onChange={apply} options={OPTIONS} className="w-full sm:w-80" />;
}
