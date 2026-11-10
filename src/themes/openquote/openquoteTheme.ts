// OpenQuote AU's theme: Astryx's neutral look with a hi-vis orange accent.
//
// Everything not named here comes from the neutral theme (Figtree, the grey ramp, radii, motion). After changing
// this file, or after upgrading Astryx, rebuild the stylesheet:
//   npx astryx theme build src/themes/openquote/openquoteTheme.ts

import { defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

const FIGTREE =
  'var(--font-figtree), Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const openquoteTheme = defineTheme({
  name: "openquote",
  extends: neutralTheme,
  tokens: {
    // Each pair is [light, dark].
    "--color-accent": ["#f26b1d", "#f26b1d"],
    // Dark ink on orange: white fails contrast at this brightness, near-black passes comfortably.
    "--color-on-accent": ["#18181b", "#18181b"],
    "--color-accent-muted": ["#ffe6d6", "#3a1f0e"],
    // Orange as text needs to be darker on white and lighter on black to stay readable.
    "--color-text-accent": ["#b93c0a", "#ff9a5c"],
    "--color-icon-accent": ["#c2410c", "#ff9a5c"],

    // Figtree is loaded by next/font in the root layout, which serves it under a generated family name and exposes
    // that name as --font-figtree. Naming "Figtree" directly would miss the self-hosted file.
    "--font-family-body": FIGTREE,
    "--font-family-heading": FIGTREE,
  },
});
