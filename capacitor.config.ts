import type { CapacitorConfig } from "@capacitor/cli";
import { config as loadEnv } from "dotenv";

// The iPhone app is a thin native shell around the hosted web app: it loads APP_URL, so a deploy updates the app
// without a reinstall. `mobile/www` is only the offline fallback page.
// Set OPENQUOTE_APP_URL to your own site, in .env.local or on the command line (see ios/README.md).
loadEnv({ path: ".env.local", quiet: true });
const APP_URL = process.env.OPENQUOTE_APP_URL;
if (!APP_URL) {
  throw new Error("Set OPENQUOTE_APP_URL to your OpenQuote AU site (e.g. https://your-site.vercel.app) in .env.local, then run this again.");
}

const config: CapacitorConfig = {
  appId: process.env.OPENQUOTE_APP_ID ?? "com.example.openquote",
  appName: "OpenQuote AU",
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
    scheme: "OpenQuote AU",
  },
};

export default config;
