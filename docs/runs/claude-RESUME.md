# RESUME STATE — Agent YAP M0–M3 build (Claude lane)

> Written 2026-08-26 19:50 IST when the session paused on a token quota.
> **Read this file first, then `docs/runs/claude-RUNLOG.md` for the detail.**

## Where the work lives

| | |
|---|---|
| **Branch** | `claude/yaps` (off `d55d2da`) — **not pushed** |
| **Worktree** | `C:/Users/arpit/Projects/agent-YAP-claude` — **work here, not in the primary tree** |
| **Primary tree** | `C:/Users/arpit/Projects/agent YAP` is on `karsaa/yaps-build` and belongs to **Cursor**, which is running the same queue. Never read, write, or run anything there. Port **3005 is theirs** (PID 3672 at the time of writing) |
| **HEAD at pause** | `824a8de docs: log SOL-9 in the Claude run log` — working tree clean |

Cursor has independently committed SOL-9, SOL-10, SOL-12, SOL-13, SOL-20 on
`karsaa/yaps-build`. **Do not cherry-pick or merge their work.** This lane builds its own
implementations.

## Done (7 of 23) — all committed on `claude/yaps`

| Issue | Commit | What |
|---|---|---|
| SOL-5 | `70c1043` | `rehype-raw` — 264 `<details>` answers now render |
| SOL-6 | `a380684` | relative `.md` → reader routes + `markdown-links.ts` |
| SOL-7 | `a2cf702` | mermaid as a lazy client island, themed from tokens |
| SOL-12 | `09bd073` | scramble a11y — `sr-only` real text + `aria-hidden` |
| SOL-13 | `6a43b82` | per-book resume pointer, v1→v2 localStorage migration |
| SOL-14 | `e53e8f1` | nav manifest de-dup, 105,221 → 53,852 bytes (−48.8%) |
| SOL-9 | `2a4c724` | Space unbound from next-slide + stage paging |

Each has a `docs:` log commit after it and **one `[claude]` comment posted on the Linear
issue**. Issue statuses were deliberately left unchanged (Cursor is running the same queue;
status would thrash).

## Next up — resume exactly here

**SOL-10 was dispatched and interrupted before it ran. Start there.** Then, in order:

```
Wave 2 (remaining):  SOL-10  →  SOL-11          (share the three panel files — SERIAL)
Wave 3:              SOL-15 / 16 / 17 / 18 / 19 (content.ts, exclusive-access, ONE branch,
                                                 four commits, build green at each)
Wave 4:              SOL-20, 21, 22, 23, 24, 25, 26, 29, 27   (SOL-27 LAST;
                                                 SOL-21..25 need SOL-16 merged first)
```

Subagent types: `yap-reader-fix` → SOL-10, 11, 29 · `yap-parser` → SOL-15/16/17/18/19 (never
two at once) · `yap-content-wiring` → SOL-20…27.

**Out of scope, do not touch:** SOL-8 (human reading task), SOL-28 (rights decision),
SOL-30–36 (Paper redesign / M4), SOL-37–40 (epics needing splitting + human decisions).

## Per-issue loop (unchanged)

1. Fetch the issue from Linear (team SOL, project "Agent YAP") — the body is the spec.
2. Dispatch the right subagent with the full issue body + the hazards below.
3. Require real browser verification, `npm run build` **and** `npm run lint` green.
4. Commit on `claude/yaps`, author `boss6825 <arpitsolanki6825@gmail.com>`.
5. Append a section to `docs/runs/claude-RUNLOG.md` and commit it separately.
6. Post ONE `[claude]`-prefixed comment on the Linear issue. **Do not change its status.**

## Hard-won tooling facts — do not re-derive these

1. **Run subagents ONE AT A TIME.** Concurrent Turbopack builds in one `.next` corrupt each
   other, and the build is the only trust gate this repo has.
2. **`preview_start {name:"dev"}` does not work in a worktree.** The harness resolves
   `.claude/launch.json` from the *session* cwd, and `autoPort` is inert because
   `package.json` hardcodes `next dev -p 3005`. **Recipe that works:** `npm run build`, then
   `npx next start -p <free port>` in a background shell, then `preview_start {url: "http://localhost:<port>"}`.
3. **`read_page` is NOT an accessibility tree.** It is DOM-derived: it does not prune
   `aria-hidden` and does not compute accessible names. Use Playwright's ARIA snapshot.
4. **`computer{action:"key"}` is unreliable** — space arrives as `key:""`. Use Playwright's
   `page.keyboard.press(...)` and validate the instrument against a known-bad baseline first.
5. **`computer{action:"screenshot"}` fails in this session** ("the Browser pane is not
   displayed"). Substitute computed styles, DOM dumps and ARIA snapshots — and say so.
6. **Playwright MCP writes `.playwright-mcp/` into the session cwd — i.e. Cursor's tree**,
   where it is not gitignored. Delete it after every Playwright use.
7. **Do not use a junctioned `node_modules`** — Turbopack rejects it with
   `Symlink [project]/node_modules is invalid`. The worktree has a real `npm ci` install.
8. **Long heredocs crash this shell.** Write long files with the Write tool, then
   `cat file >> target`.

## Standing hazards for every remaining issue

- **Issue citations are unreliable.** Every one of the 7 issues so far had at least one wrong
  `file:line`: SOL-12 named `src/lib/fx.ts` (does not exist — it is
  `src/components/home/fx.ts`), SOL-13 named `ResumePill.tsx` for logic that lives in
  `ReaderChrome.tsx`, SOL-9's three citations were all ~+63 lines off, SOL-14's were three of
  five. **Audit citations before trusting them and report drift.**
- **Files lists are routinely incomplete** (SOL-6, SOL-7, SOL-13 all needed a file the issue
  did not name). Report it rather than silently expanding scope.
- **`P-READER-002` is defined at `specs/features/reader/ide-shell/spec.md:77`, NOT in the
  global registry** `specs/properties/invariants.md` (which holds only `P-CONTENT-001` and
  `P-ASK-001`). Do not violate it: progress is monotone and local, never transmitted.
- **No test runner exists.** `npm run build` + `npm run lint` are the only gates. Never
  fabricate test evidence.
- Baseline metrics: build green, 210 static pages, **199** slide HTML files under
  `.next/server/app/read/**`, lint green with zero output.

## Slide count tracking

**Before the run: 199.** Still 199 at the pause — none of the 7 completed issues adds slides.
The +298 arrives in Wave 4 (M3), and Wave 3's `###` sub-splitting (SOL-18) changes it too.

## Open items to carry into the final report

Findings F-000 … F-040 are recorded in `docs/runs/claude-RUNLOG.md`. The ones that need a
human decision:

- **F-039** — the reader stage scroll container has no `tabIndex`, so it fails WCAG 2.1.1;
  fixing it would let SOL-9's four forwarding lines be deleted. Needs its own issue.
- **F-031** — the landing CTA links a stored href with no validation and can link to a 404.
  Pre-existing. Needs its own issue.
- **SOL-14 follow-up** — all 199 pages still embed a *byte-identical* copy of the manifest
  (~10.7 MB across the route). The real ceiling-lift before 8-book navigation.
- **F-010** — `AGENTS.md`'s skills inventory is stale and its "Done means: impeccable found no
  blocking issues" clause is unsatisfiable; the shadcn and Context7 MCP servers are not
  connected in this session.
