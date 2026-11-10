import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { PointerFocus } from "@/components/pointer-focus";
import { THEME_SCRIPT } from "@/components/theme";
import { Providers } from "./providers";
import "./globals.css";

// One family everywhere. Figtree is a variable font, so every weight comes in a single file.
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "OpenQuote AU", template: "%s · OpenQuote AU" },
  description: "Open-source AI quoting for trades",
  appleWebApp: { capable: true, title: "OpenQuote AU", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  // Draw under the notch and home indicator; the shell pads with env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f10" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html suppressHydrationWarning lang="en-AU" className={`${figtree.variable} h-full`}>
      <head>
        {/* Applies a saved Light or Dark choice before the first paint (see components/theme.tsx). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <PointerFocus />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
