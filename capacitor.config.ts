import type { CapacitorConfig } from "@capacitor/cli";

// The iPhone app is a thin native shell around the hosted web app: it loads APP_URL, so a deploy updates the app
// without a reinstall. `mobile/www` is only the offline fallback page.
const APP_URL = process.env.OPENQUOTE_APP_URL ?? "https://openquote-rust.vercel.app";

const config: CapacitorConfig = {
  appId: "com.roriminogue.openquote",
  appName: "OpenQuote",
  webDir: "mobile/www",
  // The web app hides Google sign-in when it sees this (Google blocks sign-in inside embedded web views).
  appendUserAgent: "OpenQuoteApp",
  backgroundColor: "#fcfcfc",
  server: {
    url: APP_URL,
    allowNavigation: [new URL(APP_URL).host],
  },
  ios: {
    contentInset: "never",
    scheme: "OpenQuote",
  },
};

export default config;
