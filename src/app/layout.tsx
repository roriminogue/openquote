import type { Metadata, Viewport } from "next";
import { Figtree, Geist } from "next/font/google";
import { PointerFocus } from "@/components/pointer-focus";
import { THEME_SCRIPT } from "@/components/theme";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], weight: ["500", "600"] });

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
    <html suppressHydrationWarning lang="en-AU" className={`${geist.variable} ${figtree.variable} h-full`}>
      <head>
        {/* Applies a saved Light or Dark choice before the first paint (see components/theme.tsx). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <PointerFocus />
        {children}
      </body>
    </html>
  );
}
