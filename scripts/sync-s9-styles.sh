#!/usr/bin/env bash
# Sync Signal 9 shared theme CSS into this repo.
# Canonical theme sources: signal-9-live-eq/src/styles/
# DS variables: plantasonic-xyz/plantasonic-design-system/css/variables.css

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CSS="$ROOT/css"

EQ_STYLES="${S9_EQ_STYLES:-$ROOT/../signal-9-live-eq/src/styles}"
DS_VARS="${DS_VARS:-$ROOT/../plantasonic-xyz/plantasonic-design-system/css/variables.css}"

if [[ ! -d "$EQ_STYLES" ]]; then
  echo "error: signal-9-live-eq styles not found at $EQ_STYLES" >&2
  echo "Set S9_EQ_STYLES to the path containing signal9-theme.css" >&2
  exit 1
fi

if [[ ! -f "$DS_VARS" ]]; then
  echo "error: DS variables.css not found at $DS_VARS" >&2
  echo "Set DS_VARS to plantasonic-design-system/css/variables.css" >&2
  exit 1
fi

cp "$EQ_STYLES/signal9-theme.css" "$CSS/signal9-theme.css"
cp "$EQ_STYLES/preset-themes.css" "$CSS/preset-themes.css"
cp "$EQ_STYLES/startup.css" "$CSS/startup.css"
cp "$DS_VARS" "$CSS/ds-variables.css"

# Ensure --s9-accent alias exists (broadcast SCSS expects it)
if ! grep -q '\-\-s9-accent:' "$CSS/signal9-theme.css"; then
  echo "warning: add --s9-accent alias to signal9-theme.css manually" >&2
fi

echo "Synced Signal 9 styles into $CSS"
