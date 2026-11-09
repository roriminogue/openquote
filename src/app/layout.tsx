import type { Metadata, Viewport } from "next";
import { Figtree, Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: { default: "OpenQuote", template: "%s · OpenQuote" },
  description: "Open-source AI quoting for trades",
  appleWebApp: { capable: true, title: "OpenQuote", statusBarStyle: "default" },
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
    <html lang="en-AU" className={`${geist.variable} ${figtree.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
