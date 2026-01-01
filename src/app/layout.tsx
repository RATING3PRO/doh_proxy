import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secure DoH Proxy | Fast & Privacy-First DNS",
  description: "High-performance, multi-upstream DNS over HTTPS proxy deployed on Cloudflare Edge. Support for Cloudflare, Google, Quad9, AliDNS, and custom providers.",
  keywords: ["DoH", "DNS over HTTPS", "Proxy", "Cloudflare", "Privacy", "DNS"],
  authors: [{ name: "DoH Proxy" }],
  openGraph: {
    title: "Secure DoH Proxy",
    description: "Fast & Privacy-First DNS over HTTPS Proxy on the Edge",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
