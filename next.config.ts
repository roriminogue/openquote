import type { NextConfig } from "next";

// Sent with every page. Framing is blocked everywhere, so no other site can show OpenQuote (say, a quote's Accept
// button) inside a hidden frame. Quote links carry their token in the path, so they never send a referrer.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/p/:token*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
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
