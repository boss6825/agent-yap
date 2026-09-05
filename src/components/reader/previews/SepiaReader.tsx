import { PaperReaderChrome } from "@/components/reader/chrome/PaperReaderChrome";
import type { PaperChapter } from "@/components/reader/chrome/PaperReaderChrome";

const CHAPTERS: PaperChapter[] = [
  {
    number: "01",
    title: "Anatomy of an AI Agent",
    count: "5/7",
    current: true,
    open: true,
    sections: [
      { id: "overview", title: "Overview", state: "active" },
      { id: "what", title: "What is an agent?", state: "visited" },
      { id: "loop", title: "The core loop", state: "visited" },
      { id: "tools", title: "Tools & actions", state: "visited" },
      { id: "memory", title: "Memory & context", state: "visited" },
      { id: "fail", title: "Where agents fail", state: "unvisited" },
      { id: "recap", title: "Chapter recap", state: "unvisited" },
    ],
  },
  { number: "02", title: "The Agent Loop Pattern", count: "7/10" },
  { number: "03", title: "Tool Design", count: "5/13" },
  { number: "04", title: "Model-Provider Abstraction", count: "4/10" },
  { number: "05", title: "Context Engineering & Memory", count: "13" },
  { number: "06", title: "Prompt Architecture", count: "11" },
  { number: "07", title: "Retrieval: RAG vs Tools", count: "8" },
  { number: "08", title: "Streaming and Real-Time", count: "1/12" },
];

/** Static 1440×900 sepia / paper-light reader matching Paper frame 459-0. */
export function SepiaReader() {
  return (
    <div data-reader-theme="sepia" data-reader-family="paper">
      <PaperReaderChrome
        brand="Agent YAP"
        bookTitle={"Architecture & System\nDesign for AI Agents"}
        bookMeta="18 chapters · 199 slides"
        headerChapter={"Chapter 1\u00a0·\u00a0Anatomy of an AI Agent"}
        pageIndex="01 / 199"
        progressWidth="11%"
        progressValue={1}
        progressMax={199}
        chapters={CHAPTERS}
        eyebrow="Chapter 01 · Anatomy of an AI Agent"
        title={"Anatomy of an AI\u00a0Agent"}
        dropCap="B"
        body="efore you can design an agent, you need a clear mental model of its parts. This chapter lays out that anatomy and the vocabulary the rest of the folder uses — every term here recurs throughout, so it's worth getting precise."
        slideMarkers={7}
        currentSlide={0}
      />
    </div>
  );
}
