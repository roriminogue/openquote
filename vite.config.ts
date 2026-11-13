import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The whole app is built into dist/ and shipped inside the iPhone app (capacitor.config.ts). There is no server:
// data lives on the phone (src/db) and AI calls go straight from the phone to the provider (src/lib/ai).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: { outDir: "dist", target: "es2022", chunkSizeWarningLimit: 2000 },
  // `npm run dev`, then open the address it prints. --host lets a phone on the same Wi-Fi open it too.
  // The iOS build folders hold thousands of generated files; watching them makes the dev server run out of memory.
  server: { port: 5173, watch: { ignored: ["**/ios/**", "**/dist/**"] } },
});
