import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://access-checkup.netlify.app"),
  title: "AccessCheckUp — Quick Accessibility Check-ups",
  description: "Guided preliminary check-ups for physical, event, and digital accessibility.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "AccessCheckUp — Quick Accessibility Check-ups",
    description: "Notice barriers. Create more welcoming experiences.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "AccessCheckUp — Quick accessibility check-ups." }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
