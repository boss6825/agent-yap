import { type NextRequest } from "next/server";

import { searchSlides } from "@/lib/search";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const rawLimit = request.nextUrl.searchParams.get("limit");
  const limit = rawLimit ? Number(rawLimit) : undefined;

  if (!query) {
    return Response.json({ query: "", results: [] });
  }

  const results = searchSlides(query, limit).map((result) => ({
    id: result.id,
    chapterNumber: result.chapterNumber,
    chapterTitle: result.chapterTitle,
    sectionIndex: result.sectionIndex,
    title: result.title,
    snippet: result.snippet,
    href: result.href,
    score: result.score,
  }));

  return Response.json({ query, results });
}
