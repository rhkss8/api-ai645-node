#!/usr/bin/env zsh
set -euo pipefail

SCRIPT_DIR="${0:A:h}"
PROJECT_ROOT="${SCRIPT_DIR:h}"
TARS_SOURCE="$PROJECT_ROOT/tars"
BIN_DIR="$HOME/.local/bin"
TARGET="$BIN_DIR/tars"
ZSHRC="$HOME/.zshrc"
ZPROFILE="$HOME/.zprofile"

if [[ ! -f "$TARS_SOURCE" ]]; then
  echo "Missing TARS source: $TARS_SOURCE" >&2
  exit 1
fi

mkdir -p "$BIN_DIR"
ln -sf "$TARS_SOURCE" "$TARGET"
chmod +x "$TARS_SOURCE"

ensure_path_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    touch "$file"
  fi

  if ! grep -q 'HOME/.local/bin' "$file"; then
    {
      echo ''
      echo '# TARS local CLI'
      echo 'export PATH="$HOME/.local/bin:$PATH"'
    } >> "$file"
  fi
}

ensure_path_file "$ZSHRC"
ensure_path_file "$ZPROFILE"

echo "Installed tars -> $TARGET"
echo "Restart your terminal or run: source ~/.zshrc"
echo "Then run: tars"
