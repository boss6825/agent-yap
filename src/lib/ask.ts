import Anthropic from "@anthropic-ai/sdk";

import { searchSlides, type SearchResult } from "@/lib/search";

export interface Citation {
  chapterNumber: number;
  chapterTitle: string;
  title: string;
  href: string;
}

export interface AskResponse {
  answer: string;
  citations: Citation[];
  configured: boolean;
}

const DEFAULT_MODEL = "claude-sonnet-4-6";
const RETRIEVAL_LIMIT = 6;

function toCitation(result: SearchResult): Citation {
  return {
    chapterNumber: result.chapterNumber,
    chapterTitle: result.chapterTitle,
    title: result.title,
    href: result.href,
  };
}

function dedupeCitations(results: SearchResult[]): Citation[] {
  const seen = new Set<string>();
  const citations: Citation[] = [];

  for (const result of results) {
    if (seen.has(result.href)) continue;
    seen.add(result.href);
    citations.push(toCitation(result));
  }

  return citations;
}

function buildContext(results: SearchResult[]): string {
  return results
    .map((result, index) => {
      const slide = result.slide;

      return [
        `Source ${index + 1}`,
        `Chapter: ${slide.chapterNumber}. ${slide.chapterTitle}`,
        `Section: ${slide.title}`,
        `URL: ${slide.href}`,
        slide.markdown,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

function textFromMessage(content: Anthropic.Message["content"]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export async function answerQuestion(question: string): Promise<AskResponse> {
  const results = searchSlides(question, RETRIEVAL_LIMIT);
  const citations = dedupeCitations(results);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      answer:
        "Ask the docs is not configured yet. Add `ANTHROPIC_API_KEY` to the environment to enable AI answers. In the meantime, the citations below point to the most relevant sections I found.",
      citations,
      configured: false,
    };
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  const context = buildContext(results);
  const message = await client.messages.create({
    model,
    max_tokens: 800,
    temperature: 0.2,
    system:
      "Answer only from the provided Agent YAP knowledge-base context. Be concise and practical. If the answer is not in the context, say so. Never invent facts or cite sources that are not provided.",
    messages: [
      {
        role: "user",
        content: [
          "Use the context below to answer the question in grounded markdown.",
          "",
          "<context>",
          context || "No relevant slides were retrieved.",
          "</context>",
          "",
          `<question>${question}</question>`,
        ].join("\n"),
      },
    ],
  });

  return {
    answer:
      textFromMessage(message.content) ||
      "I could not generate an answer from the retrieved context.",
    citations,
    configured: true,
  };
}
