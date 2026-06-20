"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { chapterAccent } from "@/lib/chapter-color";

interface SearchResult {
  id: string;
  chapterNumber: number;
  chapterTitle: string;
  sectionIndex: number;
  title: string;
  snippet: string;
  href: string;
  score: number;
}

export function SearchPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(id);
    }
    // Reset for next time. Done async so no setState runs in the effect body.
    const id = setTimeout(() => {
      setQuery("");
      setResults([]);
      setActive(0);
      setError(null);
      setLoading(false);
    }, 0);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      if (!q) {
        setResults([]);
        setActive(0);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const data = await res.json();
        setResults(data.results ?? []);
        setActive(0);
        setError(null);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError("Search isn’t available yet.");
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, q ? 180 : 0);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  function open_(href: string) {
    onClose();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      open_(results[active].href);
    }
  }

  return (
    <Modal open={open} onClose={onClose} label="Search the knowledge base">
      <div className="flex items-center gap-3 border-b border-line px-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-faint">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search chapters and sections…"
          className="flex-1 bg-transparent py-4 text-lg text-paper outline-none placeholder:text-faint"
        />
        <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[11px] text-faint sm:block">
          esc
        </kbd>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {error && (
          <p className="px-5 py-6 text-sm text-muted">{error}</p>
        )}
        {!error && query.trim() && !loading && results.length === 0 && (
          <p className="px-5 py-6 text-sm text-muted">
            No matches for “{query.trim()}”.
          </p>
        )}
        {!query.trim() && (
          <p className="px-5 py-6 text-sm text-faint">
            Type to search all {""}
            chapters — try “tool design”, “retries”, or “context”.
          </p>
        )}
        <ul>
          {results.map((r, i) => {
            const accent = chapterAccent(r.chapterNumber);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => open_(r.href)}
                  className={`flex w-full flex-col gap-1 border-b border-line px-5 py-3 text-left transition-colors ${
                    i === active ? "bg-ink-3" : "hover:bg-ink-3/60"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="grid h-5 w-5 shrink-0 place-items-center rounded font-display text-[10px] font-bold"
                      style={{ background: accent.hex, color: accent.on }}
                    >
                      {r.chapterNumber}
                    </span>
                    <span className="font-display text-sm font-semibold text-paper">
                      {r.title}
                    </span>
                    <span className="truncate text-xs text-faint">
                      · {r.chapterTitle}
                    </span>
                  </span>
                  <span className="line-clamp-2 text-sm text-muted">
                    {r.snippet}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}
