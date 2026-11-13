#!/bin/bash
# Publishes the Home Screen web version to https://openquote-app.vercel.app (the Vercel project "openquote-app").
# People open that address in Safari and tap Share → Add to Home Screen. Their quotes stay on their phone; the
# host only serves the app's files.
#
# Pushing to GitHub doesn't publish anything (vercel.json turns that off, so the old web app's project stays as it
# was). Run this instead: ./scripts/deploy-web.sh   (needs the Vercel CLI, signed in: `vercel login`).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run build --silent

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT
cp -R dist/. "$OUT/"
mkdir "$OUT/.vercel"
echo '{"projectId":"prj_eTBghbZ3WG1UmDNX7EEYxXisoAwH","orgId":"team_J8o32DgmKdgqtyjDcbaaF4Ar"}' > "$OUT/.vercel/project.json"
# Plain files, no build on Vercel's side; every address opens the app (it has its own screens).
cat > "$OUT/vercel.json" <<'JSON'
{
  "framework": null,
  "buildCommand": "",
  "outputDirectory": ".",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [{ "source": "/sw.js", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] }]
}
JSON
cd "$OUT"
vercel deploy --prod --yes 2>&1 | grep -E "Aliased|Production|Error" || true
