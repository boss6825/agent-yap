import type { Metadata } from "next";
import { SepiaReader } from "@/components/reader/previews/SepiaReader";
import "@/styles/themes/sepia.css";

export const metadata: Metadata = {
  title: "Sepia reader",
  robots: { index: false, follow: false },
};

export default function SepiaThemePreviewPage() {
  return <SepiaReader />;
}
