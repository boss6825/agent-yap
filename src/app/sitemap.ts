import type { MetadataRoute } from "next";
import { getBooks } from "@/lib/content";
import { absoluteUrl, SITE_URL } from "@/lib/site";

// /read and /read/[book] redirect to the first slide, so only the landing page
// and canonical slide URLs belong here.
export default function sitemap(): MetadataRoute.Sitemap {
  const slideEntries = getBooks().flatMap((book) =>
    book.slides.map((slide) => ({
      url: absoluteUrl(slide.href),
      changeFrequency: "monthly" as const,
      priority: slide.sectionIndex === 0 ? 0.8 : 0.6,
    })),
  );

  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...slideEntries,
  ];
}
