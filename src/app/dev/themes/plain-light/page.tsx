import type { Metadata } from "next";
import { PlainLightReader } from "@/components/reader/previews/PlainLightReader";

export const metadata: Metadata = {
  title: "Plain light theme preview",
  robots: { index: false, follow: false },
};

export default function PlainLightThemePreviewPage() {
  return <PlainLightReader />;
}
