/**
 * Content layer — the single source of truth for the knowledge base.
 *
 * Markdown lives in `content/<book>/`. Every book folder has the same shape:
 * an `index.md` (typed frontmatter, then an H1 title and a `>` description) and
 * `chapter-NN-*.md` files beside it. Anything else in the folder (`sources/`,
 * a nested `glossary/`) is never parsed. Every chapter is split into
 * "slides": one intro slide (the text under the H1, before the first H2) plus
 * one slide per `##` section. Slides are flattened into a single ordered list
 * per book so the reader can move left/right across the whole book.
 *
 * This module is server-only (it reads the filesystem). It is imported by the
 * statically-generated reader pages AND by the API routes (search + ask), so
 * the parsing logic is never duplicated.
 *
 * ## Subjects
 *
 * The site serves several subjects, not one book. `index.md` frontmatter is
 * what groups them: `track` names the shelf section, `order` sorts within and
 * across sections, `featured` promotes a book to the top row, and `accent`
 * picks its card tint. Adding a subject is a folder plus that block: no code
 * change, which is the whole point of keeping the layout uniform.
 */
import fs from "node:fs";
import path from "node:path";

/** Card tints the shelf knows how to render. Unknown values fall back. */
export const ACCENTS = [
  "teal",
  "violet",
  "rose",
  "amber",
  "sky",
  "indigo",
  "slate",
] as const;
export type Accent = (typeof ACCENTS)[number];

/** Every key the frontmatter block understands. Unknown keys are ignored. */
export interface Frontmatter {
  /** Overrides the H1 as the display title. */
  title?: string;
  /** One short line under the title on a shelf card. */
  tagline?: string;
  /** Shelf section this book belongs to, e.g. "Context, Memory, and Retrieval". */
  track?: string;
  /** Sort key within a track, and (by a track's minimum) between tracks. */
  order?: number;
  /** Card tint. */
  accent?: Accent;
  /** Promote to the featured row on the landing page and the library. */
  featured?: boolean;
  /**
   * Names the markdown file holding this entry's body, which makes the folder
   * a single-page *reference* instead of a chaptered book. See `Reference`.
   */
  body?: string;
}

function unquote(value: string): string {
  const t = value.trim();
  const quoted =
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"));
  return quoted ? t.slice(1, -1) : t;
}

/**
 * Minimal typed frontmatter: a leading `---` block of `key: value` lines.
 *
 * Deliberately not YAML. The corpus is hand-authored markdown and the only
 * shapes it needs are strings, numbers and booleans, so a dependency-free
 * splitter keeps `content/` readable and the build honest. A file with no
 * `---` block parses exactly as it did before this existed.
 */
export function parseFrontmatter(raw: string): {
  data: Frontmatter;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { data: {}, body: raw };

  const data: Frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const kv = trimmed.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    const value = unquote(kv[2]);
    switch (kv[1]) {
      case "title":
        if (value) data.title = value;
        break;
      case "tagline":
        if (value) data.tagline = value;
        break;
      case "track":
        if (value) data.track = value;
        break;
      case "order": {
        const n = Number(value);
        if (Number.isFinite(n)) data.order = n;
        break;
      }
      case "accent":
        if ((ACCENTS as readonly string[]).includes(value)) {
          data.accent = value as Accent;
        }
        break;
      case "featured":
        if (value === "true") data.featured = true;
        else if (value === "false") data.featured = false;
        break;
      case "body":
        if (value) data.body = value;
        break;
    }
  }
  return { data, body: raw.slice(match[0].length) };
}

export interface Slide {
  /** Globally unique id, e.g. "architecture-and-system-design/01-anatomy/2". */
  id: string;
  bookSlug: string;
  chapterSlug: string;
  chapterNumber: number;
  chapterTitle: string;
  /** 0 = chapter intro slide; 1..n = the `##` sections in order. */
  sectionIndex: number;
  /** Slide heading shown large in the UI. */
  title: string;
  /** Markdown body of this slide (heading line excluded). */
  markdown: string;
  /** Plain text of the slide, for search indexing / snippets. */
  text: string;
  /** Canonical route for this slide. */
  href: string;
  /** Position in the book-wide flat ordering (0-based). */
  globalIndex: number;
}

export interface Chapter {
  bookSlug: string;
  slug: string;
  number: number;
  title: string;
  /** First sentence/paragraph of the intro, for chapter cards. */
  blurb: string;
  slides: Slide[];
  /** Route to the first slide of the chapter. */
  href: string;
  /** Frontmatter `order`, when a book departs from its filename numbering. */
  order?: number;
}

/** A subject: one book folder under `content/`. */
export interface Book {
  slug: string;
  title: string;
  /** The `>` blockquote in `index.md`: a paragraph of prose. */
  description: string;
  /** The frontmatter `tagline`: one line, sized for a card. */
  tagline: string;
  /** Shelf section. Books without a `track` collect under "Other". */
  track: string;
  /** Shelf sort key. Books without an `order` sort last, then by slug. */
  order?: number;
  accent: Accent;
  featured: boolean;
  chapters: Chapter[];
  /** All slides across all chapters, in reading order. */
  slides: Slide[];
  /** Route to the first slide, i.e. where "Start learning" goes. */
  startHref: string;
}

/**
 * A single-page reference: a folder with an `index.md` whose frontmatter names
 * a `body` file, and no chapters.
 *
 * The glossary is why this exists. Its entries are `###` definitions, so the
 * one-slide-per-`##` rule would collapse sixty terms onto a single slide, and
 * 159 cross-book links already point at it. It needs a route, not a reader.
 */
export interface Reference {
  slug: string;
  title: string;
  description: string;
  tagline: string;
  track: string;
  accent: Accent;
  order?: number;
  /** Body markdown, frontmatter stripped. */
  markdown: string;
  /** Headings in the body, i.e. how many things this page defines. */
  entryCount: number;
  href: string;
}

/** One section of the shelf: a track label and what sits under it. */
export interface Track {
  /** The `track` value, used verbatim as the section heading. */
  name: string;
  books: Book[];
  references: Reference[];
}

/**
 * Resolve the content directory. `process.cwd()` is correct when Next is
 * started from the project root, but Turbopack can evaluate this module from
 * more than one bundled copy — a wrong cwd on the first hit used to cache an
 * empty book list forever and 404 every slide while `/` still worked.
 */
function resolveContentRoot(): string {
  const fromCwd = path.join(process.cwd(), "content");
  if (fs.existsSync(fromCwd)) return fromCwd;

  // Walk up from cwd in case the process was started from a subdirectory.
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
    const candidate = path.join(dir, "content");
    if (fs.existsSync(candidate)) return candidate;
  }
  return fromCwd;
}

/* ----------------------------- markdown helpers ---------------------------- */

/** Rough markdown → plain text, good enough for lexical search and snippets. */
export function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → text
    .replace(/^>\s?/gm, "") // blockquote markers
    .replace(/^#{1,6}\s+/gm, "") // heading hashes
    .replace(/^[-*+]\s+/gm, "") // list bullets
    .replace(/^\d+\.\s+/gm, "") // ordered list markers
    .replace(/[*_~]/g, "") // emphasis markers
    .replace(/\|/g, " ") // table pipes
    .replace(/\s+/g, " ")
    .trim();
}

/** The `>` line in an `index.md`: the entry's one-paragraph description. */
const BLOCKQUOTE_RE = /^>\s?(.*)$/m;

function firstHeading(markdown: string, level: 1 | 2): string | null {
  const re = new RegExp(`^#{${level}}\\s+(.*)$`, "m");
  const m = markdown.match(re);
  return m ? m[1].trim() : null;
}

/** "Chapter 1 — Anatomy of an AI Agent" → "Anatomy of an AI Agent". */
function cleanChapterTitle(h1: string): string {
  const m = h1.match(/^Chapter\s+\d+\s*[—–-]\s*(.+)$/i);
  return (m ? m[1] : h1).trim();
}

interface RawSection {
  title: string;
  markdown: string;
}

/**
 * Split a chapter's markdown into an intro section plus one section per `##`.
 * The H1 line is dropped (its text becomes the chapter/intro title).
 */
function splitIntoSections(markdown: string, chapterTitle: string): RawSection[] {
  const lines = markdown.split(/\r?\n/);
  const sections: RawSection[] = [];

  let current: RawSection = { title: chapterTitle, markdown: "" };
  let buffer: string[] = [];
  let seenH1 = false;

  const flush = () => {
    current.markdown = buffer.join("\n").trim();
    sections.push(current);
    buffer = [];
  };

  for (const line of lines) {
    if (!seenH1 && /^#\s+/.test(line)) {
      seenH1 = true; // drop the H1 line itself
      continue;
    }
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      flush();
      current = { title: h2[1].trim(), markdown: "" };
      continue;
    }
    buffer.push(line);
  }
  flush();

  // Drop an empty leading intro (chapter that opens straight into a `##`).
  return sections.filter((s, i) => i > 0 || s.markdown.length > 0);
}

/* ------------------------------- book loading ------------------------------ */

/** Shared across Turbopack route bundles so one empty miss can't poison slides. */
const globalForContent = globalThis as typeof globalThis & {
  __agentYapBooks?: Book[] | null;
};

function loadBooks(): Book[] {
  if (globalForContent.__agentYapBooks?.length) {
    return globalForContent.__agentYapBooks;
  }

  const contentRoot = resolveContentRoot();
  const books: Book[] = [];
  if (!fs.existsSync(contentRoot)) {
    // Do not cache a miss — cwd/root can recover on the next request.
    return books;
  }

  const bookDirs = fs
    .readdirSync(contentRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const bookSlug of bookDirs) {
    const dir = path.join(contentRoot, bookSlug);
    const indexPath = path.join(dir, "index.md");
    if (!fs.existsSync(indexPath)) continue;

    const indexRaw = fs.readFileSync(indexPath, "utf8");
    const { data: meta, body: indexMd } = parseFrontmatter(indexRaw);
    const title = meta.title ?? firstHeading(indexMd, 1) ?? bookSlug;
    const blockquote = indexMd.match(BLOCKQUOTE_RE);
    const description = (blockquote ? blockquote[1] : firstParagraph(indexMd)).trim();

    const chapterFiles = fs
      .readdirSync(dir)
      .filter((f) => /^chapter-\d+.*\.md$/.test(f))
      .sort();

    // index.md alone is not enough — skip folders that aren't reader books yet
    // (e.g. research papers index without chapter-NN-*.md files).
    if (chapterFiles.length === 0) continue;

    const chapters: Chapter[] = [];
    const bookSlides: Slide[] = [];
    let globalIndex = 0;

    for (const file of chapterFiles) {
      const numberMatch = file.match(/^chapter-(\d+)/);
      const chapterNumber = numberMatch ? parseInt(numberMatch[1], 10) : 0;
      const chapterSlug = file.replace(/^chapter-/, "").replace(/\.md$/, "");

      const { data: chapterMeta, body: md } = parseFrontmatter(
        fs.readFileSync(path.join(dir, file), "utf8"),
      );
      const h1 =
        chapterMeta.title ?? firstHeading(md, 1) ?? `Chapter ${chapterNumber}`;
      const chapterTitle = cleanChapterTitle(h1);
      const sections = splitIntoSections(md, chapterTitle);

      const slides: Slide[] = sections.map((section, sectionIndex) => {
        const href = `/read/${bookSlug}/${chapterSlug}/${sectionIndex}`;
        const slide: Slide = {
          id: `${bookSlug}/${chapterSlug}/${sectionIndex}`,
          bookSlug,
          chapterSlug,
          chapterNumber,
          chapterTitle,
          sectionIndex,
          title: section.title,
          markdown: section.markdown,
          text: toPlainText(section.markdown),
          href,
          globalIndex: 0, // handed out below, in final chapter order
        };
        return slide;
      });

      const blurb = firstSentence(slides[0]?.text ?? "");
      chapters.push({
        bookSlug,
        slug: chapterSlug,
        number: chapterNumber,
        title: chapterTitle,
        blurb,
        slides,
        href: slides[0]?.href ?? `/read/${bookSlug}/${chapterSlug}/0`,
        order: chapterMeta.order,
      });
    }

    // Sort first, number second. `NavChapter` addresses a chapter as a
    // half-open range into the flat slide list, so `globalIndex` has to be
    // handed out in final reading order: numbering during the read loop and
    // sorting afterwards would point every range at the wrong slides.
    chapters.sort(compareChapters);
    for (const chapter of chapters) {
      for (const slide of chapter.slides) {
        slide.globalIndex = globalIndex++;
        bookSlides.push(slide);
      }
    }

    books.push({
      slug: bookSlug,
      title,
      description,
      tagline: meta.tagline ?? description,
      track: meta.track ?? OTHER_TRACK,
      order: meta.order,
      accent: meta.accent ?? "slate",
      featured: meta.featured === true,
      chapters,
      slides: bookSlides,
      startHref: bookSlides[0]?.href ?? `/read/${bookSlug}`,
    });
  }

  books.sort(compareBooks);

  if (books.length > 0) {
    globalForContent.__agentYapBooks = books;
  }
  return books;
}

/**
 * How many things a reference defines: its deepest recurring heading level.
 *
 * The glossary uses `###` per term, but a reference is free to use `##`, so
 * counting one fixed level would report zero for half of them. Counting the
 * deepest level that actually recurs gets the entries and not the section
 * headers above them.
 */
function countEntries(markdown: string): number {
  const byLevel = new Map<number, number>();
  for (const line of markdown.split(/\r?\n/)) {
    const m = line.match(/^(#{2,4})\s+\S/);
    if (!m) continue;
    const level = m[1].length;
    byLevel.set(level, (byLevel.get(level) ?? 0) + 1);
  }
  if (byLevel.size === 0) return 0;
  const deepest = Math.max(...byLevel.keys());
  return byLevel.get(deepest) ?? 0;
}

/** Where entries with no `track` collect, so nothing silently disappears. */
const OTHER_TRACK = "Other";

const globalForReferences = globalThis as typeof globalThis & {
  __agentYapReferences?: Reference[] | null;
};

/**
 * Load every single-page reference. Same folder scan as `loadBooks`, opposite
 * test: a reference has a `body` in its frontmatter, a book has chapter files.
 * A folder with neither (`content/research papers/`) stays unpublished, which
 * is the behaviour it has always had.
 */
function loadReferences(): Reference[] {
  if (globalForReferences.__agentYapReferences?.length) {
    return globalForReferences.__agentYapReferences;
  }

  const contentRoot = resolveContentRoot();
  const references: Reference[] = [];
  if (!fs.existsSync(contentRoot)) return references;

  for (const entry of fs.readdirSync(contentRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(contentRoot, entry.name);
    const indexPath = path.join(dir, "index.md");
    if (!fs.existsSync(indexPath)) continue;

    const { data: meta, body: indexMd } = parseFrontmatter(
      fs.readFileSync(indexPath, "utf8"),
    );
    if (!meta.body) continue;

    const bodyPath = path.join(dir, meta.body);
    if (!fs.existsSync(bodyPath)) {
      console.warn(
        `[content] ${entry.name}/index.md names body "${meta.body}", which does not exist. Skipping.`,
      );
      continue;
    }

    const title = meta.title ?? firstHeading(indexMd, 1) ?? entry.name;
    const blockquote = indexMd.match(BLOCKQUOTE_RE);
    const description = (
      blockquote ? blockquote[1] : firstParagraph(indexMd)
    ).trim();
    const body = parseFrontmatter(fs.readFileSync(bodyPath, "utf8")).body;

    references.push({
      slug: entry.name,
      title,
      description,
      tagline: meta.tagline ?? description,
      track: meta.track ?? OTHER_TRACK,
      accent: meta.accent ?? "slate",
      order: meta.order,
      markdown: body,
      entryCount: countEntries(body),
      href: `/reference/${entry.name}`,
    });
  }

  references.sort((a, b) => {
    const ao = a.order ?? Number.POSITIVE_INFINITY;
    const bo = b.order ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return a.slug.localeCompare(b.slug);
  });
  if (references.length > 0) {
    globalForReferences.__agentYapReferences = references;
  }
  return references;
}

/** Shelf order: explicit `order` first, then slug. No `order` sorts last. */
function compareBooks(a: Book, b: Book): number {
  const ao = a.order ?? Number.POSITIVE_INFINITY;
  const bo = b.order ?? Number.POSITIVE_INFINITY;
  if (ao !== bo) return ao - bo;
  return a.slug.localeCompare(b.slug);
}

/** Reading order in a book: frontmatter `order`, then `chapter-NN`, then slug. */
function compareChapters(a: Chapter, b: Chapter): number {
  const ao = a.order ?? a.number;
  const bo = b.order ?? b.number;
  if (ao !== bo) return ao - bo;
  if (a.number !== b.number) return a.number - b.number;
  return a.slug.localeCompare(b.slug);
}

function firstParagraph(markdown: string): string {
  const body = markdown.replace(/^#.*$/m, "").trim();
  const para = body.split(/\n\s*\n/).find((p) => p.trim().length > 0) ?? "";
  return toPlainText(para);
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const dot = trimmed.indexOf(". ");
  if (dot > 30 && dot < 220) return trimmed.slice(0, dot + 1);
  return trimmed.length > 200 ? trimmed.slice(0, 197).trimEnd() + "…" : trimmed;
}

/* --------------------------------- queries --------------------------------- */

export function getBooks(): Book[] {
  return loadBooks();
}

export function getBook(slug: string): Book | undefined {
  return loadBooks().find((b) => b.slug === slug);
}

/**
 * Where a reader with no history starts: the first book in shelf order.
 *
 * `featured` deliberately does not decide this. Featured means "show in the
 * top row", which several subjects are at once, so the entry point stays the
 * `order` key and one book can be promoted without becoming the front door.
 */
export function getPrimaryBook(): Book {
  const books = loadBooks();
  if (books.length === 0) throw new Error("No content books found under /content");
  return books[0];
}

/** The books promoted to the featured row, in shelf order. */
export function getFeaturedBooks(): Book[] {
  return loadBooks().filter((b) => b.featured);
}

export function getReferences(): Reference[] {
  return loadReferences();
}

export function getReference(slug: string): Reference | undefined {
  return loadReferences().find((r) => r.slug === slug);
}

/**
 * Every subject grouped into shelf sections, books before references.
 *
 * A track's position is its lowest `order`, so moving one book can move its
 * whole section and nothing here holds a hardcoded list of track names: adding
 * a subject is an `index.md`, never an edit to this file. "Other" always sorts
 * last so an untracked folder is visible rather than lost.
 */
export function getShelf(): Track[] {
  const byTrack = new Map<string, Track>();

  const trackFor = (name: string): Track => {
    let track = byTrack.get(name);
    if (!track) {
      track = { name, books: [], references: [] };
      byTrack.set(name, track);
    }
    return track;
  };

  for (const book of loadBooks()) trackFor(book.track).books.push(book);
  for (const reference of loadReferences()) {
    trackFor(reference.track).references.push(reference);
  }

  const rank = (track: Track): number => {
    const orders = [
      ...track.books.map((b) => b.order),
      ...track.references.map((r) => r.order),
    ].filter((o): o is number => o !== undefined);
    return orders.length ? Math.min(...orders) : Number.POSITIVE_INFINITY;
  };

  return [...byTrack.values()].sort((a, b) => {
    if (a.name === OTHER_TRACK) return b.name === OTHER_TRACK ? 0 : 1;
    if (b.name === OTHER_TRACK) return -1;
    const ao = rank(a);
    const bo = rank(b);
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name);
  });
}

export function getChapter(bookSlug: string, chapterSlug: string): Chapter | undefined {
  return getBook(bookSlug)?.chapters.find((c) => c.slug === chapterSlug);
}

export function getSlide(
  bookSlug: string,
  chapterSlug: string,
  sectionIndex: number,
): Slide | undefined {
  return getChapter(bookSlug, chapterSlug)?.slides[sectionIndex];
}

/** Previous/next slide in book-wide reading order (crosses chapter bounds). */
export function getAdjacent(slide: Slide): { prev?: Slide; next?: Slide } {
  const book = getBook(slide.bookSlug);
  if (!book) return {};
  return {
    prev: book.slides[slide.globalIndex - 1],
    next: book.slides[slide.globalIndex + 1],
  };
}

/** Every slide across every book — used by search and RAG retrieval. */
export function getAllSlides(): Slide[] {
  return loadBooks().flatMap((b) => b.slides);
}

/* ----------------------- compact manifest for the client ---------------------- */

/** Minimal slide info for client-side navigation (no markdown payload). */
export interface NavSlide {
  globalIndex: number;
  chapterNumber: number;
  chapterTitle: string;
  chapterSlug: string;
  sectionIndex: number;
  title: string;
  href: string;
}

/**
 * A chapter's slides are a contiguous window into `NavManifest.slides`, not a
 * second copy of them. `slides` is assembled chapter by chapter (`bookSlides`
 * in `loadBooks`), so every chapter owns one unbroken run and the half-open
 * range `[start, start + count)` recovers it exactly.
 */
export interface NavChapter {
  number: number;
  title: string;
  slug: string;
  /** Index of this chapter's first slide in `NavManifest.slides`. */
  start: number;
  /** How many slides this chapter owns (0 for an empty chapter file). */
  count: number;
}

/**
 * Client-serializable navigation model for one book.
 *
 * `slides` is the single authority: flat, in reading order, and positional on
 * `globalIndex` (`slides[i].globalIndex === i`). Chapters index into it rather
 * than repeating it. This manifest is a prop to a client component, so it is
 * serialized into the RSC flight payload of *every* prerendered slide page —
 * emitting each slide twice (once flat, once nested) doubled that payload on
 * the critical path for no gain. See §3.5 of
 * `docs/redesign-2026/research/02-code-ux-audit.md`.
 */
export interface NavManifest {
  bookSlug: string;
  bookTitle: string;
  total: number;
  slides: NavSlide[];
  chapters: NavChapter[];
}

function toNavSlide(s: Slide): NavSlide {
  return {
    globalIndex: s.globalIndex,
    chapterNumber: s.chapterNumber,
    chapterTitle: s.chapterTitle,
    chapterSlug: s.chapterSlug,
    sectionIndex: s.sectionIndex,
    title: s.title,
    href: s.href,
  };
}

/** Lightweight, client-serializable map of a whole book for nav + TOC. */
export function getNavManifest(bookSlug: string): NavManifest {
  const book = getBook(bookSlug);
  if (!book) throw new Error(`Unknown book: ${bookSlug}`);
  return {
    bookSlug: book.slug,
    bookTitle: book.title,
    total: book.slides.length,
    slides: book.slides.map(toNavSlide),
    chapters: book.chapters.map((c) => ({
      number: c.number,
      title: c.title,
      slug: c.slug,
      // `globalIndex` is the slide's position in the flat array, so the first
      // slide's index is the chapter's offset. `count === 0` makes the range
      // empty whatever `start` says, which covers a chapter with no sections.
      start: c.slides[0]?.globalIndex ?? 0,
      count: c.slides.length,
    })),
  };
}
