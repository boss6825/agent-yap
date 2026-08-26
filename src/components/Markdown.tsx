import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";

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
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-yap">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
        ]}
        components={{
          a({ href, children, ...props }) {
            const external = !!href && /^https?:\/\//.test(href);
            return (
              <a
                href={href}
                {...(external
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
