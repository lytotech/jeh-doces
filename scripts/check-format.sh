#!/usr/bin/env sh
set -eu

if [ -n "${GITHUB_BASE_REF:-}" ]; then
  files=$(git diff --name-only "origin/${GITHUB_BASE_REF}...HEAD")
elif [ -n "$(git diff --cached --name-only)" ]; then
  files=$(git diff --cached --name-only)
else
  files=$(git diff --name-only)
fi

files=$(printf '%s\n' "$files" | grep -E '\.(cjs|js|json|mjs|ts|tsx)$' || true)
files=$(printf '%s\n' "$files" | while IFS= read -r file; do
  [ -f "$file" ] && printf '%s\n' "$file"
done)
[ -z "$files" ] && exit 0

# shellcheck disable=SC2086
npx prettier --check $files
