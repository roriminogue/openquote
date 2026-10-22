"use client";

import { useEffect } from "react";

/**
 * Inside the iPhone app: when a sign-in link reopens the app through openquote://auth/callback?code=…, finish the
 * sign-in in the app's own web view (it holds the PKCE verifier from when the link was requested).
 */
export function AppLinks() {
  useEffect(() => {
    const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (!cap?.isNativePlatform?.()) return;
    let remove: (() => void) | undefined;
    import("@capacitor/app").then(({ App }) =>
      App.addListener("appUrlOpen", ({ url }) => {
        const u = new URL(url);
        // A full page load, not client navigation: /auth/callback is a route handler that sets the session cookie.
        if (u.protocol === "openquote:" && u.host === "auth") window.location.assign(new URL(`/auth/callback${u.search}`, window.location.origin).href);
      }).then((h) => (remove = () => h.remove())),
    );
    return () => remove?.();
  }, []);
  return null;
}
