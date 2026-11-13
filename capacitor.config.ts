import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });

// The iPhone app carries the whole of OpenQuote AU: `npm run ios` builds the screens into dist/ and copies them into
// the Xcode project. Nothing is loaded from a website, so it works with no signal (AI quotes still need one).
const config: CapacitorConfig = {
  appId: process.env.OPENQUOTE_APP_ID ?? "com.example.openquote",
  appName: "OpenQuote AU",
  webDir: "dist",
  backgroundColor: "#ffffff",
  ios: {
    contentInset: "never",
    scheme: "OpenQuote AU",
  },
  plugins: {
    // The keyboard slides up over the page instead of iOS panning the page up (see src/lib/keyboard.ts).
    Keyboard: { resize: KeyboardResize.Native },
  },
};

export default config;
