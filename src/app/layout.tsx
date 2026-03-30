import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secure DoH Proxy | Fast & Privacy-First DNS",
  description: "High-performance, multi-upstream DNS over HTTPS proxy deployed on Cloudflare Edge. Support for Cloudflare, Google, AliDNS, DNSPod, and custom providers.",
  keywords: ["DoH", "DNS over HTTPS", "Proxy", "Cloudflare", "Privacy", "DNS"],
  authors: [{ name: "DoH Proxy", url: "https://github.com/RATING3PRO/doh_proxy" }],
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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
