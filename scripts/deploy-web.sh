#!/bin/bash
# Publishes the Home Screen web version to https://openquote-au.pages.dev (Cloudflare Pages project "openquote-au",
# free, and fine for business use). People open that address in Safari and tap Share → Add to Home Screen. Their
# quotes stay on their phone; Cloudflare only serves the app's files.
#
# Pushing to GitHub doesn't publish anything. Run this instead: ./scripts/deploy-web.sh
# (signs in to Cloudflare through `npx wrangler login` the first time).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run build --silent

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT
cp -R dist/. "$OUT/"
# The service worker is how phones learn there's a new version, so it must never be cached. (With no 404.html,
# Cloudflare Pages answers every other address with index.html, and the app shows the right screen.)
cat > "$OUT/_headers" <<'TXT'
/sw.js
  Cache-Control: no-cache
TXT
npx wrangler pages deploy "$OUT" --project-name openquote-au --branch main --commit-dirty=true 2>&1 | grep -E "Deployment complete|https://|ERROR" || true
