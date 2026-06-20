import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getBooks,
  getChapter,
  getSlide,
} from "@/lib/content";
import { chapterAccent } from "@/lib/chapter-color";
import { Markdown } from "@/components/Markdown";

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

  const accent = chapterAccent(s.chapterNumber);
  const isIntro = s.sectionIndex === 0;
  const sectionCount = ch.slides.length - 1; // excludes the intro slide

  return (
    <article
      className="w-full max-w-3xl"
      style={{ ["--accent" as string]: accent.hex }}
    >
      {/* kicker */}
      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.18em]">
        <span
          className="rounded px-1.5 py-0.5 font-bold"
          style={{ background: accent.hex, color: accent.on }}
        >
          Ch {String(s.chapterNumber).padStart(2, "0")}
        </span>
        <span className="text-muted">{s.chapterTitle}</span>
        {!isIntro && (
          <span className="text-faint">
            · {s.sectionIndex} / {sectionCount}
          </span>
        )}
      </div>

      {isIntro ? (
        <>
          <p className="mb-3 font-mono text-sm uppercase tracking-[0.3em] text-accent">
            Chapter {s.chapterNumber}
          </p>
          <h1 className="text-balance font-display text-5xl font-bold leading-[1.04] tracking-tight text-paper sm:text-6xl">
            {s.chapterTitle}
          </h1>
          <div className="mt-6 text-lg text-muted">
            <Markdown>{s.markdown}</Markdown>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-balance font-display text-4xl font-bold leading-[1.08] tracking-tight text-paper sm:text-5xl">
            {s.title}
          </h1>
          <div className="mt-6">
            <Markdown>{s.markdown}</Markdown>
          </div>
        </>
      )}
    </article>
  );
}
