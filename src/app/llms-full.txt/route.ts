import { getBooks } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

// Companion to /llms.txt: the full text of every published chapter, so AI
// assistants can ingest the knowledge base in one request. Slide markdown is
// concatenated per chapter; slide 0 carries the chapter heading.
export function GET(): Response {
  const parts: string[] = [];

  for (const book of getBooks()) {
    parts.push(`# ${book.title}`);
    if (book.description) {
      parts.push(`> ${book.description}`);
    }
    for (const chapter of book.chapters) {
      parts.push("---", `Source: ${absoluteUrl(chapter.href)}`);
      parts.push(chapter.slides.map((slide) => slide.markdown).join("\n\n"));
    }
  }

  return new Response(parts.join("\n\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
