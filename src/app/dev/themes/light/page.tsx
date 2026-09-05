import type { Metadata } from "next";
import { PlainLightReader } from "@/components/reader/previews/PlainLightReader";

export const metadata: Metadata = {
  title: "Light theme preview",
  robots: { index: false, follow: false },
};

export default function LightThemePreviewPage() {
  return <PlainLightReader />;
}
