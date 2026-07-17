#!/usr/bin/env bash
# Wires this repo's versioned git hooks. Run once after clone (and safe to rerun).
set -euo pipefail

git config core.hooksPath .githooks
chmod +x .githooks/*

echo "core.hooksPath set to .githooks; hooks marked executable."
