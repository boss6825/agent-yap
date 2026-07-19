"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PulsingBorder } from "@paper-design/shaders-react";
import { useReducedMotion } from "framer-motion";
import {
  DEFAULT_GEMINI_MODEL,
  GeminiChatError,
  clearStoredGeminiKey,
  getStoredGeminiKey,
  looksLikeGeminiKey,
  setStoredGeminiKey,
  streamGeminiChat,
  type ChatMessage,
} from "@/lib/chat/gemini";
import {
  getServerSlideContext,
  getSlideContext,
  subscribeSlideContext,
} from "@/components/reader/slide-context";

/** Stable module-scope props for the border shader (paper-shaders #275). */
const BORDER_COLORS = ["#0dc1fd", "#d915ef", "#ff3f2e"];

const HISTORY_LIMIT = 12;

/** The stored key never notifies — reads happen on re-render. */
function noopSubscribe(): () => void {
  return () => {};
}

function getServerKey(): null {
  return null;
}

interface AskCitation {
  chapterNumber: number;
  chapterTitle: string;
  title: string;
  href: string;
}

interface DisplayMessage extends ChatMessage {
  citations?: AskCitation[];
}

function buildSystemPrompt(ctx: {
  chapterNumber: number;
  chapterTitle: string;
  title: string;
  markdown: string;
} | null): string {
  const base =
    "You are the reading assistant for Agent YAP, a site that teaches AI agent " +
    "engineering. Answer concisely in markdown. Ground your answers in the " +
    "current slide's content below; you may add closely related context from " +
    "AI agent engineering, but say so when you go beyond the slide. If the " +
    "question is unrelated to the material, say that briefly.";
  if (!ctx) return base;
  return (
    `${base}\n\nCURRENT SLIDE — Chapter ${ctx.chapterNumber}: ` +
    `${ctx.chapterTitle} · "${ctx.title}"\n---\n${ctx.markdown}`
  );
}

export function ChatPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const slide = useSyncExternalStore(
    subscribeSlideContext,
    getSlideContext,
    getServerSlideContext,
  );

  // Stored key via external-store read (server snapshot is null — neutral
  // HTML); explicit save/forget in this session overrides it immediately.
  const storedKey = useSyncExternalStore(
    noopSubscribe,
    getStoredGeminiKey,
    getServerKey,
  );
  const [keyOverride, setKeyOverride] = useState<string | null | undefined>(
    undefined,
  );
  const apiKey = keyOverride === undefined ? storedKey : keyOverride;
  const [keyDraft, setKeyDraft] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => composerRef.current?.focus(), 320);
      return () => clearTimeout(id);
    }
    abortRef.current?.abort();
  }, [open]);

  // Keep the newest message in view while streaming.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const hasKey = !!apiKey;

  const saveKey = useCallback(() => {
    const key = keyDraft.trim();
    if (!key) return;
    setStoredGeminiKey(key);
    setKeyOverride(key);
    setKeyDraft("");
    setError(null);
  }, [keyDraft]);

  const forgetKey = useCallback(() => {
    clearStoredGeminiKey();
    setKeyOverride(null);
    setMessages([]);
    setError(null);
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (!question || streaming) return;
      setError(null);
      setDraft("");
      setStreaming(true);

      if (hasKey && apiKey) {
        const history: ChatMessage[] = [
          ...messages.slice(-HISTORY_LIMIT).map(({ role, text }) => ({ role, text })),
          { role: "user", text: question },
        ];
        setMessages((m) => [
          ...m,
          { role: "user", text: question },
          { role: "model", text: "" },
        ]);
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          await streamGeminiChat({
            apiKey,
            model: DEFAULT_GEMINI_MODEL,
            system: buildSystemPrompt(slide),
            messages: history,
            signal: controller.signal,
            onChunk: (delta) => {
              setMessages((m) => {
                const next = m.slice();
                const last = next[next.length - 1];
                if (last?.role === "model") {
                  next[next.length - 1] = { ...last, text: last.text + delta };
                }
                return next;
              });
            },
          });
        } catch (e) {
          const err = e instanceof GeminiChatError ? e : null;
          if (err?.kind === "aborted") {
            // Keep whatever streamed in; no error banner.
          } else if (err?.kind === "bad-key") {
            setError(
              "Google rejected that API key. Check it (or create a new one) and save it again.",
            );
          } else if (err?.kind === "quota") {
            setError("Your Gemini quota is exhausted right now — try again in a bit.");
          } else if (err?.kind === "blocked") {
            setError("Gemini declined to answer that one (safety block).");
          } else {
            setError(err?.message ?? "The request failed. Check your connection and retry.");
          }
          // Drop an empty placeholder bubble if nothing streamed.
          setMessages((m) =>
            m[m.length - 1]?.role === "model" && m[m.length - 1].text === ""
              ? m.slice(0, -1)
              : m,
          );
        } finally {
          setStreaming(false);
        }
        return;
      }

      // Fallback: the site's own grounded Ask endpoint. The body is exactly
      // { question } — never slide content, history, or any key (C4, P-CHAT-001).
      setMessages((m) => [...m, { role: "user", text: question }]);
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });
        if (!res.ok) throw new Error(`Ask failed (${res.status})`);
        const data = (await res.json()) as {
          answer: string;
          citations?: AskCitation[];
        };
        setMessages((m) => [
          ...m,
          { role: "model", text: data.answer, citations: data.citations },
        ]);
      } catch {
        setError("The site assistant isn’t reachable right now. Try search instead.");
      } finally {
        setStreaming(false);
      }
    },
    [apiKey, hasKey, messages, slide, streaming],
  );

  const onComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(draft);
    }
  };

  const contextChip = useMemo(() => {
    if (!slide) return null;
    return `Ch ${String(slide.chapterNumber).padStart(2, "0")} · ${slide.title}`;
  }, [slide]);

  return (
    <>
      {/* mobile scrim */}
      {open && (
        <div
          onClick={onClose}
          aria-hidden
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        aria-label="Chat panel"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        className={`glass-light fixed inset-y-0 right-0 z-50 overflow-hidden transition-transform duration-300 ease-out lg:relative lg:z-10 lg:translate-x-0 lg:transition-[width] ${
          open ? "translate-x-0" : "translate-x-full"
        } ${
          open
            ? "lg:w-[380px] lg:border-l lg:border-hairline"
            : "lg:w-0 lg:border-l-0"
        } border-l border-hairline`}
      >
        <div className="flex h-full w-[min(400px,92vw)] flex-col lg:w-[380px]">
          {/* header */}
          <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3">
            <div className="min-w-0">
              <span className="block font-display text-[15px] font-semibold text-ink">
                Chat with this page
              </span>
              {contextChip && (
                <span className="block truncate text-[11px] text-ink-2">
                  {hasKey ? contextChip : "site-wide answers · no page context"}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {hasKey && (
                <button
                  type="button"
                  onClick={forgetKey}
                  title="Forget my API key"
                  className="flex h-8 cursor-pointer items-center rounded-pill px-2.5 text-[11px] text-ink-2 transition-colors hover:bg-canvas-2 hover:text-ink"
                >
                  Forget key
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close chat"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-pill text-ink-2 transition-colors hover:bg-canvas-2 hover:text-ink"
              >
                ✕
              </button>
            </div>
          </div>

          {/* body */}
          {!hasKey && messages.length === 0 ? (
            <KeyOnboarding
              keyDraft={keyDraft}
              setKeyDraft={setKeyDraft}
              onSave={saveKey}
              onSkip={() => setMessages([{ role: "model", text: FALLBACK_INTRO }])}
            />
          ) : (
            <div
              ref={scrollRef}
              className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-3"
            >
              {messages.length === 0 && (
                <div className="flex flex-col gap-2 pt-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.10em] text-ink-2">
                    Try asking
                  </span>
                  {[
                    "Explain this page like I'm new to agents",
                    "Give me a concrete example of this idea",
                    "How would this fail in production?",
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="cursor-pointer rounded-xl bg-canvas-2/80 px-3 py-2 text-left text-[13px] text-ink-2 transition-colors hover:bg-canvas-3 hover:text-ink"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3">
                {messages.map((m, i) => (
                  <MessageBubble key={i} message={m} onCitationClick={onClose} />
                ))}
                {streaming &&
                  messages[messages.length - 1]?.role !== "model" && (
                    <div className="flex items-center gap-2 text-xs text-ink-2">
                      <span className="h-2 w-2 animate-pulse rounded-pill bg-blue" />
                      Thinking…
                    </div>
                  )}
              </div>

              {error && (
                <p className="mt-3 rounded-xl bg-canvas-2 px-3 py-2 text-[13px] text-ink-2">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* composer */}
          {(hasKey || messages.length > 0) && (
            <div className="border-t border-hairline p-3">
              <div className="relative min-h-[56px] rounded-2xl">
                {hasKey && (
                  <PulsingBorder
                    colors={BORDER_COLORS}
                    colorBack="#00000000"
                    roundness={0.35}
                    thickness={0.08}
                    softness={0.75}
                    intensity={0.2}
                    bloom={0.25}
                    spots={4}
                    spotSize={0.5}
                    pulse={0.25}
                    smoke={0.3}
                    smokeSize={0.6}
                    speed={reduced ? 0 : 1}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  />
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send(draft);
                  }}
                  className={`relative flex items-end gap-2 rounded-2xl px-3 py-2 ${
                    hasKey
                      ? "m-[5px] bg-canvas/90 rounded-xl"
                      : "border border-hairline bg-canvas-2/80"
                  }`}
                >
                  <textarea
                    ref={composerRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onComposerKeyDown}
                    rows={2}
                    placeholder={
                      hasKey
                        ? "Ask about this page…"
                        : "Ask the docs (site-wide)…"
                    }
                    className="max-h-40 flex-1 resize-none bg-transparent py-1 text-sm text-ink outline-none placeholder:text-ink-2/60"
                  />
                  <button
                    type="submit"
                    disabled={streaming || !draft.trim()}
                    aria-label="Send"
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-pill bg-blue text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    ↑
                  </button>
                </form>
              </div>
              {!hasKey && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="mt-2 cursor-pointer text-[11px] text-blue hover:underline"
                >
                  Use your own Gemini key for page-aware chat →
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

const FALLBACK_INTRO =
  "You're chatting with the site's built-in assistant — answers are grounded " +
  "in the whole knowledge base and cite their sources, but it can't see the " +
  "page you're reading. Add your own Gemini key any time for page-aware chat.";

function KeyOnboarding({
  keyDraft,
  setKeyDraft,
  onSave,
  onSkip,
}: {
  keyDraft: string;
  setKeyDraft: (v: string) => void;
  onSave: () => void;
  onSkip: () => void;
}) {
  const hintInvalid = keyDraft.trim().length > 0 && !looksLikeGeminiKey(keyDraft);
  return (
    <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-5">
      <p className="text-sm leading-relaxed text-ink-2">
        Chat about <span className="font-medium text-ink">exactly what you&apos;re reading</span>{" "}
        by bringing your own Google Gemini API key. The key is stored only in
        this browser and sent only to Google — never to our servers.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        className="mt-4 flex flex-col gap-2"
      >
        <input
          type="password"
          value={keyDraft}
          onChange={(e) => setKeyDraft(e.target.value)}
          placeholder="AIza…"
          autoComplete="off"
          className="rounded-xl border border-hairline bg-canvas-2/80 px-3 py-2.5 text-sm text-ink outline-2 -outline-offset-1 outline-transparent transition-[outline-color] focus:outline-blue"
        />
        {hintInvalid && (
          <span className="text-[11px] text-ink-2">
            Gemini keys usually start with “AIza” — double-check before saving.
          </span>
        )}
        <button
          type="submit"
          disabled={!keyDraft.trim()}
          className="cursor-pointer rounded-pill bg-blue px-4 py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Save key in this browser
        </button>
      </form>
      <div className="mt-3 flex flex-col gap-1.5 text-[12px]">
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="text-blue hover:underline"
        >
          Get a free key from Google AI Studio ↗
        </a>
        <button
          type="button"
          onClick={onSkip}
          className="cursor-pointer text-left text-ink-2 hover:text-ink"
        >
          Skip — use the site assistant without a key
        </button>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onCitationClick,
}: {
  message: DisplayMessage;
  onCitationClick: () => void;
}) {
  if (message.role === "user") {
    return (
      <div className="ml-8 self-end rounded-2xl rounded-br-md bg-blue/10 px-3 py-2 text-sm text-ink">
        {message.text}
      </div>
    );
  }
  return (
    <div className="mr-2 self-start">
      <div className="prose-yap text-[13.5px] [&_pre]:text-xs">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.text || "…"}
        </ReactMarkdown>
      </div>
      {message.citations && message.citations.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 border-t border-hairline pt-2">
          {message.citations.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                onClick={onCitationClick}
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-[12px] transition-colors hover:bg-canvas-2"
              >
                <span className="shrink-0 font-semibold tabular-nums text-ink-2">
                  {String(c.chapterNumber).padStart(2, "0")}
                </span>
                <span className="truncate font-medium text-ink">{c.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
