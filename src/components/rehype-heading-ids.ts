import type { Element, Root, RootContent } from "hast";
import { normalizeSlug, slugifyHeading } from "@/components/markdown-links";

const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

function text(node: RootContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(text).join("");
  return "";
}

/**
 * Give every heading a GitHub-style `id`.
 *
 * Reference pages are one long document whose entries are `###` headings, and
 * the corpus links into them by fragment (`Glossary.md#compaction`). Without
 * ids those 159 links land at the top of the page every time.
 *
 * Slugs come from `slugifyHeading` + `normalizeSlug`, the same pair
 * `markdown-links.ts` runs an authored anchor through, so a link and its target
 * cannot disagree about what a heading is called. Duplicates get
 * github-slugger's `-1`, `-2` suffix, which is also the form the resolver
 * already strips when looking one up.
 */
export function rehypeHeadingIds() {
  return (tree: Root) => {
    const seen = new Map<string, number>();

    const walk = (node: Root | Element) => {
      for (const child of node.children) {
        if (child.type !== "element") continue;
        if (HEADINGS.has(child.tagName)) {
          const base = normalizeSlug(slugifyHeading(text(child)));
          if (base) {
            const n = seen.get(base) ?? 0;
            seen.set(base, n + 1);
            child.properties = {
              ...child.properties,
              id: n === 0 ? base : `${base}-${n}`,
            };
          }
        }
        walk(child);
      }
    };

    walk(tree);
  };
}
