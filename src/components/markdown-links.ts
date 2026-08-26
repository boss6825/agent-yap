/**
 * Relative `.md` cross-link resolution for the slide renderer.
 *
 * The corpus is authored as a hyperlinked folder of markdown files: chapters
 * link to each other by filename (`chapter-07-retrieval-strategies.md`) and
 * across books by relative path (`../glossary/Glossary.md#embedding`). Nothing
 * in the reader used to rewrite those, so every one of them 404'd.
 *
 * This module maps an authored path back onto the route `src/lib/content.ts`
 * builds for the same file. It only *reads* the content layer (`getBook` /
 * `getChapter`) — `content.ts` is exclusive-access and is not touched here, and
 * the two rules it encodes are mirrored, not re-implemented:
 *
 *   - a book is the directory name directly under `content/`
 *   - a chapter file is `chapter-<n>*.md`, and its slug is that filename with
 *     the leading `chapter-` and the trailing `.md` removed
 *
 * Anything the content layer does not actually serve — a book with no
 * `index.md`, a file named `Chapter 1 - X.md`, a path into a subdirectory —
 * comes back as `unresolved` so the renderer can mark it instead of emitting a
 * route that 404s. Those are the files M3 (content wiring) renames; until then
 * an unresolved link is the honest answer.
 */
import { getBook, getChapter } from "@/lib/content";

/** Where the markdown being rendered lives, so relative paths have an origin. */
export interface MarkdownLinkContext {
  bookSlug: string;
  chapterSlug: string;
}

export type ResolvedMarkdownLink =
  /** `http(s)://…` — opened in a new tab, as before. */
  | { kind: "external"; href: string }
  /** In-page `#anchor`, `mailto:`, or anything that is not a relative `.md`. */
  | { kind: "passthrough"; href: string }
  /** A live reader route, e.g. `/read/<book>/<chapter>/<slide>`. */
  | { kind: "internal"; href: string }
  /** A relative `.md` path no live book serves. */
  | { kind: "unresolved"; target: string };

/* --------------------------------- slugs ---------------------------------- */

/** Strip inline markdown so heading text slugs the way its rendered text would. */
function stripInline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/[*~]/g, "")
    .trim();
}

/**
 * GitHub-flavoured heading slug: lowercase, drop punctuation, whitespace to
 * hyphens. Matches `github-slugger` closely enough for hand-authored anchors —
 * including its quirk of emitting one hyphen per whitespace character, which is
 * why `normalizeSlug` exists as a second-chance lookup.
 */
export function slugifyHeading(text: string): string {
  return stripInline(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

/** Collapse repeated/edge hyphens so near-miss anchors still land. */
function normalizeSlug(slug: string): string {
  return slug.replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
}

/* ----------------------------- anchor → slide ----------------------------- */

/**
 * Every heading in a chapter, mapped to the slide that contains it.
 *
 * A slide is a `##` section, so a `##` heading *is* a slide title while `###`
 * and deeper live inside a slide's markdown. Both are registered; first
 * registration wins, mirroring how a duplicate heading would get a `-1` suffix
 * on GitHub rather than stealing the bare slug.
 */
function buildAnchorMap(bookSlug: string, chapterSlug: string): Map<string, number> {
  const map = new Map<string, number>();
  const chapter = getChapter(bookSlug, chapterSlug);
  if (!chapter) return map;

  const register = (text: string, sectionIndex: number) => {
    const slug = slugifyHeading(text);
    if (!slug) return;
    if (!map.has(slug)) map.set(slug, sectionIndex);
    const normalized = normalizeSlug(slug);
    if (!map.has(normalized)) map.set(normalized, sectionIndex);
  };

  for (const slide of chapter.slides) {
    if (slide.sectionIndex === 0) {
      // The H1 line is dropped by the content layer, so reconstruct both the
      // cleaned title ("Anatomy of an AI Agent") and the authored form
      // ("Chapter 1 — Anatomy of an AI Agent") an anchor may have been cut from.
      register(chapter.title, 0);
      register(`Chapter ${chapter.number} ${chapter.title}`, 0);
    } else {
      register(slide.title, slide.sectionIndex);
    }
    for (const heading of headingsIn(slide.markdown)) {
      register(heading, slide.sectionIndex);
    }
  }

  return map;
}

/** ATX headings outside fenced code (`# comment` lines in bash are not headings). */
function headingsIn(markdown: string): string[] {
  const headings: string[] = [];
  let fence: string | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (fence === null) fence = marker;
      else if (marker === fence) fence = null;
      continue;
    }
    if (fence !== null) continue;

    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (heading) headings.push(heading[1]);
  }

  return headings;
}

/** Build-time memo: `generateStaticParams` renders every slide in one process. */
const anchorMaps = new Map<string, Map<string, number>>();

function anchorMapFor(bookSlug: string, chapterSlug: string): Map<string, number> {
  const key = `${bookSlug}/${chapterSlug}`;
  let map = anchorMaps.get(key);
  if (!map) {
    map = buildAnchorMap(bookSlug, chapterSlug);
    anchorMaps.set(key, map);
  }
  return map;
}

function slideIndexForAnchor(
  bookSlug: string,
  chapterSlug: string,
  anchor: string,
): number | undefined {
  const map = anchorMapFor(bookSlug, chapterSlug);
  const slug = slugifyHeading(decodeSegment(anchor));
  return (
    map.get(slug) ??
    map.get(normalizeSlug(slug)) ??
    // `#term-1` is github-slugger's duplicate suffix, not a distinct heading.
    map.get(normalizeSlug(slug).replace(/-\d+$/, ""))
  );
}

/* -------------------------------- resolution ------------------------------- */

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment; // malformed percent-escape — use it verbatim
  }
}

const HAS_PROTOCOL = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Turn one authored markdown href into something the reader can render.
 * `context` is the file the link was written in; without it nothing relative
 * can be resolved and every href passes through untouched.
 */
export function resolveMarkdownLink(
  href: string | undefined,
  context?: MarkdownLinkContext,
): ResolvedMarkdownLink {
  if (!href) return { kind: "passthrough", href: href ?? "" };
  if (/^https?:\/\//i.test(href)) return { kind: "external", href };

  // In-page anchors, `mailto:`/`tel:`, protocol-relative and site-absolute URLs
  // are all left exactly as they are today.
  if (href.startsWith("#") || href.startsWith("//") || HAS_PROTOCOL.test(href)) {
    return { kind: "passthrough", href };
  }

  const hashAt = href.indexOf("#");
  const anchor = hashAt === -1 ? "" : href.slice(hashAt + 1);
  let pathname = hashAt === -1 ? href : href.slice(0, hashAt);
  const queryAt = pathname.indexOf("?");
  if (queryAt !== -1) pathname = pathname.slice(0, queryAt);

  if (!/\.md$/i.test(pathname)) return { kind: "passthrough", href };
  if (pathname.startsWith("/")) return { kind: "passthrough", href };
  if (!context) return { kind: "passthrough", href };

  // Reported verbatim (path + fragment) so the marked-up link names its target.
  const unresolved: ResolvedMarkdownLink = { kind: "unresolved", target: href };

  // Walk the relative path from the directory the current file sits in —
  // `content/<bookSlug>/`. The content layer is one level deep, so anything
  // that lands anywhere else cannot have a route.
  const segments = pathname.split("/").map(decodeSegment);
  const file = segments.pop();
  if (!file) return unresolved;

  const dirs = [context.bookSlug];
  for (const segment of segments) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      if (dirs.length === 0) return unresolved; // escapes the content root
      dirs.pop();
      continue;
    }
    dirs.push(segment);
  }
  if (dirs.length !== 1) return unresolved;

  const book = getBook(dirs[0]);
  if (!book || book.slides.length === 0) return unresolved;

  // `index.md` is the book front matter, not a chapter — send it to the book.
  if (file.toLowerCase() === "index.md") {
    return { kind: "internal", href: book.slides[0].href };
  }

  // Mirror the content layer's chapter-file rule. `Chapter 1 - X.md` does not
  // match it and stays unresolved until M3 renames those files.
  if (!/^chapter-\d+.*\.md$/.test(file)) return unresolved;
  const chapterSlug = file.replace(/^chapter-/, "").replace(/\.md$/, "");
  const chapter = getChapter(book.slug, chapterSlug);
  if (!chapter || chapter.slides.length === 0) return unresolved;

  const sectionIndex = anchor
    ? slideIndexForAnchor(book.slug, chapterSlug, anchor)
    : undefined;
  const slide = chapter.slides[sectionIndex ?? 0] ?? chapter.slides[0];

  // The fragment is kept so the link stays correct if heading ids ever land;
  // today no heading carries an id, so it is simply inert.
  return { kind: "internal", href: anchor ? `${slide.href}#${anchor}` : slide.href };
}
