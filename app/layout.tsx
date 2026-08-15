import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AccessCheck — Quick Accessibility Site Review",
  description: "A novice-friendly, 25-minute screening tool for common physical accessibility barriers.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "AccessCheck — Quick Accessibility Site Review",
    description: "Notice barriers. Plan better access.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "AccessCheck — Notice barriers. Plan better access." }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
