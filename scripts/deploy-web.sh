#!/bin/bash
# Publishes the Home Screen web version to https://openquote.roriminogue.com and openquote-au.pages.dev (Cloudflare Pages project "openquote-au",
# free, and fine for business use). People open that address in Safari and tap Share → Add to Home Screen. Their
# quotes stay on their phone; Cloudflare only serves the app's files.
#
# Pushing to GitHub doesn't publish anything. Run this instead: ./scripts/deploy-web.sh
# (signs in to Cloudflare through `npx wrangler login` the first time). `./scripts/deploy-web.sh preview` publishes
# to https://preview.openquote-au.pages.dev instead, to try a change before it goes live.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run build --silent

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT
cp -R dist/. "$OUT/"
# Security headers and caching rules come from public/_headers (copied into dist by the build). Refuse to publish
# without them. (With no 404.html, Cloudflare Pages answers every other address with index.html, and the app shows
# the right screen.)
grep -q "Content-Security-Policy" "$OUT/_headers" || { echo "dist/_headers is missing its security headers" >&2; exit 1; }
BRANCH=main
[ "${1:-}" = "preview" ] && BRANCH=preview
# Run from the repo root. (There are no Pages functions: the publik relay was removed in the November 2026 security
# audit; see docs/security-audit-2026-11.md.)
npx wrangler pages deploy "$OUT" --project-name openquote-au --branch "$BRANCH" --commit-dirty=true 2>&1 | grep -E "Deployment complete|https://|ERROR" || true
