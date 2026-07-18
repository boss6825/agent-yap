#!/usr/bin/env bash
#
# knowledge/validate.sh — validates the knowledge graph.
#
# Checks:
#   1. Frontmatter: id / type / links present; type in {module,flow,concept,
#      invariant}; links non-empty; id prefix matches type.
#   2. Every link target resolves to an existing knowledge id.
#   3. Graph rules:
#        - every module links >=1 flow OR concept
#        - every flow links >=1 module
#        - every concept and every invariant is referenced by >=1 module or flow
#   4. Staleness (WARNING only): for each id in KNOWLEDGE_TO_SOURCE, warn if its
#      source paths changed since the last commit matching `git log --grep='^knowledge:'`.
#
# Usage: ./validate.sh [--ci]
#   --ci : exit non-zero when there are errors (warnings never affect exit).
#          Without --ci the script reports and exits 0.
#
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"

CI=0
[ "${1:-}" = "--ci" ] && CI=1

errors=0
warnings=0
err()  { echo "ERROR: $*" >&2; errors=$((errors + 1)); }
warn() { echo "WARN:  $*" >&2; warnings=$((warnings + 1)); }

VALID_TYPES="module flow concept invariant"

declare -A ID_TYPE ID_LINKS ID_FILE

# ---- collect files ---------------------------------------------------------
files=()
for d in modules flows concepts invariants; do
  for f in "$ROOT/$d"/*.md; do
    [ -e "$f" ] || continue
    files+=("$f")
  done
done

if [ "${#files[@]}" -eq 0 ]; then
  err "no knowledge files found under $ROOT"
fi

# ---- parse one file's YAML frontmatter into fid / ftype / flinks -----------
parse_file() {
  local file="$1"
  local in=0 done=0 inlinks=0 line
  fid=""; ftype=""; flinks=""
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"            # tolerate CRLF
    [ $done -eq 1 ] && break
    if [ $in -eq 0 ]; then
      [ "$line" = "---" ] && in=1
      continue
    fi
    if [ "$line" = "---" ]; then done=1; break; fi
    case "$line" in
      id:*)    fid="$(printf '%s' "${line#id:}"   | tr -d '[:space:]')"; inlinks=0 ;;
      type:*)  ftype="$(printf '%s' "${line#type:}" | tr -d '[:space:]')"; inlinks=0 ;;
      links:*) inlinks=1 ;;
      *)
        if [ $inlinks -eq 1 ] && printf '%s' "$line" | grep -qE '^[[:space:]]*-[[:space:]]'; then
          local t
          t="$(printf '%s' "$line" | sed -E 's/^[[:space:]]*-[[:space:]]*//' | tr -d '[:space:]')"
          [ -n "$t" ] && flinks="$flinks $t"
        fi
        ;;
    esac
  done < "$file"
}

# ---- pass 1: frontmatter validation + index build --------------------------
for f in "${files[@]}"; do
  parse_file "$f"
  rel="${f#"$REPO"/}"

  if [ -z "$fid" ]; then err "$rel: missing 'id'"; continue; fi
  [ -n "$ftype" ] || err "$rel: missing 'type'"
  [ -n "${flinks// /}" ] || err "$rel: 'links' is empty or missing"

  case " $VALID_TYPES " in
    *" $ftype "*) ;;
    *) err "$rel: invalid type '${ftype:-<none>}' (must be one of: $VALID_TYPES)" ;;
  esac

  if [ -n "$ftype" ]; then
    case "$fid" in
      "$ftype"/*) ;;
      *) err "$rel: id '$fid' does not start with its type '$ftype/'" ;;
    esac
  fi

  if [ -n "${ID_TYPE[$fid]:-}" ]; then
    err "$rel: duplicate id '$fid' (also in ${ID_FILE[$fid]})"
  fi
  ID_TYPE["$fid"]="$ftype"
  ID_LINKS["$fid"]="$flinks"
  ID_FILE["$fid"]="$rel"
done

# ---- pass 2: link targets resolve ------------------------------------------
for id in "${!ID_LINKS[@]}"; do
  for l in ${ID_LINKS[$id]}; do
    if [ -z "${ID_TYPE[$l]:-}" ]; then
      err "${ID_FILE[$id]}: link target '$l' does not resolve to a known id"
    fi
  done
done

# ---- pass 3: graph rules ---------------------------------------------------
# Who is referenced by a module or flow?
declare -A REF_BY_MF
for id in "${!ID_TYPE[@]}"; do
  t="${ID_TYPE[$id]}"
  if [ "$t" = "module" ] || [ "$t" = "flow" ]; then
    for l in ${ID_LINKS[$id]}; do REF_BY_MF["$l"]=1; done
  fi
done

for id in "${!ID_TYPE[@]}"; do
  t="${ID_TYPE[$id]}"
  case "$t" in
    module)
      ok=0
      for l in ${ID_LINKS[$id]}; do
        lt="${ID_TYPE[$l]:-}"
        if [ "$lt" = "flow" ] || [ "$lt" = "concept" ]; then ok=1; break; fi
      done
      [ $ok -eq 1 ] || err "${ID_FILE[$id]}: module '$id' must link >=1 flow or concept"
      ;;
    flow)
      ok=0
      for l in ${ID_LINKS[$id]}; do
        [ "${ID_TYPE[$l]:-}" = "module" ] && { ok=1; break; }
      done
      [ $ok -eq 1 ] || err "${ID_FILE[$id]}: flow '$id' must link >=1 module"
      ;;
    concept|invariant)
      [ -n "${REF_BY_MF[$id]:-}" ] || \
        err "${ID_FILE[$id]}: $t '$id' is orphaned (not referenced by any module or flow)"
      ;;
  esac
done

# ---- pass 4: staleness (warnings) ------------------------------------------
# knowledge-id -> source paths (relative to repo root), space-separated.
declare -A KNOWLEDGE_TO_SOURCE
KNOWLEDGE_TO_SOURCE["module/content"]="src/lib/content.ts"
KNOWLEDGE_TO_SOURCE["module/search"]="src/lib/search.ts"
KNOWLEDGE_TO_SOURCE["module/ask"]="src/lib/ask.ts"
KNOWLEDGE_TO_SOURCE["module/reader"]="src/app/read src/components/reader"
KNOWLEDGE_TO_SOURCE["module/markdown-render"]="src/components/Markdown.tsx"
KNOWLEDGE_TO_SOURCE["module/landing"]="src/app/page.tsx src/components/Home.tsx"
KNOWLEDGE_TO_SOURCE["module/display"]="src/lib/display.ts"
KNOWLEDGE_TO_SOURCE["module/search-ask-panels"]="src/components/SearchPanel.tsx src/components/AskPanel.tsx"
KNOWLEDGE_TO_SOURCE["flow/slide-rendering"]="src/app/read"
KNOWLEDGE_TO_SOURCE["flow/search"]="src/app/api/search src/lib/search.ts"
KNOWLEDGE_TO_SOURCE["flow/ask-the-docs"]="src/app/api/ask src/lib/ask.ts"

if git -C "$REPO" rev-parse --git-dir >/dev/null 2>&1; then
  last="$(git -C "$REPO" log --grep='^knowledge:' -n 1 --format=%H 2>/dev/null || true)"
  if [ -z "$last" ]; then
    warn "no 'knowledge:' commit found yet — staleness baseline not established (expected on first bootstrap, before the knowledge: commit lands)"
  else
    for id in "${!KNOWLEDGE_TO_SOURCE[@]}"; do
      changed="$(git -C "$REPO" diff --name-only "$last"..HEAD -- ${KNOWLEDGE_TO_SOURCE[$id]} 2>/dev/null)"
      if [ -n "$changed" ]; then
        warn "$id may be STALE — sources changed since last knowledge: commit: $(printf '%s' "$changed" | tr '\n' ' ')"
      fi
    done
  fi
else
  warn "not a git repository — skipping staleness check"
fi

# ---- summary ---------------------------------------------------------------
echo ""
echo "Validated ${#ID_TYPE[@]} knowledge files: ${errors} error(s), ${warnings} warning(s)."
if [ $errors -eq 0 ]; then
  echo "OK: knowledge graph is valid (no errors)."
else
  echo "FAIL: knowledge graph has errors."
fi

if [ $CI -eq 1 ] && [ $errors -gt 0 ]; then
  exit 1
fi
exit 0
