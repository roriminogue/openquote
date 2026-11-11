import type { MetadataRoute } from "next";

// Lets people "Add to Home Screen" and get OpenQuote AU as a full-screen app with its own icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OpenQuote AU",
    short_name: "OpenQuote AU",
    description: "AI quoting for trades: describe a job, get a priced estimate with your own rates.",
    start_url: "/estimates",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
