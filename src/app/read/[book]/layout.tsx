import { notFound } from "next/navigation";
import { getBook, getBooks, getNavManifest } from "@/lib/content";
import { ReaderChrome } from "@/components/reader/ReaderChrome";

export default async function ReaderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ book: string }>;
}) {
  const { book } = await params;
  if (!getBook(book)) notFound();
  const manifest = getNavManifest(book);
  // Slug + title only: enough to name a resume target that lives in another
  // book, without embedding a second book's slide manifest in this page.
  const books = getBooks().map((b) => ({ slug: b.slug, title: b.title }));
  return (
    <ReaderChrome manifest={manifest} books={books}>
      {children}
    </ReaderChrome>
  );
}
