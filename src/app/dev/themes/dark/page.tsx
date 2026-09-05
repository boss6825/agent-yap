import type { Metadata } from "next";
import { DarkReader } from "@/components/reader/previews/DarkReader";
import "@/styles/themes/dark.css";

export const metadata: Metadata = {
  title: "Dark theme preview",
  robots: { index: false, follow: false },
};

export default function DarkThemePreviewPage() {
  return <DarkReader />;
}
