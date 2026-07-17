#!/usr/bin/env bash
# PreToolUse hook (matcher: Edit|Write) — blocking.
# Hard-blocks edits to generated/build outputs so agents fix the source and
# regenerate via `npm run build` instead of hand-editing derived files.
# Enforces C1 (fix the input, not the generated output). No jq dependency.
set -euo pipefail

# Read the tool-input JSON from stdin.
INPUT="$(cat)"

# Extract the first "file_path": "..." value with grep/sed (tolerant of spacing).
FILE_PATH="$(printf '%s' "$INPUT" \
  | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | head -n1 \
  | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/')"

# Nothing to inspect -> allow.
if [ -z "${FILE_PATH:-}" ]; then
  exit 0
fi

# Normalize backslashes (Windows paths) to forward slashes for matching.
NORM="${FILE_PATH//\\//}"

is_generated() {
  case "$1" in
    *.tsbuildinfo)        return 0 ;;
    */next-env.d.ts)      return 0 ;;
    next-env.d.ts)        return 0 ;;
    */.next/*|.next/*)    return 0 ;;
    */out/*|out/*)        return 0 ;;
    */build/*|build/*)    return 0 ;;
  esac
  return 1
}

if is_generated "$NORM"; then
  echo "BLOCKED: '$FILE_PATH' is a generated/build output — do not hand-edit it (C1)." >&2
  echo "Fix the source and regenerate: run 'npm run build' (type-check + static prerender)." >&2
  echo "Generated outputs here: .next/, out/, build/, *.tsbuildinfo, next-env.d.ts." >&2
  exit 2
fi

exit 0
