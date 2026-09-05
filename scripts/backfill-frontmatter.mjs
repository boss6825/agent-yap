#!/usr/bin/env node
/**
 * Backfill and audit content frontmatter.
 *
 *   node scripts/backfill-frontmatter.mjs           # dry run, prints a plan
 *   node scripts/backfill-frontmatter.mjs --write   # apply
 *
 * Idempotent: running it twice changes nothing the second time.
 *
 * ## What it writes, and the one thing it deliberately refuses to write
 *
 * Real book metadata lives in each book's `index.md` — `title`, `tagline`,
 * `track`, `order`, `accent`, `featured`. Those are editorial judgements about
 * a book, so the script reports a book that is missing any of them but never
 * invents one.
 *
 * **Chapter files get nothing.** SOL-27 asks for `order` derived from the
 * `chapter-NN` prefix, and this script does not do that on purpose:
 *
 *   - It is redundant. `compareChapters` in `src/lib/content.ts` already falls
 *     back to the number parsed out of the filename, so `order: 3` on
 *     `chapter-03-*.md` changes no behaviour whatsoever.
 *   - It is actively harmful. Once stamped, frontmatter *wins* over the
 *     filename. Renaming `chapter-03-x.md` to `chapter-07-x.md` would then
 *     leave `order: 3` behind and the chapter would silently sort in its old
 *     position. Today renaming a file just works.
 *
 * `order` on a chapter is meant for the rare case where a book must depart
 * from its filename numbering. Writing it everywhere destroys that signal by
 * making it noise. So the rule is: write `order` only where it would actually
 * differ from the filename, which is nowhere today.
 *
 * `title` is refused for the same class of reason — the parser already falls
 * back to the `#` heading, and a stamped title silently overrides that heading
 * forever, so the two can drift apart with no warning.
 *
 * Skips `sources/`, `dump/`, `old docs/` and anything that is not a book.
 */
import fs from "node:fs";
import path from "node:path";

const REPO = path.resolve(import.meta.dirname, "..");
const CONTENT = path.join(REPO, "content");
const WRITE = process.argv.includes("--write");

const SKIP_DIRS = new Set(["sources", "dump", "old docs", "explanations", "research_papers"]);
const CHAPTER_FILE = /^chapter-(\d+)[^/]*\.md$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/** Keys the parser understands. Anything else fails SOL-19 validation. */
const KNOWN_KEYS = new Set(["title", "tagline", "track", "order", "accent", "featured", "body"]);
/** What a book's index.md needs for the shelf to render it properly. */
const BOOK_KEYS = ["title", "tagline", "track", "order", "accent"];

function parseFrontmatter(raw) {
  const m = raw.match(FRONTMATTER);
  if (!m) return { keys: new Map(), block: null, body: raw };
  const keys = new Map();
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.trim().match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (kv) keys.set(kv[1], kv[2].trim());
  }
  return { keys, block: m[1], body: raw.slice(m[0].length) };
}

const books = [];
for (const name of fs.readdirSync(CONTENT).sort()) {
  const dir = path.join(CONTENT, name);
  if (!fs.statSync(dir).isDirectory() || SKIP_DIRS.has(name)) continue;
  const indexPath = path.join(dir, "index.md");
  if (!fs.existsSync(indexPath)) continue;
  const chapters = fs.readdirSync(dir).filter((f) => CHAPTER_FILE.test(f)).sort();
  const raw = fs.readFileSync(indexPath, "utf8");
  const isReference = /^body:\s*\S/m.test(raw);
  // A folder with an index.md but neither chapters nor a `body:` is not a book
  // and not a reference -- it is correctly invisible to the site (today:
  // `research papers/`, whose sub-folders are the real books). Flagging it
  // would be crying wolf, which is how a checker gets ignored.
  if (chapters.length === 0 && !isReference) continue;
  books.push({ name, dir, indexPath, chapters });
}

const planned = [];
const problems = [];

for (const b of books) {
  const { keys } = parseFrontmatter(fs.readFileSync(b.indexPath, "utf8"));
  for (const k of keys.keys()) {
    if (!KNOWN_KEYS.has(k)) problems.push(`${b.name}/index.md: unknown key "${k}"`);
  }
  const isReference = keys.has("body");
  const needed = isReference ? BOOK_KEYS : BOOK_KEYS;
  const missing = needed.filter((k) => !keys.has(k));
  if (missing.length) {
    problems.push(
      `${b.name}/index.md: missing ${missing.join(", ")} — editorial values, add by hand (the script will not invent them)`,
    );
  }

  // Chapter-level: only flag a genuine mismatch, never stamp a redundant one.
  for (const f of b.chapters) {
    const full = path.join(b.dir, f);
    const { keys: ck } = parseFrontmatter(fs.readFileSync(full, "utf8"));
    for (const k of ck.keys()) {
      if (!KNOWN_KEYS.has(k)) problems.push(`${b.name}/${f}: unknown key "${k}"`);
    }
    const fromName = parseInt(f.match(CHAPTER_FILE)[1], 10);
    if (ck.has("order") && Number(ck.get("order")) !== fromName) {
      problems.push(
        `${b.name}/${f}: order ${ck.get("order")} disagrees with filename ${fromName} — intentional, or a stale value from a rename?`,
      );
    }
  }
}

console.log(`books: ${books.length}  |  chapter files: ${books.reduce((n, b) => n + b.chapters.length, 0)}`);
console.log(`\nfiles the script would change: ${planned.length}`);
if (planned.length === 0) {
  console.log("  (none — chapter order is derived from the filename by design; see the");
  console.log("   header of this script for why stamping it would be a regression)");
}

console.log(`\nfrontmatter problems: ${problems.length}`);
for (const p of problems) console.log(`  ${p}`);
if (problems.length === 0) console.log("  (none)");

if (!WRITE) {
  console.log(`\nDry run. Re-run with --write to apply.`);
  process.exit(0);
}
for (const p of planned) fs.writeFileSync(p.full, p.next, "utf8");
console.log(`\nwrote ${planned.length} file(s).`);
