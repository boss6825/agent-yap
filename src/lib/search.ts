import { getAllSlides, toPlainText, type Slide } from "@/lib/content";

export interface SearchResult {
  id: string;
  chapterNumber: number;
  chapterTitle: string;
  sectionIndex: number;
  title: string;
  snippet: string;
  href: string;
  score: number;
  slide: Slide;
}

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;
const SNIPPET_LENGTH = 160;
const TITLE_WEIGHT = 3;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .match(/[a-z0-9]+(?:'[a-z0-9]+)?/g) ?? [];
}

function uniqueTerms(terms: string[]): string[] {
  return [...new Set(terms)];
}

function countTerms(terms: string[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const term of terms) {
    counts.set(term, (counts.get(term) ?? 0) + 1);
  }

  return counts;
}

function clampLimit(limit?: number): number {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
}

function findBestTermIndex(text: string, queryTerms: string[]): number {
  const lower = text.toLowerCase();
  let best = -1;

  for (const term of queryTerms) {
    const index = lower.indexOf(term);
    if (index !== -1 && (best === -1 || index < best)) {
      best = index;
    }
  }

  return best;
}

function makeSnippet(text: string, queryTerms: string[]): string {
  const cleanText = toPlainText(text);
  if (cleanText.length <= SNIPPET_LENGTH) return cleanText;

  const matchIndex = findBestTermIndex(cleanText, queryTerms);
  const center = matchIndex === -1 ? 0 : matchIndex;
  const start = Math.max(0, center - Math.floor(SNIPPET_LENGTH / 2));
  const end = Math.min(cleanText.length, start + SNIPPET_LENGTH);
  const adjustedStart = Math.max(0, end - SNIPPET_LENGTH);

  let snippet = cleanText.slice(adjustedStart, end).trim();

  if (adjustedStart > 0) {
    const firstSpace = snippet.indexOf(" ");
    if (firstSpace > 0) snippet = snippet.slice(firstSpace + 1);
    snippet = `…${snippet}`;
  }

  if (end < cleanText.length) {
    const lastSpace = snippet.lastIndexOf(" ");
    if (lastSpace > 0) snippet = snippet.slice(0, lastSpace);
    snippet = `${snippet}…`;
  }

  return snippet;
}

export function searchSlides(query: string, limit = DEFAULT_LIMIT): SearchResult[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const queryTerms = uniqueTerms(tokenize(trimmedQuery));
  if (queryTerms.length === 0) return [];

  const slides = getAllSlides();
  const documents = slides.map((slide) => {
    const titleTerms = tokenize(slide.title);
    const bodyTerms = tokenize(slide.text);
    const allTerms = [...titleTerms, ...bodyTerms];

    return {
      slide,
      titleCounts: countTerms(titleTerms),
      bodyCounts: countTerms(bodyTerms),
      length: Math.max(allTerms.length, 1),
      uniqueTerms: new Set(allTerms),
    };
  });

  const documentCount = Math.max(documents.length, 1);
  const averageLength =
    documents.reduce((sum, document) => sum + document.length, 0) / documentCount;
  const cappedLimit = clampLimit(limit);

  return documents
    .map((document) => {
      let score = 0;

      for (const term of queryTerms) {
        const bodyCount = document.bodyCounts.get(term) ?? 0;
        const titleCount = document.titleCounts.get(term) ?? 0;
        const weightedFrequency = bodyCount + titleCount * TITLE_WEIGHT;

        if (weightedFrequency === 0) continue;

        const matchingDocuments = documents.filter((candidate) =>
          candidate.uniqueTerms.has(term),
        ).length;
        const idf = Math.log(1 + (documentCount - matchingDocuments + 0.5) / (matchingDocuments + 0.5));
        const k1 = 1.2;
        const b = 0.75;
        const denominator =
          weightedFrequency + k1 * (1 - b + b * (document.length / averageLength));

        score += idf * ((weightedFrequency * (k1 + 1)) / denominator);
      }

      return {
        id: document.slide.id,
        chapterNumber: document.slide.chapterNumber,
        chapterTitle: document.slide.chapterTitle,
        sectionIndex: document.slide.sectionIndex,
        title: document.slide.title,
        snippet: makeSnippet(document.slide.text, queryTerms),
        href: document.slide.href,
        score: Number(score.toFixed(4)),
        slide: document.slide,
      };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.slide.globalIndex - b.slide.globalIndex)
    .slice(0, cappedLimit);
}
