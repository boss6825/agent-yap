"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import type { MermaidConfig } from "mermaid";

/**
 * Renders one ```mermaid fence as a diagram.
 *
 * ## Why this is a client island and not a build-time render
 *
 * Mermaid has no DOM-free renderer. Importing it in Node succeeds, but
 * `mermaid.render()` throws `ReferenceError: document is not defined`
 * (measured against mermaid 11.17.2), and 135 files under
 * `node_modules/mermaid/dist/chunks/` call `getBBox()` — the SVG text-metrics
 * API jsdom does not implement — so a jsdom shim would produce diagrams with
 * mis-measured, overlapping labels rather than an honest failure. The
 * project's own answer to "render mermaid without a browser" is
 * `@mermaid-js/mermaid-cli`, which drives headless Chromium via Puppeteer.
 * Adding a ~300MB browser download to `npm run build` is a far larger cost
 * than the one it removes, so: client island.
 *
 * The cost is bounded by making it lazy in two dimensions. `Markdown.tsx`
 * only mounts this component for a `<pre>` that actually holds a mermaid
 * fence, and the library itself arrives through a dynamic `import()`, so the
 * mermaid chunk is fetched only on a slide that has a diagram. Slides without
 * one pay nothing beyond this file.
 *
 * ## Degradation
 *
 * `children` is the server-rendered `<pre><code>` code block — the exact
 * markup the fence produced before this component existed. It is what the
 * server sends, what renders with JavaScript off, and what stays on screen if
 * the source is malformed (`mermaid.parse` is asked first, with
 * `suppressErrors`, so a bad diagram is a falsy return rather than a throw),
 * if the dynamic import fails, or if the design tokens cannot be read. The
 * diagram replaces it only on success.
 *
 * ## Theming
 *
 * Mermaid does colour maths on its theme variables (khroma `lighten`/
 * `darken`), so it cannot be handed `var(--color-ink)` strings. The values are
 * instead read off the live document with `getComputedStyle`, which means they
 * are literally the tokens defined in `globals.css` — including whatever
 * `[data-theme="dark"]` re-points them to. A `MutationObserver` on
 * `data-theme` redraws on a theme flip. If any token comes back empty the
 * component refuses to draw rather than inventing a fallback palette.
 */

/** Tokens this component needs before it will draw anything. */
const TOKEN_NAMES = {
  canvas: "--color-canvas",
  surface: "--color-canvas-2",
  surfaceAlt: "--color-canvas-3",
  ink: "--color-ink",
  inkMuted: "--color-ink-2",
  fontSans: "--font-sans",
} as const;

type Tokens = Record<keyof typeof TOKEN_NAMES, string>;

function readTokens(): Tokens | null {
  const style = getComputedStyle(document.documentElement);
  const tokens = {} as Tokens;
  for (const key of Object.keys(TOKEN_NAMES) as (keyof Tokens)[]) {
    const value = style.getPropertyValue(TOKEN_NAMES[key]).trim();
    if (!value) return null;
    tokens[key] = value;
  }
  return tokens;
}

function mermaidConfig(t: Tokens, dark: boolean): MermaidConfig {
  return {
    startOnLoad: false,
    // `content/` is first-party markdown committed to this repo, but `strict`
    // still runs every label through DOMPurify and blocks click handlers —
    // there is no reason to relax it for a corpus of `<br/>`s.
    securityLevel: "strict",
    // Never let mermaid inject its own red "Syntax error" SVG into the page.
    // A broken diagram degrades to the code block instead.
    suppressErrorRendering: true,
    logLevel: "fatal",
    // `base` is the only built-in theme that derives everything from
    // themeVariables; the named themes hard-code their own palette.
    theme: "base",
    darkMode: dark,
    fontFamily: t.fontSans,
    themeVariables: {
      background: t.surface,
      primaryColor: t.canvas,
      primaryTextColor: t.ink,
      primaryBorderColor: t.inkMuted,
      secondaryColor: t.surfaceAlt,
      secondaryTextColor: t.ink,
      secondaryBorderColor: t.inkMuted,
      tertiaryColor: t.surfaceAlt,
      tertiaryTextColor: t.ink,
      tertiaryBorderColor: t.inkMuted,
      mainBkg: t.canvas,
      nodeBorder: t.inkMuted,
      nodeTextColor: t.ink,
      textColor: t.ink,
      lineColor: t.inkMuted,
      edgeLabelBackground: t.surface,
      clusterBkg: t.surfaceAlt,
      clusterBorder: t.inkMuted,
      titleColor: t.ink,
      fontSize: "15px",
    },
    flowchart: {
      // Keep the diagram at its natural size and let the wrapper scroll.
      // `useMaxWidth: true` would shrink a wide flowchart to the column width
      // and take the label text down with it, which is unreadable on a phone.
      useMaxWidth: false,
      htmlLabels: true,
      padding: 12,
      nodeSpacing: 44,
      rankSpacing: 52,
    },
  };
}

export function MermaidDiagram({
  chart,
  children,
}: {
  chart: string;
  children: ReactNode;
}) {
  const [svg, setSvg] = useState<string | null>(null);
  const [themeTick, setThemeTick] = useState(0);

  // React 19's useId returns a value wrapped in non-ASCII delimiters (`«r1»`).
  // Mermaid puts this id straight into the DOM and into CSS selectors, so it
  // has to be reduced to something both accept.
  const renderId = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    const observer = new MutationObserver(() => setThemeTick((n) => n + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      const tokens = readTokens();
      if (!tokens) return;
      const dark =
        document.documentElement.getAttribute("data-theme") === "dark";

      const { default: mermaid } = await import("mermaid");
      if (cancelled) return;

      mermaid.initialize(mermaidConfig(tokens, dark));
      if (!(await mermaid.parse(chart, { suppressErrors: true }))) return;
      if (cancelled) return;

      const { svg: markup } = await mermaid.render(renderId, chart);
      if (!cancelled) setSvg(markup);
    }

    // Any rejection at all leaves `svg` null, i.e. leaves the code block up.
    draw().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [chart, renderId, themeTick]);

  if (svg === null) return <>{children}</>;

  return (
    // `tabIndex` because the box scrolls: a scrollable region that cannot be
    // reached by keyboard fails WCAG 2.1.1. `role="group"` rather than
    // `region` so 33 diagrams do not become 33 landmarks.
    //
    // The markup is mermaid's own output, generated from first-party corpus
    // markdown and already passed through DOMPurify by `securityLevel:
    // "strict"`.
    <div
      role="group"
      aria-label="Diagram"
      tabIndex={0}
      className="overflow-x-auto rounded-card border border-hairline bg-canvas-2 p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
