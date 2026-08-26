# Task: Reader — IDE Shell (rail + progress + ambient shaders + BYOK chat + chapter art)

> **Status:** In Progress
> **Source:** Owner request (in-session, 2026-07-19): Cursor-style reader layout — left
> expandable content tree with reading progress, center reading surface over an ambient
> shader layer, right AI chat panel (BYOK Gemini), per-chapter CC0 museum art.

## Context

- Bounded context / module: reader (`src/app/read/**`, `src/components/reader/**`) — frontend lane.
- Related ADRs: ADR-001 (content.ts single source of truth), ADR-002 (frontend/backend lanes).
- Related specs: `plan.md` Phase 2 (localStorage progress — confirmed direction), `specs/properties/invariants.md`.
- Existing code paths the implementer starts from:
  - `src/components/reader/ReaderChrome.tsx` (chrome, keyboard, TOC drawer — to be reworked)
  - `src/app/read/[book]/layout.tsx`, `src/app/read/[book]/[chapter]/[slide]/{page,template}.tsx`
  - `src/app/globals.css` (tokens, `.glass-*`, `.prose-yap`)
  - `src/components/{AskPanel,SearchPanel,Modal,ThemeToggle}.tsx`

## Behavioral Definition

1. **Left rail (content tree).** Desktop ≥1024px: collapsible sidebar docked left
   (expanded ~300px / collapsed to a slim strip). Chapters expand to slide lists;
   current chapter auto-expanded. Mobile: overlay drawer from the left (scrim, Escape
   or scrim-tap closes). Replaces the current right-side Contents drawer. `t` keyboard
   shortcut toggles it (unchanged binding).
2. **Reading progress (localStorage only, no accounts).** A slide is marked read when
   viewed. Tree shows: per-slide check state, per-chapter ring/percentage + `read/total`
   count. "Continue where you left off": landing CTA switches to the last-read slide;
   inside the reader a dismissible resume pill appears when landing on slide 1 with
   saved progress elsewhere.
3. **Ambient shader layer.** One `@paper-design/shaders-react` canvas mounted once in
   the shell, behind a rounded glassmorphic reading card: `MeshGradient` (light theme) /
   `DotOrbit` (dark theme). `prefers-reduced-motion` ⇒ static frame (`speed 0`). WebGL
   unavailable ⇒ error-boundary fallback to a CSS gradient. Slide content renders
   above it inside the glass card; prose styling unchanged.
4. **Chat panel (BYOK Gemini).** Right-docked panel (desktop) / overlay (mobile).
   With a user-provided Gemini API key (stored in localStorage, never sent to our
   server): streaming chat grounded in the **current slide's content** (+ conversation
   history), key entry/clear UI, error states (bad key / quota / blocked / network).
   Without a key: falls back to the existing `POST /api/ask` (contract untouched).
   Input framed by a `PulsingBorder` shader (frozen under reduced motion).
5. **Chapter art.** One portrait-orientation CC0 artwork per chapter (Art Institute of
   Chicago open access), fetched at build/curation time by `scripts/fetch-art.mjs` into
   `public/art/`, indexed by `src/lib/art-manifest.json`. Shown as a subtle backdrop in
   the rail header for the current chapter, with title/artist caption. Tree legibility
   always wins over art.

## Input Contract

- Progress store (`src/lib/progress.ts`, client-only):
  `useProgress(): ProgressData | null`, `markSlideRead(bookSlug, href): void`,
  `getLastRead(bookSlug): { href, at } | null`,
  `getLastReadOverall(): { bookSlug, href, at } | null`, plus the pure selectors
  `lastReadInBook(data, bookSlug)` / `lastReadOverall(data)`; localStorage key
  `agent-yap:progress:v2`; shape
  `{ version: 2, lastByBook: { [bookSlug]: { href, at } }, lastBook, read: { [bookSlug]: { [href]: epochMs } } }`.
  The resume pointer is **per book** (SOL-13); `lastBook` is the most-recent-overall
  pointer the landing CTA uses. The v1 key (`agent-yap:progress:v1`, global
  `lastHref`) is migrated on read and left in place — never written to, never
  deleted — so a tab still running the v1 bundle cannot blank out v2 state. A v1
  pointer that cannot be attributed to a book is dropped rather than guessed;
  `read` entries are never dropped (P-READER-002).
- Gemini client (`src/lib/chat/gemini.ts`, Codex-authored):
  `streamGeminiChat({ apiKey, model?, system, messages, temperature?, maxOutputTokens?, signal?, onChunk })` → `Promise<{ text, finishReason }>`; key helpers
  `get/set/clearStoredGeminiKey`, `looksLikeGeminiKey`. Endpoint
  `v1beta/models/{model}:streamGenerateContent?alt=sse`, header `x-goog-api-key`.
- Slide context bridge: slide `page.tsx` mounts a zero-UI client component that
  publishes `{ href, title, chapterTitle, markdown }` to a module singleton the chat
  panel subscribes to (same pattern as `nav-direction.ts`).
- Art manifest: `{ version: 1, chapters: { [chapterSlug]: { chapterNumber, artworkId, title, artist, date, file, aicUrl } } }`.

## Output Contract

| Condition | Behavior (no thrown errors reach the user) |
|---|---|
| localStorage unavailable (SSR, private mode) | progress silently no-ops; UI shows zero state |
| WebGL2 unavailable / shader throws | CSS gradient fallback, reading unaffected |
| Gemini 400 `API_KEY_INVALID` / 401 / 403 | "bad-key" state: inline prompt to re-enter key |
| Gemini 429 | "quota" state: message + retry allowed |
| Safety block | "blocked" message, conversation continues |
| No key stored | fallback mode via existing `/api/ask`, labeled in UI |
| Chapter missing from art manifest | rail renders without artwork (no broken image) |

## Properties (Invariants) — minimum 2 (C10)

### P-READER-002: Progress is monotone and local
For any sequence of slide views, the set of read hrefs only grows (until explicit
user reset), persists across reloads via localStorage, and no progress data is ever
transmitted over the network.
- Type: Monotonicity
- Source: this spec + `plan.md` Phase 2 ("no accounts")
- Verification (no test runner): manual reproduction (view slides, reload, inspect
  localStorage + network tab) + type system

### P-READER-003: Reading is never blocked by decoration
For any environment (WebGL missing, reduced motion, art manifest empty, no Gemini
key, JS storage denied), every slide remains fully readable and navigable: shader,
art, chat, and progress are strictly additive layers.
- Type: Totality
- Source: this spec
- Verification: manual reproduction (disable WebGL / block storage) + error boundary
  in code + build

### P-CHAT-001: BYOK key never leaves the browser except to Google
The Gemini API key is read/written only in localStorage and attached only to requests
whose origin is `https://generativelanguage.googleapis.com`. It is never sent to any
route under `/api/**` or any other host.
- Type: Invariant
- Source: this spec
- Verification: type system (single call site) + manual network-tab reproduction

## Pre/Post Conditions

- PRE: `npm run build` green on `feature/reader-ide-shell` before each slice lands.
- POST: build + lint green; 181 slides still statically generated; `docs/api-contract.md` byte-identical.

## Constraints

- Performance: at most 1 ambient WebGL canvas + 1 small border canvas (chat open);
  shader props referentially stable (upstream issue #275); `@paper-design/shaders-react`
  pinned exact (`0.0.77`) — upstream ships breaking changes under 0.0.x.
- SSG: no change to `generateStaticParams` semantics; the slide page may only gain a
  zero-UI client bridge mount.
- Accessibility: keyboard shortcuts preserved (`/`, `t`, arrows, Escape); glass card
  keeps ≥4.5:1 text contrast; focus states on all new controls; reduced-motion respected.
- Contract safety: the no-key fallback request body is **exactly** `{question}` —
  never slide markdown, history, or any key (C4).
- CSP: none configured in this repo today; if one is added later it MUST include
  `connect-src https://generativelanguage.googleapis.com` or BYOK chat breaks.
- Hydration: progress decoration renders neutral on server HTML and first client
  render; localStorage state applies only after mount.

## Acceptance Criteria

- [ ] Desktop shows rail | reading card | (chat when open); all three usable at 1280px.
- [ ] Mobile (375px): rail + chat are overlays; reading unaffected when closed.
- [ ] Viewing a slide marks it read; checkmark + chapter % visible in tree; survives reload.
- [ ] Landing CTA offers "Continue reading" at the saved slide when progress exists.
- [ ] Light theme renders MeshGradient, dark theme DotOrbit, behind the glass card.
- [ ] `prefers-reduced-motion: reduce` ⇒ no animating shader.
- [ ] With a Gemini key: streaming answer grounded in current slide. Without: `/api/ask` fallback works as today.
- [ ] Key stored only in localStorage; no request to `/api/**` carries it.
- [ ] Each of the 18 chapters has a portrait CC0 artwork + caption in the manifest.
- [ ] `npm run build` and `npm run lint` green.

## Examples

| Input | Expected output | Notes |
|---|---|---|
| Visit `/read/.../anatomy/2`, reload, open rail | slide 2 checkmarked, chapter shows "2/6" | happy path |
| Block localStorage, browse 3 slides | no errors; tree shows no progress | edge |
| Enter key `not-a-key`, send message | inline "that key doesn't look valid" + API bad-key error state on send | error |

## Out of Scope

- Payments/paid tier for chat (deferred product decision), accounts, server-side progress.
- LiquidMetal multi-agent landing scene (follow-up feature).
- Wiring the 5 unintegrated books (follow-up content task).
- Quiz slides / recap slides (plan.md Phase 1 — separate feature).
- Any change to `/api/search`, `/api/ask`, or their contract.

## Blast Radius (C8)

**May modify:** `src/components/reader/**` (incl. new files), `src/components/Home.tsx`,
`src/app/read/[book]/layout.tsx`, `src/app/read/[book]/[chapter]/[slide]/{page,template}.tsx`,
`src/app/globals.css`, `src/lib/progress.ts` (new), `src/lib/chat/**` (new),
`src/lib/art-manifest.json` (new), `src/lib/art.ts` (new), `scripts/fetch-art.mjs` (new),
`public/art/**` (new), `package.json`/`package-lock.json` (shaders dep only),
`specs/**` (this feature's docs), `FEATURE-STATUS.md`, `knowledge/**` (sync).

**Must NOT modify:** `src/lib/content.ts` (exclusive-access source of truth),
`docs/api-contract.md` (frozen contract), `src/lib/search.ts` / `src/lib/ask.ts` /
`src/app/api/**` (backend lane).

**Must NOT break:** static generation of all 181 slides, keyboard/swipe navigation,
search (`/`) and Ask fallback, theme toggle + no-flash boot, landing page scroll fx.
