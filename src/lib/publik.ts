import { Capacitor, registerPlugin } from "@capacitor/core";

// Sign in with publik (https://publikhq.com). The app's publik key is provisioned, claimed and kept by the native
// module (ios/App/App/Publik.swift) in the iPhone's Keychain. This file is the web side: it asks the native side
// for the key, so AI calls can use it. In a browser (development) a key can be set by hand in localStorage
// ("oq.publik-key") to try publik API.

type Native = { publikKey(): Promise<{ key: string | null }> };
const native = registerPlugin<Native>("OpenQuoteNative");

export async function publikKey(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      return (await native.publikKey()).key;
    } catch {
      return null;
    }
  }
  try {
    return localStorage.getItem("oq.publik-key");
  } catch {
    return null;
  }
}
