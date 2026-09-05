export const READER_THEMES = [
  "light",
  "dark",
  "sepia",
  "sepia-dark",
] as const;

export type ReaderTheme = (typeof READER_THEMES)[number];

export type ReaderFamily = "system" | "paper";

export const READER_THEME_STORAGE_KEY = "yap-reader-theme";

export function isReaderTheme(value: unknown): value is ReaderTheme {
  return (
    typeof value === "string" &&
    (READER_THEMES as readonly string[]).includes(value)
  );
}

export function familyForTheme(theme: ReaderTheme): ReaderFamily {
  return theme === "sepia" || theme === "sepia-dark" ? "paper" : "system";
}

export function nextReaderTheme(theme: ReaderTheme): ReaderTheme {
  const i = READER_THEMES.indexOf(theme);
  return READER_THEMES[(i + 1) % READER_THEMES.length];
}

export function applyReaderTheme(theme: ReaderTheme, root: HTMLElement): void {
  root.setAttribute("data-reader-theme", theme);
  root.setAttribute("data-reader-family", familyForTheme(theme));
}
