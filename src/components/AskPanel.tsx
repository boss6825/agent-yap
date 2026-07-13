"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Modal } from "@/components/Modal";

interface Citation {
  chapterNumber: number;
  chapterTitle: string;
  title: string;
  href: string;
}
interface AskResponse {
  answer: string;
  citations: Citation[];
  configured?: boolean;
}

const SUGGESTIONS = [
  "What makes a good tool description?",
  "When should I use RAG vs. long context?",
  "How do I make an agent loop terminate safely?",
];

export function AskPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(id);
    }
    // Reset for next time. Done async so no setState runs in the effect body.
    const id = setTimeout(() => {
      setQuestion("");
      setAnswer(null);
      setError(null);
      setLoading(false);
    }, 0);
    return () => clearTimeout(id);
  }, [open]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error(`Ask failed (${res.status})`);
      setAnswer((await res.json()) as AskResponse);
    } catch {
      setError("The assistant isn’t available yet. Try the search instead.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} label="Ask the docs">
      <div className="border-b border-hairline px-5 py-4">
        <span className="font-display text-[17px] font-semibold text-ink">
          Ask the docs
        </span>
        <p className="mt-1 text-sm text-ink-2">
          An AI assistant grounded only in this knowledge base — answers cite
          the sections they came from.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="mt-3 flex items-center gap-2 rounded-xl bg-canvas-2 px-3 outline-2 -outline-offset-1 outline-transparent transition-[outline-color] focus-within:outline-blue"
        >
          <input
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about designing agents…"
            className="flex-1 bg-transparent py-3 text-ink outline-none placeholder:text-ink-2/60"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="cursor-pointer rounded-pill bg-blue px-3.5 py-1.5 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "…" : "Ask"}
          </button>
        </form>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {!answer && !loading && !error && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.10em] text-ink-2">
              Try asking
            </span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuestion(s);
                  ask(s);
                }}
                className="cursor-pointer rounded-xl bg-canvas-2 px-3 py-2 text-left text-sm text-ink-2 transition-colors hover:bg-canvas-3 hover:text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-ink-2">
            <span className="h-2 w-2 animate-pulse rounded-pill bg-blue" />
            Reading the knowledge base…
          </div>
        )}

        {error && <p className="text-sm text-ink-2">{error}</p>}

        {answer && (
          <div className="flex flex-col gap-4">
            {answer.configured === false && (
              <p className="rounded-xl bg-canvas-2 px-3 py-2 text-sm text-ink-2">
                The AI assistant isn’t configured yet, but here are the most
                relevant sections.
              </p>
            )}
            {answer.answer && (
              <div className="prose-yap text-[15px]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {answer.answer}
                </ReactMarkdown>
              </div>
            )}
            {answer.citations?.length > 0 && (
              <div className="border-t border-hairline pt-3">
                <span className="text-xs font-semibold uppercase tracking-[0.10em] text-ink-2">
                  Sources
                </span>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {answer.citations.map((c) => (
                    <li key={c.href}>
                      <Link
                        href={c.href}
                        onClick={onClose}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-canvas-2"
                      >
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-2">
                          {String(c.chapterNumber).padStart(2, "0")}
                        </span>
                        <span className="font-medium text-ink">{c.title}</span>
                        <span className="truncate text-xs text-ink-2">
                          · {c.chapterTitle}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
