import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CalcPath — AP Calculus Roadmap",
  description: "A focused, offline-ready roadmap for AP Calculus AB and BC.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "CalcPath — AP Calculus Roadmap",
    description: "Every AP Calculus AB and BC topic, organized into one focused roadmap.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "CalcPath calculus roadmap" }],
  },
  twitter: { card: "summary_large_image", title: "CalcPath — AP Calculus Roadmap", description: "Your path through AP Calculus.", images: ["/og.png"] },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
