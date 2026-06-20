/**
 * Content layer — the single source of truth for the knowledge base.
 *
 * Markdown lives in `content/<book>/`. Each book has an `index.md` (title +
 * description) and `chapter-NN-*.md` files. Every chapter is split into
 * "slides": one intro slide (the text under the H1, before the first H2) plus
 * one slide per `##` section. Slides are flattened into a single ordered list
 * per book so the reader can move left/right across the whole book.
 *
 * This module is server-only (it reads the filesystem). It is imported by the
 * statically-generated reader pages AND by the API routes (search + ask), so
 * the parsing logic is never duplicated.
 */
import fs from "node:fs";
import path from "node:path";

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
}

export interface Book {
  slug: string;
  title: string;
  description: string;
  chapters: Chapter[];
  /** All slides across all chapters, in reading order. */
  slides: Slide[];
}

const CONTENT_ROOT = path.join(process.cwd(), "content");

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

let cache: Book[] | null = null;

function loadBooks(): Book[] {
  if (cache) return cache;

  const books: Book[] = [];
  if (!fs.existsSync(CONTENT_ROOT)) return (cache = books);

  const bookDirs = fs
    .readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const bookSlug of bookDirs) {
    const dir = path.join(CONTENT_ROOT, bookSlug);
    const indexPath = path.join(dir, "index.md");
    if (!fs.existsSync(indexPath)) continue;

    const indexMd = fs.readFileSync(indexPath, "utf8");
    const title = firstHeading(indexMd, 1) ?? bookSlug;
    const blockquote = indexMd.match(/^>\s?(.*)$/m);
    const description = (blockquote ? blockquote[1] : firstParagraph(indexMd)).trim();

    const chapterFiles = fs
      .readdirSync(dir)
      .filter((f) => /^chapter-\d+.*\.md$/.test(f))
      .sort();

    const chapters: Chapter[] = [];
    const bookSlides: Slide[] = [];
    let globalIndex = 0;

    for (const file of chapterFiles) {
      const numberMatch = file.match(/^chapter-(\d+)/);
      const chapterNumber = numberMatch ? parseInt(numberMatch[1], 10) : 0;
      const chapterSlug = file.replace(/^chapter-/, "").replace(/\.md$/, "");

      const md = fs.readFileSync(path.join(dir, file), "utf8");
      const h1 = firstHeading(md, 1) ?? `Chapter ${chapterNumber}`;
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
          globalIndex: globalIndex++,
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
      });
      bookSlides.push(...slides);
    }

    chapters.sort((a, b) => a.number - b.number);
    books.push({ slug: bookSlug, title, description, chapters, slides: bookSlides });
  }

  return (cache = books);
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

/** The primary book (the site currently ships one knowledge base). */
export function getPrimaryBook(): Book {
  const books = loadBooks();
  if (books.length === 0) throw new Error("No content books found under /content");
  return books[0];
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

export interface NavChapter {
  number: number;
  title: string;
  slug: string;
  slides: NavSlide[];
}

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
      slides: c.slides.map(toNavSlide),
    })),
  };
}
