import { notFound } from "next/navigation";
import { getBook, getNavManifest } from "@/lib/content";
import { getReaderBooks } from "@/lib/shelf";
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
  // Four fields per book: enough to name a cross-book resume target and to
  // fill the rail's subject switcher, without embedding a second book's slide
  // manifest in every prerendered page.
  return (
    <ReaderChrome manifest={manifest} books={getReaderBooks()}>
      {children}
    </ReaderChrome>
  );
}
