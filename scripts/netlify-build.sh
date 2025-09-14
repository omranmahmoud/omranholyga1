#!/usr/bin/env bash
set -euo pipefail

# Detect if package.json is in current dir; if not, and ./project exists with package.json, cd into it.
if [ ! -f package.json ] && [ -d project ] && [ -f project/package.json ]; then
  echo "[netlify-build] Entering nested project directory" >&2
  cd project
fi

if [ ! -f package.json ]; then
  echo "[netlify-build] ERROR: package.json not found" >&2
  exit 1
fi

# Ensure Node/Yarn/NPM environment is present (Netlify provides NPM). Install only if node_modules missing.
if [ ! -d node_modules ]; then
  echo "[netlify-build] Installing dependencies" >&2
  npm ci || npm install
fi

echo "[netlify-build] Running build:netlify" >&2
npm run build:netlify

echo "[netlify-build] Build finished" >&2
