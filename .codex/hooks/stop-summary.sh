#!/usr/bin/env bash
set -u

BACKEND="/Users/rhkss/Desktop/projects/api-ai645-node"
FRONTEND="/Users/rhkss/Desktop/projects/ai645-front"

summarize_repo() {
  local label="$1"
  local dir="$2"

  if [ ! -d "$dir/.git" ]; then
    printf '%s: missing git repo at %s\n' "$label" "$dir"
    return
  fi

  local changed src_changes api_changes package_changes
  changed="$(git -C "$dir" status --short 2>/dev/null | wc -l | tr -d ' ')"
  src_changes="$(git -C "$dir" status --short 2>/dev/null | awk '$2 ~ /^src\// || $2 ~ /^backend\/src\// { n++ } END { print n+0 }')"
  api_changes="$(git -C "$dir" status --short 2>/dev/null | awk '$2 ~ /(swagger|openapi)\.(json|ya?ml)$/ || $2 ~ /^src\/services\/openapis\// { n++ } END { print n+0 }')"
  package_changes="$(git -C "$dir" status --short 2>/dev/null | awk '$2 ~ /(^|\/)(package(-lock)?\.json|yarn\.lock)$/ { n++ } END { print n+0 }')"

  printf '%s: changed %s | src %s | api/client %s | package %s\n' "$label" "$changed" "$src_changes" "$api_changes" "$package_changes"
}

printf 'AI645 stop summary.\n'
summarize_repo "backend" "$BACKEND"
summarize_repo "frontend" "$FRONTEND"

backend_api_changed="$(git -C "$BACKEND" status --short 2>/dev/null | awk '$2 ~ /(swagger|openapi)\.(json|ya?ml)$/ { n++ } END { print n+0 }')"
backend_src_changed="$(git -C "$BACKEND" status --short 2>/dev/null | awk '$2 ~ /^backend\/src\// { n++ } END { print n+0 }')"
frontend_src_changed="$(git -C "$FRONTEND" status --short 2>/dev/null | awk '$2 ~ /^src\// { n++ } END { print n+0 }')"
frontend_client_changed="$(git -C "$FRONTEND" status --short 2>/dev/null | awk '$2 ~ /^src\/services\/openapis\// { n++ } END { print n+0 }')"

if [ "$backend_api_changed" != "0" ]; then
  printf 'recommend: backend OpenAPI changed; consider frontend npm run generate:api after review.\n'
fi

if [ "$backend_src_changed" != "0" ]; then
  printf 'recommend: backend src changed; consider cd backend && npm run build.\n'
fi

if [ "$frontend_src_changed" != "0" ]; then
  printf 'recommend: frontend src changed; consider npm run build.\n'
fi

if [ "$frontend_client_changed" != "0" ]; then
  printf 'recommend: generated client changed; inspect diff before commit.\n'
fi

printf 'no automatic mutation performed.\n'
