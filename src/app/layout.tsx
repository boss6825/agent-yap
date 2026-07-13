import type { Metadata } from "next";
import "./globals.css";

const SITE = "Agent YAP";
const TAGLINE =
  "RAG, context engineering, memory, orchestration, and coding agent internals. Taught at the depth practitioners actually need.";

export const metadata: Metadata = {
  title: {
    default: `${SITE} — Understand agents from the inside`,
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
    title: `${SITE} — Understand agents from the inside`,
    description: TAGLINE,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE} — Understand agents from the inside`,
    description: TAGLINE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}
