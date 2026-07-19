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

export function getChapterArt(chapterSlug: string): ChapterArt | undefined {
  const chapters = (manifest as { chapters?: Record<string, unknown> }).chapters;
  const entry = chapters?.[chapterSlug];
  return isChapterArt(entry) ? entry : undefined;
}
