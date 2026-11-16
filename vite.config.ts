import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync } from "node:fs";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// The whole app is built into dist/ and shipped inside the iPhone app (capacitor.config.ts). There is no server:
// data lives on the phone (src/db) and AI calls go straight from the phone to the provider (src/lib/ai).
//
// The same build is also the Home Screen web version (vercel.json, scripts/deploy-web.sh). Its service worker keeps
// a copy of the whole app on the phone, so after the first visit it opens instantly and with no signal. (Inside the
// iPhone app there's no service worker support, so the worker simply never starts there.)
// publik's app token (publik-app-token.txt, public by design) also goes into the build, so the iPhone app can read it
// from its bundled web files (ios/App/App/Publik.swift). The web version reads it in lib/publik-web.ts.
const publikToken = (): Plugin => ({
  name: "publik-app-token",
  generateBundle() {
    if (existsSync("publik-app-token.txt"))
      this.emitFile({ type: "asset", fileName: "publik-app-token.txt", source: readFileSync("publik-app-token.txt", "utf8") });
  },
});

// Development only: lets the local preview price jobs with a testing key from .env.local (OQ_DEV_ANTHROPIC_KEY), so
// the whole flow can be tried without typing a key in. Answers this computer only (not phones on the Wi-Fi), and
// doesn't exist in a build. The browser side is in src/lib/ai/keys.ts.
const devAiKey = (): Plugin => ({
  name: "dev-ai-key",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use("/__dev/ai-key", (req, res) => {
      // From this computer, addressed to it by name (not a website re-pointing its own domain at 127.0.0.1, which
      // this middleware would otherwise see before Vite's own host check), and not a request from another site.
      const host = (req.headers.host ?? "").replace(/:\d+$/, "");
      const site = req.headers["sec-fetch-site"];
      const local =
        ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress ?? "") &&
        ["localhost", "127.0.0.1", "[::1]"].includes(host) &&
        (site === undefined || site === "same-origin");
      const key = loadEnv("development", process.cwd(), "OQ_DEV_").OQ_DEV_ANTHROPIC_KEY;
      res.setHeader("cache-control", "no-store");
      if (!local || !key) {
        res.statusCode = 404;
        res.end();
        return;
      }
      res.setHeader("content-type", "text/plain");
      res.end(key);
    });
  },
});

// Each build's id, baked into the app and published as /version.txt, so a running copy can tell whether the site
// has a newer version (src/lib/updates.ts). Not precached: it must come from the network.
const BUILD_ID = Date.now().toString(36);
const buildId = (): Plugin => ({
  name: "build-id",
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "version.txt", source: BUILD_ID });
  },
});

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    buildId(),
    publikToken(),
    devAiKey(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null, // registered in src/main.tsx, which reloads onto a new version as soon as it's ready
      manifest: false, // public/manifest.webmanifest
      workbox: {
        globPatterns: ["**/*.{js,css,html,wasm,png,svg,woff2,webmanifest}"],
        // iOS reads its launch images itself; no need for every phone to download all 22.
        globIgnores: ["splash/**"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: { outDir: "dist", target: "es2022", chunkSizeWarningLimit: 2000 },
  // `npm run dev`, then open the address it prints. --host lets a phone on the same Wi-Fi open it too.
  // The iOS build folders hold thousands of generated files; watching them makes the dev server run out of memory.
  // /publik is the relay to publik API, for development only: the live site no longer has one (the Cloudflare
  // function was removed in the November 2026 security audit, as publik is switched off).
  server: {
    port: 5173,
    watch: { ignored: ["**/ios/**", "**/dist/**"] },
    proxy: { "^/publik/": { target: "https://publikhq.com", changeOrigin: true, rewrite: (p) => p.replace(/^\/publik/, "/api/v1") } },
  },
});
