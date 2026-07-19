import { getBooks } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

// llms.txt convention (https://llmstxt.org): a concise, LLM-friendly index of
// the site so AI assistants can discover and cite the knowledge base.
export function GET(): Response {
  const lines: string[] = [
    "# Agent YAP",
    "",
    "> A public, slide-by-slide field guide to architecting and designing AI agents: RAG, context engineering, memory, orchestration, and coding agent internals, taught at the depth practitioners actually need.",
    "",
    "Each chapter is served as a sequence of one-page slides. A chapter link below points at its first slide; the reader pages through the rest.",
    "",
  ];

  for (const book of getBooks()) {
    lines.push(`## ${book.title}`, "");
    if (book.description) {
      lines.push(`> ${book.description}`, "");
    }
    for (const chapter of book.chapters) {
      lines.push(`- [${chapter.title}](${absoluteUrl(chapter.href)}): ${chapter.blurb}`);
    }
    lines.push("");
  }

  lines.push(
    "## Optional",
    "",
    `- [Full content](${absoluteUrl("/llms-full.txt")}): the complete text of every published chapter in one markdown file`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
