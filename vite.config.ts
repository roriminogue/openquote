import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// The whole app is built into dist/ and shipped inside the iPhone app (capacitor.config.ts). There is no server:
// data lives on the phone (src/db) and AI calls go straight from the phone to the provider (src/lib/ai).
//
// The same build is also the Home Screen web version (vercel.json, scripts/deploy-web.sh). Its service worker keeps
// a copy of the whole app on the phone, so after the first visit it opens instantly and with no signal. (Inside the
// iPhone app there's no service worker support, so the worker simply never starts there.)
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script",
      manifest: false, // public/manifest.webmanifest
      workbox: {
        globPatterns: ["**/*.{js,css,html,wasm,png,svg,woff2,webmanifest}"],
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
  // /publik is the relay to publik API (functions/publik): on the live site a Cloudflare function, here a proxy.
  server: {
    port: 5173,
    watch: { ignored: ["**/ios/**", "**/dist/**"] },
    proxy: { "/publik": { target: "https://publikhq.com", changeOrigin: true, rewrite: (p) => p.replace(/^\/publik/, "/api/v1") } },
  },
});
