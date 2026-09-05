import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";
import "@/styles/themes/tokens.css";
import "@/styles/themes/reader.css";
import "@/styles/themes/sepia-family.css";
import "@/styles/themes/sepia-light.css";
import "@/styles/themes/sepia-dark.css";
import "@/styles/themes/light.css";
import "@/styles/themes/plain-dark.css";

const SITE = "Agent YAP";
const TAGLINE =
  "RAG, context engineering, memory, orchestration, and coding agent internals. Taught at the depth practitioners actually need.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    url: "/",
    siteName: SITE,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE} — Understand agents from the inside`,
    description: TAGLINE,
  },
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <script
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}
