import type { Metadata } from "next";
import { Gelasio, Source_Sans_3 } from "next/font/google";
import "@/styles/themes/sepia-dark.css";
import { SepiaDarkReader } from "@/components/reader/previews/SepiaDarkReader";

const display = Gelasio({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-sepia-preview-serif",
  display: "swap",
});

const ui = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-sepia-preview-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sepia dark reader",
  description:
    "Warm dark paper-family preview of the Agent YAP slide reader.",
  robots: { index: false, follow: false },
};

export default function SepiaDarkThemePage() {
  return (
    <div
      className={`sd-frame ${display.variable} ${ui.variable}`}
      data-theme="sepia-dark"
      data-theme-family="sepia"
      data-reader-theme="sepia-dark"
      data-reader-family="paper"
    >
      <SepiaDarkReader />
    </div>
  );
}
