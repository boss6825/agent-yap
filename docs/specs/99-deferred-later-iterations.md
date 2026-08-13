# Spec 99 — Deferred / later-iteration features

> **What this is.** Everything we consciously pushed to a later iteration — because it's too
> big for one pass, needs infrastructure we don't have yet (accounts, sandbox, push), or was
> ruled out. Nothing here is forgotten; each item has a reason and a rough trigger. When one
> becomes "now," it graduates to its own numbered spec via `/define` or `/prd-to-spec`.

---

## Big features that need new infrastructure

### Coding questions + sandboxed execution
- **What:** questions that ask the reader to *write* part of an agent (a system prompt, a
  tool definition, the agentic loop) and run it **against test cases**.
- **Why deferred:** running untrusted code safely = a sandbox (containers/WASM/isolated
  workers), a test harness, and result plumbing. That's a whole subsystem.
- **Trigger:** after the reading + MCQ quiz experience ([07](07-quiz-experience.md)) is solid
  and we've decided the execution substrate. Feeds "worked examples" too (below).
- **Note:** the assessment engine already has non-code check types — use those until then.

### Reminders & notifications
- **What:** revision reminders for **notes**, and "come back to this" nudges for **bookmarks**
  (your A8); streak nudges.
- **Why deferred:** needs (a) **accounts/identity** (app is localStorage-only, no accounts
  today — `plan.md` Phase 2), (b) a server-side schedule, (c) a delivery channel (email /
  web-push), and it's **explicitly excluded** in redesign-2026 (`09-ia-and-flows.md` §8).
- **Prereq:** the notes/bookmark **capture** ([06](06-notes-and-bookmarks.md)) stores a
  reminder-ready schema now, so the data's ready when we build this.
- **Trigger:** the "accounts + backend" milestone. Then spec channel + cadence + opt-in/quiet-hours.

### Accounts & cross-device sync
- **What:** identity so streaks, plans, notes, and progress follow a reader across devices.
- **Why deferred:** deliberate Phase-2 decision to stay local/no-accounts. Everything in specs
  04–06 is written local-first so it migrates cleanly when accounts arrive.

### Leaderboard & social / streak sharing
- **What:** ranks, medals, shared streaks.
- **Why deferred:** needs accounts + a backend, and redesign-2026 refused competitive pressure.
  Keep **opt-in** and only once there's an audience. Our streak ([04](04-streaks-and-progress.md))
  is local and non-competitive by design.

---

## Content work to do over time (not a single pass)

### "Now your turn" MCQ *retrofit* into existing chapters
- The inline problem-before-explanation pattern is already spec'd, but **inserting** checks
  across all existing chapters touches many content files + the parser. Do it chapter-by-chapter
  after the authoring format (01/02) and engine interface (07) are settled — you flagged this as
  "modifies a lot of current files," which is exactly why it's staged.

### Advanced OSS-explainer authoring at scale
- The *system* ships in [02](02-basic-advanced-depth.md); **populating** advanced sections for
  many topics (from Codex / Claude Code / OpenClaw / Hermes / etc.) is ongoing authoring you
  drive via the cowork skill, topic by topic. Confirm the OSS excerpt/licensing policy first.

### Worked examples
- Full worked solutions (à la TUF editorials) make sense **once coding questions exist** — they
  pair. Until then, the Advanced layer covers "how it's really built."

---

## UX overhauls (have a lightweight version now)

### Command-palette overhaul
- **Now:** a ⌘K-style search already exists ([SearchPanel](../../src/components/SearchPanel.tsx));
  redesign-2026 spec's a ⌘K palette replacing it (`09-ia-and-flows.md` §2).
- **Your note:** current one is "surface level" — you want a genuinely good palette (fuzzy nav to
  any chapter/slide/action, recent, commands). **This deserves its own design chat + spec** — do
  not fold it into the small reader-actions work. Parked here as a named follow-up.

### Draggable / resizable reader panels
- TUF's "study as you like." Nice, not essential; adds layout-persistence complexity. Revisit
  after the core reader modes ([03](03-reader-modes-and-actions.md)) land.

### Right-pane interactive panel
- A dedicated right pane hosting **Ask-the-docs inline** or a **runnable code sample**. Overlaps
  with coding-questions/sandbox infra; revisit alongside that.

---

## Ruled out (for now)

- **Company tags** (TUF's "which companies asked this") — not relevant to our audience/content.
- **Video-first delivery** — we're text-first by choice; invest in prose + diagrams instead.
- **A second visual skin for Free mode** — Free mode is a visibility toggle, not a reskin ([03](03-reader-modes-and-actions.md)).
- **Warm/orange palette + gradient cards** — contradicts our decided cool, gradient-free identity ([08](08-visual-system.md)).
