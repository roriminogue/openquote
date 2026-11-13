import { Capacitor } from "@capacitor/core";
import { registerSW } from "virtual:pwa-register";

/**
 * The web version keeps a copy of the app on the phone so it opens offline (vite.config.ts, VitePWA). This makes sure
 * a new version reaches people quickly: it checks for one when the app opens and whenever it comes back to the
 * front, and reloads onto it as soon as it's downloaded. (Their data isn't touched: it lives in the database.)
 * The iPhone app carries its own copy and updates by reinstalling, so this does nothing there.
 */
export function keepUpToDate() {
  if (Capacitor.isNativePlatform() || !("serviceWorker" in navigator)) return;
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => void registration.update().catch(() => {});
      document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && check());
      setInterval(check, 30 * 60 * 1000);
    },
  });
}
