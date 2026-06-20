import { notFound, redirect } from "next/navigation";
import { getBook } from "@/lib/content";

export default async function BookIndex({
  params,
}: {
  params: Promise<{ book: string }>;
}) {
  const { book } = await params;
  const b = getBook(book);
  if (!b) notFound();
  redirect(b.slides[0].href);
}
