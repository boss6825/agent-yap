/**
 * Review-section extraction: `## Review` prose becomes structured data.
 *
 * Most chapters end with a `## Review` section holding four kinds of item,
 * authored by hand over months. This module turns the multiple-choice ones into
 * a typed `Question[]` so the assessment work (M6) reads data instead of
 * re-parsing markdown, and so the Review tail stops being emitted as slides.
 *
 * ## The format, as surveyed rather than assumed
 *
 * All 53 chapters carry a `## Review`. Inside, items are grouped by bold
 * sub-headings and 630 numbered items exist in total:
 *
 * - **Quick Check** / **More Questions** — multiple choice. 480 items.
 * - **Think About It** — open-ended, a stem plus `<summary>Show answer</summary>`
 *   and no options. 150 items.
 * - **Coding Challenge** — a prose exercise plus a solution block.
 *
 * Only the multiple-choice items become `Question`s. The rest are counted and
 * reported, never silently dropped.
 *
 * ## Two traps this is written around
 *
 * 1. **Bullet style is not consistent.** `agentic-memory` writes options with
 *    `*` and every other book uses `-`. A dash-only pattern silently loses that
 *    entire book, and because it is the book with the fewest questions nobody
 *    goes looking. `OPTION_LINE` accepts both.
 * 2. **The answer letter has to be recovered from prose.** The correct option
 *    is not marked on the option itself; it is the leading letter of the
 *    `<details>` body ("B) A trivial background task belongs..."). If that
 *    letter is missing or names an option that does not exist, the item is
 *    reported as unparsed rather than guessed at.
 */

export interface QuestionOption {
  /** "A" | "B" | "C" | "D" as authored. */
  letter: string;
  text: string;
}

export interface Question {
  /** Stable within a chapter: the authored item number. */
  number: number;
  /** The bold sub-heading the item sat under, e.g. "Quick Check". */
  group: string;
  prompt: string;
  options: QuestionOption[];
  /** Index into `options`, not a letter — the grading engine wants a position. */
  correctIndex: number;
  /**
   * The full answer prose. Deliberately keeps the "why the distractors were
   * tempting" explanation, not just the correct letter: the anti-frustration
   * design depends on a reader learning why they were wrong.
   */
  explanation: string;
}

/** An item inside `## Review` that is not multiple choice, or did not parse. */
export interface ReviewSkip {
  number: number;
  group: string;
  /** Short reason, for the build-time report. */
  reason: string;
  promptPreview: string;
}

export interface ReviewExtract {
  questions: Question[];
  skipped: ReviewSkip[];
  /** Body with the whole `## Review` section removed. */
  body: string;
  /** True when the chapter had a `## Review` section at all. */
  hadReview: boolean;
}

/** `1. Some stem text` at the start of a line. */
const ITEM_START = /^(\d+)\.[ \t]+(.*)$/;
/** `- A) text` or `* A) text`, indented or not. Both styles exist in the corpus. */
const OPTION_LINE = /^\s*[-*]\s*([A-Z])\)\s*(.+)$/;
/** `**Quick Check**` on its own line. */
const GROUP_LINE = /^\*\*(.+?)\*\*\s*$/;
/** The answer body opens with the correct letter: `B) because ...`. */
const ANSWER_LETTER = /^\s*\*{0,2}([A-Z])\)\s*/;

const DETAILS_OPEN = /<details>\s*(?:<summary>(.*?)<\/summary>)?/i;

/**
 * Split a chapter body at its `## Review` heading.
 * Returns the body before it and the section itself (heading line dropped).
 */
function cutReview(markdown: string): { body: string; review: string | null } {
  const lines = markdown.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+Review\s*$/.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start === -1) return { body: markdown, review: null };

  // The section runs to the next `##` of any kind, or to the end of the file.
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return {
    body: [...lines.slice(0, start), ...lines.slice(end)].join("\n").trim(),
    review: lines.slice(start + 1, end).join("\n"),
  };
}

/** Everything from `<details>` to its matching `</details>`, tags stripped. */
function readDetails(text: string): { summary: string; body: string } | null {
  const open = text.match(DETAILS_OPEN);
  if (!open || open.index === undefined) return null;
  const after = text.slice(open.index + open[0].length);
  const close = after.indexOf("</details>");
  const inner = close === -1 ? after : after.slice(0, close);
  return {
    summary: (open[1] ?? "").trim(),
    body: inner.replace(/<\/?summary>/gi, "").trim(),
  };
}

/**
 * Extract the multiple-choice items from one chapter's `## Review`.
 *
 * Loud by design: anything that looks like a numbered item but does not yield a
 * clean question is returned in `skipped` with a reason. A silent miss here
 * would not surface until the grading engine was already built on top of it.
 */
export function extractReview(markdown: string): ReviewExtract {
  const { body, review } = cutReview(markdown);
  if (review === null) {
    return { questions: [], skipped: [], body, hadReview: false };
  }

  const lines = review.split(/\r?\n/);
  const questions: Question[] = [];
  const skipped: ReviewSkip[] = [];
  let group = "";

  for (let i = 0; i < lines.length; i++) {
    const groupMatch = lines[i].match(GROUP_LINE);
    if (groupMatch) {
      group = groupMatch[1].trim();
      continue;
    }

    const itemMatch = lines[i].match(ITEM_START);
    if (!itemMatch) continue;

    const number = parseInt(itemMatch[1], 10);
    const promptParts = [itemMatch[2].trim()];
    const options: QuestionOption[] = [];
    let j = i + 1;

    // Continuation lines of the stem, then the option block.
    for (; j < lines.length; j++) {
      const line = lines[j];
      if (ITEM_START.test(line) || GROUP_LINE.test(line)) break;
      if (/<details>/i.test(line)) break;
      const opt = line.match(OPTION_LINE);
      if (opt) {
        options.push({ letter: opt[1], text: opt[2].trim() });
        continue;
      }
      if (options.length === 0 && line.trim()) promptParts.push(line.trim());
    }

    const prompt = promptParts.join(" ").trim();
    const preview = prompt.slice(0, 80);

    // The rest of this item, for its <details> answer.
    let k = j;
    while (k < lines.length && !ITEM_START.test(lines[k]) && !GROUP_LINE.test(lines[k])) k++;
    const detail = readDetails(lines.slice(j, k).join("\n"));

    if (options.length === 0) {
      // Open-ended ("Think About It") or a coding challenge. Expected, not a bug.
      skipped.push({
        number,
        group,
        reason: detail ? "open-ended (no options)" : "no options and no answer block",
        promptPreview: preview,
      });
      i = k - 1;
      continue;
    }

    if (!detail) {
      skipped.push({ number, group, reason: "options but no <details> answer", promptPreview: preview });
      i = k - 1;
      continue;
    }

    const letterMatch = detail.body.match(ANSWER_LETTER);
    if (!letterMatch) {
      skipped.push({
        number,
        group,
        reason: "answer body does not start with a letter",
        promptPreview: preview,
      });
      i = k - 1;
      continue;
    }

    const correctIndex = options.findIndex((o) => o.letter === letterMatch[1]);
    if (correctIndex === -1) {
      skipped.push({
        number,
        group,
        reason: `answer names option ${letterMatch[1]}, which is not among ${options
          .map((o) => o.letter)
          .join("")}`,
        promptPreview: preview,
      });
      i = k - 1;
      continue;
    }

    questions.push({
      number,
      group,
      prompt,
      options,
      correctIndex,
      // Keep the whole body including the leading letter: it reads naturally
      // ("B) A trivial background task belongs on the low tier...") and the
      // renderer can strip it if it wants to show the letter separately.
      explanation: detail.body,
    });
    i = k - 1;
  }

  return { questions, skipped, body, hadReview: true };
}
