import type { Metadata, Viewport } from "next";
import { Figtree, Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: { default: "OpenQuote", template: "%s · OpenQuote" },
  description: "Open-source AI quoting for trades",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f10" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU" className={`${geist.variable} ${figtree.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
