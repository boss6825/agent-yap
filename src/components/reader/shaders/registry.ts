import type { ThemeId } from "@/lib/theme";

/**
 * Paper scratchpad shaders for the slide reader.
 *
 * Source file: https://app.paper.design/file/01KZKVHZ7D50HRBGRX7CEYCR0W/1-0
 * Params taken from Paper `get_jsx` / computed styles — not from screenshots.
 *
 * Chapter cycling: `SHADER_REGISTRY[chapterIndex % SHADER_REGISTRY.length]`
 * where `chapterIndex` is the 0-based index in `NavManifest.chapters`.
 * Slides inside the same chapter keep the same shader. Crossing a chapter
 * boundary advances the slot.
 *
 * Theme polarity (existing reader themes, not a second system):
 *   plain-light | sepia-light  → light variant
 *   plain-dark  | sepia-dark   → dark variant
 * The product brief's light / light-tint / dark / dark-tint map onto those
 * two polarities.
 *
 * Reserved (not shipped): Paper `4Z6-0` Image Dithering — Editorial Dark,
 * `53L-0` Image Dithering — Color Bloom. Add them as extra registry entries.
 */

export type ShaderPolarity = "light" | "dark";

export type ShaderId = "aurora" | "hero" | "corner-glow" | "chrome";

/** Paper Grain Gradient colors (shaders 1–3 share this palette). */
export const GRAIN_COLORS: string[] = [
  "#7300FF",
  "#EBA8FF",
  "#00BFFF",
  "#2A00FF",
];

export const GRAIN_SHARED = {
  colors: GRAIN_COLORS,
  colorBack: "#00000000",
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  softness: 0.5,
  intensity: 0.5,
  noise: 0.25,
  shape: "corners" as const,
};

export type GrainVariant = {
  kind: "grain-gradient";
  opacity: number;
  /** Fill behind a transparent `colorBack` (Paper put this on the shader node). */
  canvasBackground?: string;
  /** Paper "Readability Scrim" gradient. */
  scrim?: string;
};

export type MetalVariant = {
  kind: "liquid-metal";
  softness: number;
  repetition: number;
  shiftRed: number;
  shiftBlue: number;
  distortion: number;
  contour: number;
  scale: number;
  rotation: number;
  shape: "diamond";
  angle: number;
  colorBack: string;
  colorTint: string;
};

export type ShaderVariant = GrainVariant | MetalVariant;

export type ShaderDefinition = {
  id: ShaderId;
  paperNodeId: string;
  paperName: string;
  /** True when this polarity was copied from Paper; false when derived. */
  sourcedFromPaper: Record<ShaderPolarity, boolean>;
  variants: Record<ShaderPolarity, ShaderVariant>;
};

/**
 * Dark-hero readability scrim (Paper node 4QB-0).
 * `linear-gradient(in oklab 90deg, …)` from computed styles.
 */
export const HERO_DARK_SCRIM =
  "linear-gradient(in oklab 90deg, oklab(12.7% 0.004 -0.019 / 92%) 0%, oklab(12.7% 0.004 -0.019 / 80%) 38%, oklab(12.7% 0.004 -0.019 / 25%) 72%, oklab(12.7% 0.004 -0.019 / 0%) 100%)";

/** Corner-glow light scrim (Paper node 4R1-0). */
export const CORNER_LIGHT_SCRIM =
  "linear-gradient(in oklab 90deg, oklab(100% 0 0) 0%, oklab(100% 0 0) 42%, oklab(100% 0 0 / 55%) 64%, oklab(100% 0 0 / 0%) 90%)";

/** Derived: invert the corner-glow scrim onto the dark-hero ink (`#06060E` ≈ oklab 12.7%). */
export const CORNER_DARK_SCRIM =
  "linear-gradient(in oklab 90deg, oklab(12.7% 0.004 -0.019) 0%, oklab(12.7% 0.004 -0.019) 42%, oklab(12.7% 0.004 -0.019 / 55%) 64%, oklab(12.7% 0.004 -0.019 / 0%) 90%)";

/**
 * Derived hero-light scrim: same stop positions as the dark hero veil,
 * inverted to white so body copy stays readable on a full-bleed grain.
 */
export const HERO_LIGHT_SCRIM =
  "linear-gradient(in oklab 90deg, oklab(100% 0 0 / 78%) 0%, oklab(100% 0 0 / 62%) 38%, oklab(100% 0 0 / 22%) 72%, oklab(100% 0 0 / 0%) 100%)";

export const HERO_DARK_CANVAS = "#06060E";

const METAL_SHARED: Omit<MetalVariant, "colorTint"> = {
  kind: "liquid-metal",
  softness: 0.1,
  repetition: 2,
  shiftRed: 0.3,
  shiftBlue: 0.3,
  distortion: 0.07,
  contour: 0.4,
  scale: 0.6,
  rotation: 0,
  shape: "diamond",
  angle: 70,
  colorBack: "#00000000",
};

export const SHADER_REGISTRY: readonly ShaderDefinition[] = [
  {
    id: "aurora",
    paperNodeId: "4HL-0",
    paperName: "Shader 1 · Grain Gradient — Light Aurora",
    sourcedFromPaper: { light: true, dark: false },
    variants: {
      light: {
        kind: "grain-gradient",
        opacity: 0.3,
      },
      dark: {
        kind: "grain-gradient",
        opacity: 0.4,
      },
    },
  },
  {
    id: "hero",
    paperNodeId: "4LY-0",
    paperName: "Shader 2 · Grain Gradient — Dark Hero",
    sourcedFromPaper: { light: false, dark: true },
    variants: {
      light: {
        kind: "grain-gradient",
        opacity: 1,
        scrim: HERO_LIGHT_SCRIM,
      },
      dark: {
        kind: "grain-gradient",
        opacity: 1,
        canvasBackground: HERO_DARK_CANVAS,
        scrim: HERO_DARK_SCRIM,
      },
    },
  },
  {
    id: "corner-glow",
    paperNodeId: "4QD-0",
    paperName: "Shader 3 · Grain Gradient — Corner Glow",
    sourcedFromPaper: { light: true, dark: false },
    variants: {
      light: {
        kind: "grain-gradient",
        opacity: 1,
        scrim: CORNER_LIGHT_SCRIM,
      },
      dark: {
        kind: "grain-gradient",
        opacity: 1,
        canvasBackground: HERO_DARK_CANVAS,
        scrim: CORNER_DARK_SCRIM,
      },
    },
  },
  {
    id: "chrome",
    paperNodeId: "4UR-0",
    paperName: "Shader 4 · Liquid Metal — Chrome Accent",
    sourcedFromPaper: { light: true, dark: false },
    variants: {
      light: {
        ...METAL_SHARED,
        colorTint: "#FFFFFF",
      },
      dark: {
        ...METAL_SHARED,
        colorTint: "#FFFFFF",
      },
    },
  },
];

export function polarityFromTheme(theme: ThemeId): ShaderPolarity {
  return theme === "plain-dark" || theme === "sepia-dark" ? "dark" : "light";
}

/** 0-based chapter index in the book manifest, modulo the live registry. */
export function shaderIndexForChapter(chapterIndex: number): number {
  const n = SHADER_REGISTRY.length;
  if (n === 0) return 0;
  return ((chapterIndex % n) + n) % n;
}

export function shaderForChapterIndex(chapterIndex: number): ShaderDefinition {
  return SHADER_REGISTRY[shaderIndexForChapter(chapterIndex)]!;
}

export function shaderLayerKey(
  shaderId: ShaderId,
  polarity: ShaderPolarity,
): string {
  return `${shaderId}:${polarity}`;
}
