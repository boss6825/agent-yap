import type { Metadata } from "next";
import { getShelfData } from "@/lib/shelf";
import { Library } from "@/components/Library";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Every Agent YAP subject: architecture and system design, context engineering, agentic memory, agentic RAG, multi-agent systems, and coding agent harnesses.",
};

export default function ReadIndex() {
  return <Library shelf={getShelfData()} />;
}
