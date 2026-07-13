/**
 * Display helpers for the frontend. Chapter H1s in the content often already
 * embed their own numbering ("Chapter 3: Tool Design"); the UI renders the
 * number separately, so strip the prefix at display time.
 */
export function chapterDisplayTitle(title: string): string {
  return title.replace(/^Chapter\s+\d+\s*[:—–-]\s*/i, "").trim();
}
