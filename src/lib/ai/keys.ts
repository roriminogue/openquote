import { Capacitor, registerPlugin } from "@capacitor/core";
import type { Provider } from "./providers";

// AI keys typed into Settings → AI. On the iPhone app they live in the Keychain (encrypted by iOS, never in the
// database or a backup file), through the app's own native plugin (ios/App/App/OpenQuoteNative.swift). In the web
// version (the Home Screen app) they're in this site's localStorage on the phone: never in the database or a backup,
// and the Content-Security-Policy (public/_headers) only lets the page talk to this site and the AI providers, so
// nothing on the page could send the key anywhere else.

type Native = {
  getSecret(o: { key: string }): Promise<{ value: string | null }>;
  setSecret(o: { key: string; value: string }): Promise<void>;
  deleteSecret(o: { key: string }): Promise<void>;
};

const native = registerPlugin<Native>("OpenQuoteNative");
const slot = (provider: Provider) => `ai-key.${provider}`;

export async function getApiKey(provider: Provider): Promise<string | null> {
  if (Capacitor.isNativePlatform()) return (await native.getSecret({ key: slot(provider) })).value || null;
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(`oq.${slot(provider)}`);
  } catch {
    // no storage: fall through
  }
  if (saved) return saved;
  // Local development only (vite.config.ts devAiKey): a testing key from .env.local when none is saved. The whole
  // branch is removed from builds.
  if (import.meta.env.DEV && provider === "anthropic") return devKey();
  return null;
}

let devKeyPromise: Promise<string | null> | null = null;
function devKey() {
  devKeyPromise ??= fetch("/__dev/ai-key")
    .then((r) => (r.ok ? r.text() : null))
    .catch(() => null);
  return devKeyPromise;
}

export async function setApiKey(provider: Provider, value: string) {
  if (Capacitor.isNativePlatform()) return native.setSecret({ key: slot(provider), value });
  localStorage.setItem(`oq.${slot(provider)}`, value);
}

export async function deleteApiKey(provider: Provider) {
  if (Capacitor.isNativePlatform()) return native.deleteSecret({ key: slot(provider) });
  localStorage.removeItem(`oq.${slot(provider)}`);
}

export const lastFour = (key: string) => key.trim().slice(-4);
