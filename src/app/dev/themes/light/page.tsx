import type { Metadata } from "next";
import { LightReader } from "@/components/reader/previews/LightReader";

export const metadata: Metadata = {
  title: "Light theme preview",
  robots: { index: false, follow: false },
};

export default function LightThemePreviewPage() {
  return <LightReader />;
}
