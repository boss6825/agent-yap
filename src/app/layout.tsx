import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const SITE = "Agent YAP";
const TAGLINE =
  "A slide-by-slide field guide to architecting and designing AI agents.";

export const metadata: Metadata = {
  title: {
    default: `${SITE} — Designing AI Agents`,
    template: `%s · ${SITE}`,
  },
  description: TAGLINE,
  applicationName: SITE,
  keywords: [
    "AI agents",
    "agent architecture",
    "system design",
    "LLM",
    "tool design",
    "RAG",
    "context engineering",
  ],
  openGraph: {
    title: `${SITE} — Designing AI Agents`,
    description: TAGLINE,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE} — Designing AI Agents`,
    description: TAGLINE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-paper">{children}</body>
    </html>
  );
}
