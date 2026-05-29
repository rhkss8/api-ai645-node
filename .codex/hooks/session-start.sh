#!/usr/bin/env bash
set -u

BACKEND="/Users/rhkss/Desktop/projects/api-ai645-node"
FRONTEND="/Users/rhkss/Desktop/projects/ai645-front"

repo_line() {
  local label="$1"
  local dir="$2"

  if [ ! -d "$dir/.git" ]; then
    printf '%s: missing git repo at %s\n' "$label" "$dir"
    return
  fi

  local branch dirty untracked
  branch="$(git -C "$dir" branch --show-current 2>/dev/null || printf 'unknown')"
  dirty="$(git -C "$dir" status --short 2>/dev/null | wc -l | tr -d ' ')"
  untracked="$(git -C "$dir" status --short 2>/dev/null | awk '/^\?\?/ { n++ } END { print n+0 }')"

  printf '%s: %s | dirty %s | untracked %s | %s\n' "$label" "$branch" "$dirty" "$untracked" "$dir"
}

printf 'AI645 workspace ready.\n'
repo_line "backend" "$BACKEND"
repo_line "frontend" "$FRONTEND"

if [ -f "$BACKEND/AGENTS.md" ]; then
  printf 'backend rules: AGENTS.md present\n'
else
  printf 'backend rules: AGENTS.md missing\n'
fi

if [ -f "$FRONTEND/AGENTS.md" ]; then
  printf 'frontend rules: AGENTS.md present\n'
else
  printf 'frontend rules: AGENTS.md missing\n'
fi

printf 'mode: user owns approval; Codex executes; risky ops ask first; report short.\n'
