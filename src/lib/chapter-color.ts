/**
 * Playful per-chapter accent colors. Each chapter is color-coded so the reader
 * always has a sense of "where" they are. Pure + isomorphic (server & client).
 */
export interface Accent {
  /** Vivid base color. */
  hex: string;
  /** Readable text color to place ON the vivid color. */
  on: string;
  /** Human label (used in alt/aria text). */
  name: string;
}

const PALETTE: Accent[] = [
  { hex: "#c2f24a", on: "#10130a", name: "lime" },
  { hex: "#3dd7e0", on: "#04201f", name: "cyan" },
  { hex: "#ff5da2", on: "#2a0716", name: "pink" },
  { hex: "#a98bff", on: "#160a2e", name: "violet" },
  { hex: "#ffb84d", on: "#241402", name: "amber" },
  { hex: "#5b8cff", on: "#050f2e", name: "azure" },
  { hex: "#ff7a59", on: "#2a0a02", name: "coral" },
  { hex: "#5be58a", on: "#04210f", name: "mint" },
];

/** Stable accent for a 1-based chapter number. */
export function chapterAccent(chapterNumber: number): Accent {
  const i = ((chapterNumber - 1) % PALETTE.length + PALETTE.length) % PALETTE.length;
  return PALETTE[i];
}

export { PALETTE as accentPalette };
