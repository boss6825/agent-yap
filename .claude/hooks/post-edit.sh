#!/usr/bin/env bash
# PostToolUse hook (matcher: Edit|Write) — advisory only, ALWAYS exit 0.
# Content-routed reminders keyed off the edited path. Never blocks.
# Cites constitution rules by ID (see specs/CONSTITUTION.md); does not restate them.
set -uo pipefail

INPUT="$(cat)"

FILE_PATH="$(printf '%s' "$INPUT" \
  | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | head -n1 \
  | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/')"

if [ -z "${FILE_PATH:-}" ]; then
  exit 0
fi

NORM="${FILE_PATH//\\//}"

case "$NORM" in
  */src/lib/content.ts|src/lib/content.ts)
    echo "NOTE: src/lib/content.ts is EXCLUSIVE-ACCESS shared source of truth (C3) — coordinate before editing." >&2
    echo "      If content shape changed, consider running /knowledge-sync." >&2
    ;;
esac

case "$NORM" in
  */docs/api-contract.md|docs/api-contract.md)
    echo "WARNING: docs/api-contract.md is the binding API contract (C4). Changing it is a RIGOR, lane-crossing act — spec-gate and coordinate." >&2
    ;;
esac

case "$NORM" in
  */content/*|content/*)
    echo "NOTE: content edit — follow content rules (C5): no em dashes, practitioner voice, explain mechanisms not marketing." >&2
    ;;
esac

case "$NORM" in
  */knowledge/*.md|knowledge/*.md)
    echo "NOTE: knowledge/*.md changed — use the 'knowledge:' commit-message prefix." >&2
    ;;
esac

exit 0
