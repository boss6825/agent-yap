"use client";

/**
 * Reading progress — localStorage only, by design (plan.md Phase 2: no accounts,
 * no server-side progress). The whole module no-ops when storage is unavailable,
 * and consumers render a neutral zero-state until after mount so server HTML and
 * the first client render always match (P-READER-002, P-READER-003).
 *
 * ## v2: the resume pointer is per book
 *
 * v1 stored one global `lastHref`, so a reader with more than one book could only
 * ever resume the most recent one; opening book B destroyed book A's position.
 * v2 keys the pointer by book (`lastByBook`) and keeps a separate "most recent
 * overall" pointer (`lastBook`) for the landing CTA. `read` is unchanged.
 *
 * ## Migration
 *
 * v2 lives under a **new key**; the v1 blob is read but never written to or
 * deleted. That matters during a deploy: a tab still running the v1 bundle keeps
 * its own key working, and its version gate (`version !== 1` → reset) can never
 * blank out a v2 payload it does not understand. Migration is pure and derived on
 * read — nothing is persisted until the reader actually marks a slide read, at
 * which point v2 becomes authoritative.
 *
 * A v1 `lastHref` is attributed to a book by looking it up in the (already
 * book-keyed) `read` map, falling back to the canonical `/read/<book>/<ch>/<n>`
 * route shape. A pointer that cannot be attributed is **dropped**: no resume beats
 * a resume that lands in the wrong book. `read` entries are never dropped.
 */
import { useSyncExternalStore } from "react";

const LEGACY_KEY = "agent-yap:progress:v1";
const STORAGE_KEY = "agent-yap:progress:v2";

/** Where the reader stopped inside one book. */
export interface ResumePointer {
  href: string;
  at: number;
}

/** A resume pointer plus the book it belongs to. */
export interface BookResumePointer extends ResumePointer {
  bookSlug: string;
}

export interface ProgressData {
  version: 2;
  /** bookSlug → the most recently read slide in that book. */
  lastByBook: Record<string, ResumePointer>;
  /** Book holding the most recent pointer overall — drives the landing CTA. */
  lastBook: string | null;
  /** bookSlug → href → epoch ms first marked read. Grows monotonically. */
  read: Record<string, Record<string, number>>;
}

function emptyProgress(): ProgressData {
  return { version: 2, lastByBook: {}, lastBook: null, read: {} };
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Keeps every well-formed read entry; only malformed ones are discarded. */
function parseRead(raw: unknown): ProgressData["read"] {
  if (!isPlainObject(raw)) return {};
  const out: ProgressData["read"] = {};
  for (const [bookSlug, hrefs] of Object.entries(raw)) {
    if (!isPlainObject(hrefs)) continue;
    const inner: Record<string, number> = {};
    for (const [href, at] of Object.entries(hrefs)) {
      if (typeof at === "number" && Number.isFinite(at)) inner[href] = at;
    }
    out[bookSlug] = inner;
  }
  return out;
}

function parseLastByBook(raw: unknown): ProgressData["lastByBook"] {
  if (!isPlainObject(raw)) return {};
  const out: ProgressData["lastByBook"] = {};
  for (const [bookSlug, pointer] of Object.entries(raw)) {
    if (!isPlainObject(pointer)) continue;
    const { href, at } = pointer;
    if (typeof href !== "string" || href.length === 0) continue;
    if (typeof at !== "number" || !Number.isFinite(at)) continue;
    out[bookSlug] = { href, at };
  }
  return out;
}

/** Canonical slide route: `/read/<bookSlug>/<chapterSlug>/<sectionIndex>`. */
const SLIDE_HREF = /^\/read\/([^/]+)\/[^/]+\/\d+$/;

/**
 * Which book does this href belong to? The book-keyed `read` map is authoritative;
 * the route shape is the fallback. `null` means "unattributable" — the caller must
 * drop the pointer rather than guess.
 */
function bookSlugForHref(href: string, read: ProgressData["read"]): string | null {
  for (const [bookSlug, hrefs] of Object.entries(read)) {
    if (Object.prototype.hasOwnProperty.call(hrefs, href)) return bookSlug;
  }
  return SLIDE_HREF.exec(href)?.[1] ?? null;
}

/** Defensive parse: any corruption or version mismatch resets to zero-state. */
function parseV2(raw: string): ProgressData {
  try {
    const data: unknown = JSON.parse(raw);
    if (!isPlainObject(data) || data.version !== 2) return emptyProgress();
    const lastByBook = parseLastByBook(data.lastByBook);
    const lastBook =
      typeof data.lastBook === "string" && data.lastBook in lastByBook
        ? data.lastBook
        : null;
    return { version: 2, lastByBook, lastBook, read: parseRead(data.read) };
  } catch {
    return emptyProgress();
  }
}

/** Read-only v1 → v2 lift. Never writes to, and never deletes, the v1 blob. */
function migrateV1(raw: string): ProgressData {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return emptyProgress();
  }
  if (!isPlainObject(data) || data.version !== 1) return emptyProgress();

  const read = parseRead(data.read);
  const href = typeof data.lastHref === "string" ? data.lastHref : null;
  const at =
    typeof data.lastReadAt === "number" && Number.isFinite(data.lastReadAt)
      ? data.lastReadAt
      : null;
  const bookSlug = href ? bookSlugForHref(href, read) : null;

  if (!href || at === null || !bookSlug) {
    // The read set still migrates; only the unattributable pointer is dropped.
    return { version: 2, lastByBook: {}, lastBook: null, read };
  }
  return {
    version: 2,
    lastByBook: { [bookSlug]: { href, at } },
    lastBook: bookSlug,
    read,
  };
}

/** v2 wins whenever its key exists at all; v1 is only consulted before that. */
function readFromStorage(): ProgressData {
  const store = storage();
  if (!store) return emptyProgress();
  let current: string | null = null;
  let legacy: string | null = null;
  try {
    current = store.getItem(STORAGE_KEY);
    legacy = store.getItem(LEGACY_KEY);
  } catch {
    return emptyProgress();
  }
  if (current !== null) return parseV2(current);
  if (legacy !== null) return migrateV1(legacy);
  return emptyProgress();
}

let cached: ProgressData | null = null;
const listeners = new Set<() => void>();
let storageListenerBound = false;

function load(): ProgressData {
  if (cached) return cached;
  cached = readFromStorage();
  return cached;
}

function notify() {
  for (const cb of listeners) cb();
}

function persist(data: ProgressData) {
  cached = data;
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota / private mode: progress lives only in memory for this session.
  }
  notify();
}

function bindCrossTabSync() {
  if (storageListenerBound || typeof window === "undefined") return;
  storageListenerBound = true;
  window.addEventListener("storage", (e) => {
    // `key === null` is a whole-store clear(). Either key can change the answer,
    // so re-resolve through the same v2-then-v1 precedence rather than guessing.
    if (e.key !== null && e.key !== STORAGE_KEY && e.key !== LEGACY_KEY) return;
    cached = null;
    load();
    notify();
  });
}

/** Idempotent: re-marking a read slide only updates that book's resume pointer. */
export function markSlideRead(bookSlug: string, href: string): void {
  const data = load();
  const already = data.read[bookSlug]?.[href] !== undefined;
  const now = Date.now();
  persist({
    version: 2,
    lastByBook: { ...data.lastByBook, [bookSlug]: { href, at: now } },
    lastBook: bookSlug,
    read: already
      ? data.read
      : {
          ...data.read,
          [bookSlug]: { ...data.read[bookSlug], [href]: now },
        },
  });
}

/* --------------------------------- selectors -------------------------------- */

/** Where the reader stopped in one specific book. */
export function lastReadInBook(
  data: ProgressData | null,
  bookSlug: string,
): ResumePointer | null {
  return data?.lastByBook[bookSlug] ?? null;
}

/**
 * The most recent pointer across every book — what "Continue reading" on the
 * landing page means. `lastBook` is preferred; if it has gone stale the newest
 * per-book pointer wins, so the CTA never silently loses a real position.
 */
export function lastReadOverall(
  data: ProgressData | null,
): BookResumePointer | null {
  if (!data) return null;
  const lastBook = data.lastBook;
  const preferred = lastBook ? data.lastByBook[lastBook] : undefined;
  if (lastBook && preferred) return { bookSlug: lastBook, ...preferred };
  let best: BookResumePointer | null = null;
  for (const [bookSlug, pointer] of Object.entries(data.lastByBook)) {
    if (!best || pointer.at > best.at) best = { bookSlug, ...pointer };
  }
  return best;
}

export function getLastRead(bookSlug: string): ResumePointer | null {
  return lastReadInBook(load(), bookSlug);
}

export function getLastReadOverall(): BookResumePointer | null {
  return lastReadOverall(load());
}

function subscribe(cb: () => void): () => void {
  bindCrossTabSync();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): ProgressData {
  return load();
}

function getServerSnapshot(): ProgressData | null {
  return null;
}

/**
 * Live progress for client components. Server HTML and the hydration render
 * see `null` (neutral zero-state — no mismatch); immediately after hydration
 * the real snapshot applies, and it stays in sync with writes from this tab
 * and, via the `storage` event, other tabs.
 */
export function useProgress(): ProgressData | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
