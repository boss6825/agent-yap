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
  const sectionCount = ch.slides.length - 1; // excludes the intro slide
  const displayTitle = chapterDisplayTitle(s.chapterTitle);
  // Origin for the relative `.md` cross-links authored inside this chapter.
  const linkContext = { bookSlug: s.bookSlug, chapterSlug: s.chapterSlug };

  return (
    <article className="w-full max-w-[720px]">
      {/* publish this slide's content to the client chrome (chat grounding) */}
      <SlideContextBridge
        href={s.href}
        title={s.title}
        chapterNumber={s.chapterNumber}
        chapterTitle={displayTitle}
        markdown={s.markdown}
      />
      {/* kicker */}
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.10em] text-ink-2">
        Chapter {String(s.chapterNumber).padStart(2, "0")} · {displayTitle}
        {!isIntro && (
          <span className="font-normal">
            {" "}
            · {s.sectionIndex} / {sectionCount}
          </span>
        )}
      </p>

      {isIntro ? (
        <>
          <h1 className="mb-7 font-display text-[clamp(34px,5.6vw,48px)] font-semibold leading-[1.08] tracking-[-0.01em] text-ink [text-wrap:pretty]">
            {displayTitle}
          </h1>
          <Markdown context={linkContext}>{s.markdown}</Markdown>
        </>
      ) : (
        <>
          <h1 className="mb-7 font-display text-[clamp(30px,5vw,40px)] font-semibold leading-[1.12] tracking-[-0.01em] text-ink [text-wrap:pretty]">
            {s.title}
          </h1>
          <Markdown context={linkContext}>{s.markdown}</Markdown>
        </>
      )}
    </article>
  );
}
