// OpenQuote AU's theme: Astryx's neutral look with a hi-vis orange accent.
//
// Everything not named here comes from the neutral theme (Figtree, the grey ramp, radii, motion). After changing
// this file, or after upgrading Astryx, rebuild the stylesheet:
//   npx astryx theme build src/themes/openquote/openquoteTheme.ts

import { defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

const FIGTREE =
  'var(--font-figtree), Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const PHONE = {
  "--size-element-sm": "36px",
  "--size-element-md": "44px",
  "--size-element-lg": "48px",
  "--font-size-xs": "0.6875rem",
  "--font-size-sm": "0.8125rem",
  "--font-size-base": "1rem",
  "--font-size-lg": "1.125rem",
};

export const openquoteTheme = defineTheme({
  name: "openquote",
  extends: neutralTheme,
  tokens: {
    // Each pair is [light, dark].
    // Hi-vis orange, tuned for the label on it: near-black ink reaches 7:1 (AAA), so "Price this job" reads in sun.
    "--color-accent": ["#fa7d21", "#fa7d21"],
    // Dark ink on orange: white fails contrast at this brightness, near-black passes comfortably.
    "--color-on-accent": ["#111111", "#111111"],
    "--color-accent-muted": ["#ffe6d6", "#3a1f0e"],
    // Orange as text needs to be darker on white and lighter on black to stay readable.
    // (≥5.5:1 on white and on the orange tint in light; ≥6:1 on every dark surface.)
    "--color-text-accent": ["#a8350a", "#ff9a5c"],
    "--color-icon-accent": ["#b93c0a", "#ff9a5c"],

    // Dark mode text: off-white instead of pure white (no glow on dark grey, still 12:1+), and a lighter grey for
    // secondary text so it holds 6:1+ on cards too (Neutral's #9e9e9e fell to 4.9:1 on a raised card).
    "--color-text-primary": ["#000000", "#f2f2f2"],
    "--color-text-secondary": ["#474747", "#b4b4b4"],

    // Figtree ships inside the app (@fontsource-variable/figtree, imported in main.tsx) as "Figtree Variable", and
    // src/app/fonts.css names it --font-figtree.
    "--font-family-body": FIGTREE,
    "--font-family-heading": FIGTREE,
  },
  // The app is used on a phone, in one hand, on site. Under 768px (and on any touch screen) controls grow to a
  // thumb-sized 44px and body text to 16px, which also stops iOS zooming the page when a field takes focus.
  adaptations: {
    rules: [
      { when: { width: { below: "md" } }, value: { tokens: PHONE } },
      { when: { pointer: "coarse" }, value: { tokens: PHONE } },
    ],
  },
});
