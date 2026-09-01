/**
 * Shelf view-model: the content layer flattened into something a client
 * component can hold.
 *
 * `Book` carries every slide's markdown, so it can never cross the server
 * boundary. The landing page and the library both render the same shelf, so
 * the projection lives here once rather than in each page, and both get the
 * same counts, hrefs and ordering by construction.
 */
import {
  getBooks,
  getPrimaryBook,
  getShelf,
  type Accent,
  type Book,
  type Reference,
} from "@/lib/content";
import { chapterDisplayTitle } from "@/lib/display";

/** A subject the reader pages through: one book. */
export interface ShelfBook {
  kind: "book";
  slug: string;
  title: string;
  tagline: string;
  accent: Accent;
  featured: boolean;
  chapterCount: number;
  slideCount: number;
  /** First slide: where "Start learning" goes. */
  href: string;
}

/** A single-page reference, e.g. the glossary. Nothing to progress through. */
export interface ShelfReference {
  kind: "reference";
  slug: string;
  title: string;
  tagline: string;
  accent: Accent;
  /** Terms/sections the page defines, the reference answer to "N slides". */
  entryCount: number;
  href: string;
}

export type ShelfEntry = ShelfBook | ShelfReference;

export interface ShelfSection {
  name: string;
  entries: ShelfEntry[];
}

/**
 * The one real slide the landing page shows as a preview of the reader.
 * Taken from the entry-point book so the card and the hero CTA agree.
 */
export interface ShelfPreview {
  bookTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  blurb: string;
  href: string;
  /** Slides in the whole book, for the "01 / NN" counter. */
  bookSlideCount: number;
}

export interface ShelfData {
  /** The promoted subjects, in shelf order. Books only. */
  featured: ShelfBook[];
  sections: ShelfSection[];
  bookCount: number;
  chapterCount: number;
  slideCount: number;
  /** Where a reader with no history starts. */
  startHref: string;
  preview: ShelfPreview;
}

function toShelfBook(book: Book): ShelfBook {
  return {
    kind: "book",
    slug: book.slug,
    title: book.title,
    tagline: book.tagline,
    accent: book.accent,
    featured: book.featured,
    chapterCount: book.chapters.length,
    slideCount: book.slides.length,
    href: book.startHref,
  };
}

function toShelfReference(reference: Reference): ShelfReference {
  return {
    kind: "reference",
    slug: reference.slug,
    title: reference.title,
    tagline: reference.tagline,
    accent: reference.accent,
    entryCount: reference.entryCount,
    href: reference.href,
  };
}

/**
 * The minimum a reader page needs to know about the other books: enough to
 * name a cross-book resume target and to render the subject switcher.
 *
 * Deliberately not `ShelfBook`. This list is a prop on every one of the 481
 * prerendered slide pages, so it carries four fields rather than eight and
 * leaves taglines and accents to the shelf, which is rendered twice.
 */
export interface ReaderBook {
  slug: string;
  title: string;
  /** First slide, for a book the reader has never opened. */
  href: string;
  slideCount: number;
}

export function getReaderBooks(): ReaderBook[] {
  return getBooks().map((book) => ({
    slug: book.slug,
    title: book.title,
    href: book.startHref,
    slideCount: book.slides.length,
  }));
}

export function getShelfData(): ShelfData {
  const sections = getShelf().map((track) => ({
    name: track.name,
    entries: [
      ...track.books.map(toShelfBook),
      ...track.references.map(toShelfReference),
    ] as ShelfEntry[],
  }));

  const books = sections
    .flatMap((s) => s.entries)
    .filter((e): e is ShelfBook => e.kind === "book");

  const primary = getPrimaryBook();
  const firstChapter = primary.chapters[0];

  return {
    featured: books.filter((b) => b.featured),
    sections,
    bookCount: books.length,
    chapterCount: books.reduce((n, b) => n + b.chapterCount, 0),
    slideCount: books.reduce((n, b) => n + b.slideCount, 0),
    // `sections` is already in shelf order and books sort before references
    // inside a track, so the first book here is `getPrimaryBook()`.
    startHref: books[0]?.href ?? "/read",
    preview: {
      bookTitle: primary.title,
      chapterNumber: firstChapter?.number ?? 1,
      chapterTitle: chapterDisplayTitle(firstChapter?.title ?? primary.title),
      blurb: firstChapter?.blurb ?? primary.description,
      href: firstChapter?.href ?? primary.startHref,
      bookSlideCount: primary.slides.length,
    },
  };
}
