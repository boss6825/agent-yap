"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Modal } from "@/components/Modal";
import { chapterAccent } from "@/lib/chapter-color";

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
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="text-accent" style={{ ["--accent" as string]: "#c2f24a" }} aria-hidden>
            ✦
          </span>
          <span className="font-display text-lg font-bold">Ask the docs</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          An AI assistant grounded only in this knowledge base — answers cite the
          sections they came from.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-ink px-3 focus-within:border-lime"
        >
          <input
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about designing agents…"
            className="flex-1 bg-transparent py-3 text-paper outline-none placeholder:text-faint"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="rounded-lg bg-lime px-3 py-1.5 text-sm font-bold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "…" : "Ask"}
          </button>
        </form>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {!answer && !loading && !error && (
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-faint">
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
                className="rounded-lg border border-line px-3 py-2 text-left text-sm text-muted transition-colors hover:border-lime hover:text-paper"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-lime" />
            Reading the knowledge base…
          </div>
        )}

        {error && <p className="text-sm text-muted">{error}</p>}

        {answer && (
          <div className="flex flex-col gap-4">
            {answer.configured === false && (
              <p className="rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-sm text-amber">
                The AI assistant isn’t configured yet, but here are the most
                relevant sections.
              </p>
            )}
            {answer.answer && (
              <div className="prose-yap" style={{ ["--accent" as string]: "#c2f24a" }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {answer.answer}
                </ReactMarkdown>
              </div>
            )}
            {answer.citations?.length > 0 && (
              <div className="border-t border-line pt-3">
                <span className="text-xs uppercase tracking-wider text-faint">
                  Sources
                </span>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {answer.citations.map((c) => {
                    const accent = chapterAccent(c.chapterNumber);
                    return (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          onClick={onClose}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-ink-3"
                        >
                          <span
                            className="grid h-5 w-5 shrink-0 place-items-center rounded font-display text-[10px] font-bold"
                            style={{ background: accent.hex, color: accent.on }}
                          >
                            {c.chapterNumber}
                          </span>
                          <span className="font-medium text-paper">{c.title}</span>
                          <span className="truncate text-xs text-faint">
                            · {c.chapterTitle}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
