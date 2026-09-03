"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";

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
    const t = setTimeout(
      async () => {
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
      },
      q ? 180 : 0,
    );
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
      <div className="field-ring flex items-center gap-3 border-b border-hairline px-4">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="text-ink-2"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path
            d="M20 20l-3.2-3.2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search chapters and sections…"
          // The ring lives on the `.field-ring` row, not the bare input.
          className="flex-1 bg-transparent py-4 text-[17px] text-ink outline-none"
        />
        <kbd className="hidden rounded-md border border-hairline px-1.5 py-0.5 font-mono text-[11px] text-ink-2 sm:block">
          esc
        </kbd>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {error && <p className="px-5 py-6 text-sm text-ink-2">{error}</p>}
        {!error && query.trim() && !loading && results.length === 0 && (
          <p className="px-5 py-6 text-sm text-ink-2">
            No matches for “{query.trim()}”.
          </p>
        )}
        {!query.trim() && (
          <p className="px-5 py-6 text-sm text-ink-2/70">
            Type to search all chapters — try “tool design”, “retries”, or
            “context”.
          </p>
        )}
        <ul>
          {results.map((r, i) => (
            <li key={r.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => open_(r.href)}
                className={`flex w-full cursor-pointer flex-col gap-1 border-b border-hairline px-5 py-3 text-left transition-colors ${
                  i === active ? "bg-canvas-2" : "hover:bg-canvas-2/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-2">
                    {String(r.chapterNumber).padStart(2, "0")}
                  </span>
                  <span className="font-display text-sm font-semibold text-ink">
                    {r.title}
                  </span>
                  <span className="truncate text-xs text-ink-2">
                    · {r.chapterTitle}
                  </span>
                </span>
                <span className="line-clamp-2 text-sm text-ink-2">
                  {r.snippet}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
