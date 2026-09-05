import type { Metadata } from "next";
import "@/styles/themes/sepia-dark.css";
import { SepiaDarkReader } from "@/components/reader/previews/SepiaDarkReader";

export const metadata: Metadata = {
  title: "Sepia dark reader",
  description:
    "Warm dark paper-family preview of the Agent YAP slide reader.",
};

export default function SepiaDarkThemePage() {
  return <SepiaDarkReader />;
}
