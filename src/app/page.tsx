import { getPrimaryBook } from "@/lib/content";
import { Home, type HomeData } from "@/components/Home";

export default function Page() {
  const book = getPrimaryBook();
  const data: HomeData = {
    title: book.title,
    description: book.description,
    total: book.slides.length,
    startHref: book.slides[0].href,
    chapters: book.chapters.map((c) => ({
      number: c.number,
      title: c.title,
      blurb: c.blurb,
      href: c.href,
      slideCount: c.slides.length,
    })),
  };
  return <Home data={data} />;
}
