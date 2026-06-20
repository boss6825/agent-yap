import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

/**
 * Renders a slide's markdown. Server component — no JS shipped for content.
 * Styling lives in `.prose-yap` (globals.css); syntax colors come from the
 * highlight.js class theme also defined there.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-yap">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
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
