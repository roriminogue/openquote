import { Capacitor, registerPlugin } from "@capacitor/core";
import type { Provider } from "./providers";

// AI keys typed into Settings → AI. On the iPhone they live in the Keychain (encrypted by iOS, never in the database
// or a backup file), through the app's own native plugin (ios/App/App/OpenQuoteNative.swift). In a browser
// (development only) they fall back to localStorage.

type Native = {
  getSecret(o: { key: string }): Promise<{ value: string | null }>;
  setSecret(o: { key: string; value: string }): Promise<void>;
  deleteSecret(o: { key: string }): Promise<void>;
};

const native = registerPlugin<Native>("OpenQuoteNative");
const slot = (provider: Provider) => `ai-key.${provider}`;

export async function getApiKey(provider: Provider): Promise<string | null> {
  if (Capacitor.isNativePlatform()) return (await native.getSecret({ key: slot(provider) })).value || null;
  try {
    return localStorage.getItem(`oq.${slot(provider)}`);
  } catch {
    return null;
  }
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
