import manifest from "@/lib/art-manifest.json";

/**
 * Typed accessor over the generated art manifest (scripts/fetch-art.mjs).
 * Validates each entry defensively so a malformed manifest can never break
 * the reader — a chapter without valid art simply renders without it.
 */
export interface ChapterArt {
  chapterNumber: number;
  artworkId: number;
  title: string;
  artist: string;
  date: string;
  /** Public path under /art/. */
  file: string;
  /** The Met object page (CC0 source; attribution optional but nice). */
  sourceUrl: string;
}

function isChapterArt(value: unknown): value is ChapterArt {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.chapterNumber === "number" &&
    typeof v.artworkId === "number" &&
    typeof v.title === "string" &&
    typeof v.artist === "string" &&
    typeof v.date === "string" &&
    typeof v.file === "string" &&
    v.file.startsWith("/art/") &&
    typeof v.sourceUrl === "string"
  );
}

/**
 * Art for one chapter, keyed by book **and** chapter.
 *
 * The key used to be the chapter slug alone. That was survivable while one
 * book was live and became wrong the moment a second one shipped: two books
 * with a chapter slugged `01-anatomy` would have shared a painting, and
 * whichever book did not own it would have shown the other's.
 *
 * A chapter with no entry returns `undefined`, which the rail renders as no
 * artwork at all. That is the deliberate empty state: only one book has art
 * today, so five of six books take this path on every render, and a borrowed
 * painting would be worse than none.
 */
export function getChapterArt(
  bookSlug: string,
  chapterSlug: string,
): ChapterArt | undefined {
  const chapters = (manifest as { chapters?: Record<string, unknown> }).chapters;
  const entry = chapters?.[`${bookSlug}/${chapterSlug}`];
  return isChapterArt(entry) ? entry : undefined;
}
