import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Let phones on the same Wi-Fi load the dev server, e.g. DEV_ORIGINS=192.168.4.20 in .env.local.
  allowedDevOrigins: process.env.DEV_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean),
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
