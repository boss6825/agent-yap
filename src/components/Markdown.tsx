import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import type { Element, ElementContent } from "hast";
import {
  resolveMarkdownLink,
  type MarkdownLinkContext,
} from "@/components/markdown-links";
import { MermaidDiagram } from "@/components/MermaidDiagram";

/** Every text node under a hast subtree, concatenated. */
function hastText(node: ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(hastText).join("");
  return "";
}

/**
 * The source of a ```mermaid fence, or `null` for every other `<pre>`.
 *
 * Reads the hast node rather than the rendered React children so the text
 * comes back verbatim regardless of what the rehype pipeline did to the
 * element tree.
 */
function mermaidSource(node: Element | undefined): string | null {
  const code = node?.children.find(
    (child): child is Element =>
      child.type === "element" && child.tagName === "code",
  );
  if (!code) return null;

  const classNames = code.properties?.className;
  const list = Array.isArray(classNames) ? classNames.map(String) : [];
  if (!list.includes("language-mermaid")) return null;

  const source = code.children.map(hastText).join("").replace(/\n+$/, "");
  return source.trim() ? source : null;
}

/**
 * Renders a slide's markdown. Server component — no JS shipped for content.
 * Styling lives in `.prose-yap` (globals.css); syntax colors come from the
 * highlight.js class theme also defined there.
 *
 * `rehype-raw` is what makes authored HTML in the corpus render at all — most
 * visibly the `<details><summary>Answer</summary>` review items, which are
 * otherwise dropped on the floor. react-markdown hands raw HTML to
 * mdast-util-to-hast as `raw` nodes (it forces `allowDangerousHtml: true` on
 * remark-rehype internally, and cannot be talked out of it), but nothing turns
 * those back into elements until rehype-raw reparses the tree.
 *
 * Order matters: rehype-raw re-serialises and reparses the whole tree, so it
 * runs first and rehype-highlight then sees a settled element tree — including
 * any `<pre><code>` that arrived as raw HTML.
 *
 * No sanitizer: `content/` is first-party markdown committed to this repo,
 * never user input. If that ever stops being true, add `rehype-sanitize`
 * *after* rehype-raw with an allowlist that permits `details`, `summary` and
 * `open`, or the review items disappear again.
 *
 * `context` is the book/chapter the markdown was authored in. It is what lets
 * the `a()` override turn the corpus's relative `.md` cross-links into reader
 * routes (see `markdown-links.ts`). Omit it and every href renders exactly as
 * it did before — relative `.md` links included.
 *
 * The `pre()` override hands a ```mermaid fence to `MermaidDiagram`, a lazy
 * client island, and passes the untouched `<pre>` down as its children so the
 * code block is what the server sends and what survives no-JS or a malformed
 * diagram. `plainText: ["mermaid"]` keeps rehype-highlight's hands off those
 * fences — highlight.js has no mermaid grammar, so it would otherwise log a
 * `missing-language` message per diagram and stamp a pointless `hljs` class on
 * markup nobody sees.
 */
export function Markdown({
  children,
  context,
}: {
  children: string;
  context?: MarkdownLinkContext;
}) {
  return (
    <div className="prose-yap">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [
            rehypeHighlight,
            { detect: true, ignoreMissing: true, plainText: ["mermaid"] },
          ],
        ]}
        components={{
          pre({ children, node, ...props }) {
            const source = mermaidSource(node);
            if (!source) return <pre {...props}>{children}</pre>;

            return (
              <MermaidDiagram chart={source}>
                <pre {...props}>{children}</pre>
              </MermaidDiagram>
            );
          },
          a({ href, children, node, ...props }) {
            // react-markdown passes the hast node to every override
            // (`passNode: true`). It has to be pulled out of the rest spread or
            // React stringifies it into a bogus `node="[object Object]"`
            // attribute on every anchor in the corpus.
            void node;

            const link = resolveMarkdownLink(href, context);

            if (link.kind === "internal") {
              return (
                <Link href={link.href} {...props}>
                  {children}
                </Link>
              );
            }

            // A relative `.md` path no live book serves — most of the corpus is
            // still dark folders (M3 wires them up). Render the text, visibly
            // de-emphasised, rather than a confident blue link into a 404.
            //
            // No `title`: on a non-interactive element it is unreachable by
            // keyboard and it would take over the accessible name, so a screen
            // reader would announce the raw path instead of the link text. The
            // state is carried by the `sr-only` note for assistive tech and by
            // `data-unresolved-link` for anyone auditing the corpus.
            if (link.kind === "unresolved") {
              return (
                <span
                  className="text-ink-2 underline decoration-dotted decoration-from-font underline-offset-[3px]"
                  data-unresolved-link={link.target}
                  {...props}
                >
                  {children}
                  <span className="sr-only"> (not published yet)</span>
                </span>
              );
            }

            return (
              <a
                href={link.href}
                {...(link.kind === "external"
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
