import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBooks, getChapter, getSlide } from "@/lib/content";
import { chapterDisplayTitle } from "@/lib/display";
import { Markdown } from "@/components/Markdown";
import { SlideContextBridge } from "@/components/reader/SlideContextBridge";

type Params = { book: string; chapter: string; slide: string };

export function generateStaticParams(): Params[] {
  const params: Params[] = [];
  for (const book of getBooks()) {
    for (const chapter of book.chapters) {
      for (const s of chapter.slides) {
        params.push({
          book: book.slug,
          chapter: chapter.slug,
          slide: String(s.sectionIndex),
        });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { book, chapter, slide } = await params;
  const s = getSlide(book, chapter, Number(slide));
  if (!s) return {};
  const title = s.sectionIndex === 0 ? s.chapterTitle : s.title;
  return {
    title: `${title} — ${s.chapterTitle}`,
    description: s.text.slice(0, 155),
  };
}

export default async function SlidePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { book, chapter, slide } = await params;
  const sectionIndex = Number(slide);
  const s = getSlide(book, chapter, sectionIndex);
  const ch = getChapter(book, chapter);
  if (!s || !ch || !Number.isInteger(sectionIndex)) notFound();

  const isIntro = s.sectionIndex === 0;
  const displayTitle = chapterDisplayTitle(s.chapterTitle);
  const eyebrow = `CHAPTER ${String(s.chapterNumber).padStart(2, "0")} · ${displayTitle}`;

  return (
    <article className="reader-slide">
      <SlideContextBridge
        href={s.href}
        title={s.title}
        chapterNumber={s.chapterNumber}
        chapterTitle={displayTitle}
        markdown={s.markdown}
      />
      <p className="slide-kicker">{eyebrow}</p>
      <h1
        className={isIntro ? "slide-title" : "slide-title slide-title--section"}
      >
        {isIntro ? displayTitle : s.title}
      </h1>
      <div className="slide-body">
        <Markdown>{s.markdown}</Markdown>
      </div>
    </article>
  );
}
