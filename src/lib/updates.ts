import { Capacitor } from "@capacitor/core";
import { registerSW } from "virtual:pwa-register";

declare const __BUILD_ID__: string;

/**
 * The web version keeps a copy of the app on the phone so it opens offline (vite.config.ts, VitePWA). This makes sure
 * a new version reaches people quickly: it checks for one when the app opens and whenever it comes back to the
 * front. (Their data isn't touched: it lives in the database.)
 * The iPhone app carries its own copy and updates by reinstalling, so this does nothing there.
 *
 * The service worker reports "activated" on many cold launches of the Home Screen app even when nothing changed, and
 * the default response, a reload, showed the logo twice. So it only reloads for a real new version (its build id
 * differs), and out of sight: straight away while the launch logo is still up, otherwise the next time the app goes
 * to the background.
 */
export function keepUpToDate() {
  if (Capacitor.isNativePlatform() || !("serviceWorker" in navigator)) return;
  registerSW({
    immediate: true,
    onNeedReload: () => void reloadIfNewer(),
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => void registration.update().catch(() => {});
      document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && check());
      setInterval(check, 30 * 60 * 1000);
    },
  });
}

let reloadPending = false;

async function reloadIfNewer() {
  if (reloadPending) return;
  try {
    const res = await fetch("/version.txt", { cache: "no-store" });
    if (!res.ok || (await res.text()).trim() === __BUILD_ID__) return; // this is already the newest version
  } catch {
    return; // offline: carry on with this one
  }
  reloadPending = true;
  if (document.visibilityState === "hidden" || document.getElementById("splash")) {
    window.location.reload();
    return;
  }
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && window.location.reload());
}
