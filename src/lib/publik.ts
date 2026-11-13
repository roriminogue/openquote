import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { webConfigured, webEnsureSignedIn, webPress, webPublikKey, webSetChoice } from "./publik-web";

// Sign in with publik (https://publikhq.com). The native module (ios/App/App/Publik.swift) provisions this install's
// publik key, runs the sign-in gate and keeps the key; its screens are drawn by <PublikGate> (components/publik-gate.tsx)
// in the app's own design. The web version runs the same gate in lib/publik-web.ts. The gate only runs once the build
// carries a publik app token, which publik issues when the app is listed; until then the app runs on the person's own
// AI key (Settings → AI).

export type PublikScreen = {
  id: "sign_in" | "unreachable" | "choose" | "done";
  title?: string;
  body?: string;
  note?: string | null;
  buttons?: { action: string; label: string }[];
};

type Native = {
  publikStatus(): Promise<{ configured: boolean; provisioned: boolean; choice: string | null }>;
  publikStart(): Promise<{ signedIn: boolean; configured: boolean; choice?: string | null; handle?: string | null }>;
  publikPress(o: { action: string | null }): Promise<void>;
  publikKey(): Promise<{ key: string | null }>;
  publikSetChoice(o: { choice: string | null }): Promise<void>;
  addListener(event: "publikScreen", fn: (screen: PublikScreen) => void): Promise<PluginListenerHandle>;
};
const native = registerPlugin<Native>("OpenQuoteNative");

const onPhone = () => Capacitor.isNativePlatform();

/** Whether this build can sign in with publik (it has publik's app token). */
export async function publikConfigured(): Promise<boolean> {
  if (!onPhone()) return webConfigured();
  try {
    return (await native.publikStatus()).configured;
  } catch {
    return false;
  }
}

/** The key for publik API, when the person chose to pay with their publik plan. */
export async function publikKey(): Promise<string | null> {
  if (onPhone()) {
    try {
      return (await native.publikKey()).key;
    } catch {
      return null;
    }
  }
  return webPublikKey();
}

/** Runs the gate; `onScreen` gets each screen to draw. Resolves once signed in (or straight away if not configured). */
export async function runPublikGate(onScreen: (s: PublikScreen) => void) {
  if (!onPhone()) return webEnsureSignedIn(onScreen);
  const handle = await native.addListener("publikScreen", onScreen);
  try {
    return await native.publikStart();
  } finally {
    await handle.remove();
  }
}

export const pressPublik = (action: string | null) => (onPhone() ? native.publikPress({ action }) : Promise.resolve(webPress(action)));

/** Settings → AI: pay with the publik plan, use my own key, or ask again on the next start. */
export const setPublikChoice = (choice: "publik" | "own_key" | null) =>
  onPhone() ? native.publikSetChoice({ choice }) : Promise.resolve(webSetChoice(choice));
