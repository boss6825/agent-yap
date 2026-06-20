import { notFound } from "next/navigation";
import { getBook, getNavManifest } from "@/lib/content";
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
  return <ReaderChrome manifest={manifest}>{children}</ReaderChrome>;
}
