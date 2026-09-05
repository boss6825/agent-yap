/**
 * Build-time content validation.
 *
 * There is no test runner in this repo (ADR-005), so `npm run build` is the
 * only deterministic gate. The way to make a content mistake impossible is
 * therefore to make the build refuse it.
 *
 * ## Fatal vs warn
 *
 * The fatal list is deliberately short. A validator that cries wolf gets
 * bypassed, and there is no test suite standing behind this one. **Fatal means
 * a reader would see something broken or a book would silently not exist.**
 * Everything else warns.
 *
 * The check that matters most is the first one: a folder that holds chapters
 * but is not discoverable. That single rule is what kept five books and 282
 * slides dark for months, and nothing announced it.
 *
 * Messages say what to do, not just what is wrong.
 */
import fs from "node:fs";
import path from "node:path";

export interface Finding {
  level: "fatal" | "warn";
  /** Repo-relative path of the thing at fault. */
where: string;
  message: string;
}

/** Folders under `content/` that are never books and must not be flagged. */
const NOT_BOOKS = new Set(["dump", "sources", "glossary"]);
/** Sub-folders that legitimately exist inside a book and hold no chapters. */
const BOOK_SUBFOLDERS = new Set(["sources", "glossary", "explanations", "old docs"]);

const CHAPTER_FILE = /^chapter-(\d+)[^/]*\.md$/;

function rel(...parts: string[]): string {
  return parts.join("/");
}

/**
 * Walk `content/` and report everything that would make a reader's experience
 * wrong. Pure: takes the content root, returns findings, throws nothing.
 */
export function validateContentTree(contentRoot: string): Finding[] {
  const findings: Finding[] = [];
  if (!fs.existsSync(contentRoot)) {
    return [
      {
        level: "fatal",
        where: "content/",
        message: "No content directory found. The site cannot render any book.",
      },
    ];
  }

  const dirs = fs
    .readdirSync(contentRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let featuredCount = 0;
  let bookCount = 0;

  for (const name of dirs) {
    if (NOT_BOOKS.has(name)) continue;
    const dir = path.join(contentRoot, name);
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile()).map((e) => e.name);
    const subdirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    const chapters = files.filter((f) => CHAPTER_FILE.test(f));
    const hasIndex = files.includes("index.md");

    // --- the discovery rule: chapters that nobody can reach -------------
    if (chapters.length > 0 && !hasIndex) {
      findings.push({
        level: "fatal",
        where: rel("content", name),
        message:
          `has ${chapters.length} chapter file(s) but no index.md, so it is invisible on the site. ` +
          `Add an index.md (frontmatter + an H1 title + a "> " description), or rename the folder to _${name}/ if it is not meant to ship.`,
      });
    }

    // Chapters buried one level too deep: the shape that hid the harness book.
    for (const sub of subdirs) {
      if (BOOK_SUBFOLDERS.has(sub)) continue;
      const nested = fs
        .readdirSync(path.join(dir, sub), { withFileTypes: true })
        .filter((e) => e.isFile() && CHAPTER_FILE.test(e.name));
      if (nested.length > 0) {
        findings.push({
          level: "fatal",
          where: rel("content", name, sub),
          message:
            `holds ${nested.length} chapter file(s) one level too deep, so none of them render. ` +
            `Move them up into content/${name}/ (git mv, so history follows).`,
        });
      }
    }

    if (!hasIndex || chapters.length === 0) continue;
    bookCount++;

    // --- chapter numbering: gaps and duplicates -------------------------
    const numbers = chapters
      .map((f) => parseInt(f.match(CHAPTER_FILE)![1], 10))
      .sort((a, b) => a - b);
    const seen = new Map<number, string[]>();
    chapters.forEach((f) => {
      const n = parseInt(f.match(CHAPTER_FILE)![1], 10);
      seen.set(n, [...(seen.get(n) ?? []), f]);
    });
    for (const [n, fs_] of seen) {
      if (fs_.length > 1) {
        findings.push({
          level: "fatal",
          where: rel("content", name),
          message: `two chapters share number ${String(n).padStart(2, "0")}: ${fs_.join(", ")}. Renumber one; reading order is otherwise decided by filename sort.`,
        });
      }
    }
    for (let i = 1; i < numbers.length; i++) {
      const gap = numbers[i] - numbers[i - 1];
      if (gap > 1) {
        findings.push({
          level: "warn",
          where: rel("content", name),
          message: `chapter numbering jumps ${numbers[i - 1]} -> ${numbers[i]}. Intentional gaps are fine; an accidental one means a chapter is missing.`,
        });
      }
    }

    // --- featured flag --------------------------------------------------
    const indexRaw = fs.readFileSync(path.join(dir, "index.md"), "utf8");
    if (/^featured:\s*true\s*$/m.test(indexRaw)) featuredCount++;

    // --- index.md must actually yield a title and a description ---------
    const body = indexRaw.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
    const hasTitle = /^title:\s*\S/m.test(indexRaw) || /^#\s+\S/m.test(body);
    if (!hasTitle) {
      findings.push({
        level: "fatal",
        where: rel("content", name, "index.md"),
        message:
          "has no title. Add a `title:` to the frontmatter or an `# H1` to the body, or the book renders with its folder name as its title.",
      });
    }
    if (!/^>\s*\S/m.test(body)) {
      findings.push({
        level: "warn",
        where: rel("content", name, "index.md"),
        message:
          'has no "> " description line, so the shelf card falls back to the first paragraph, which is usually the wrong sentence.',
      });
    }
  }

  if (bookCount > 0 && featuredCount === 0) {
    findings.push({
      level: "warn",
      where: "content/",
      message:
        "no book is marked `featured: true`. The landing page falls back to the first book in shelf order, which changes silently whenever ordering changes.",
    });
  }

  return findings;
}

/**
 * Throw on any fatal finding, print warnings.
 *
 * Called once from the content layer, which every prerendered page imports, so
 * a fatal finding stops `npm run build` rather than shipping a broken site.
 */
export function assertContentValid(contentRoot: string): void {
  const findings = validateContentTree(contentRoot);
  const fatal = findings.filter((f) => f.level === "fatal");
  const warn = findings.filter((f) => f.level === "warn");

  for (const w of warn) {
    console.warn(`[content] warning: ${w.where} ${w.message}`);
  }
  if (fatal.length === 0) return;

  const lines = fatal.map((f) => `  - ${f.where} ${f.message}`);
  throw new Error(
    `Content validation failed with ${fatal.length} error(s):\n${lines.join("\n")}\n`,
  );
}
