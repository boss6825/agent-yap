import type { MetadataRoute } from "next";
import { getBooks, getReferences } from "@/lib/content";
import { absoluteUrl, SITE_URL } from "@/lib/site";

// /read is the library index and /reference/<slug> is a real page, so both are
// listed. /read/[book] still redirects to a first slide, so it is not.
export default function sitemap(): MetadataRoute.Sitemap {
  const slideEntries = getBooks().flatMap((book) =>
    book.slides.map((slide) => ({
      url: absoluteUrl(slide.href),
      changeFrequency: "monthly" as const,
      priority: slide.sectionIndex === 0 ? 0.8 : 0.6,
    })),
  );

  const referenceEntries = getReferences().map((reference) => ({
    url: absoluteUrl(reference.href),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/read"),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    ...referenceEntries,
    ...slideEntries,
  ];
}
