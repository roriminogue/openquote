#!/bin/bash
# Builds OpenQuote AU and installs it on a connected iPhone (free Apple ID: re-run every 7 days; your data stays).
#   ./ios/install-on-iphone.sh                       build and install
#   ./ios/install-on-iphone.sh --data FILE           also put a backup on the phone (first install only: it replaces
#                                                    what's on the phone), e.g. one made by scripts/export-from-web.ts
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA=""
DEVICE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --data) DATA="$2"; shift 2 ;;
    *) DEVICE="$1"; shift ;;
  esac
done
[ -z "$DATA" ] || [ -f "$DATA" ] || { echo "No file at $DATA"; exit 1; }
DEVICE="${DEVICE:-$(xcrun devicectl list devices 2>/dev/null | grep -E 'physical' | grep -E 'available|connected' | grep -v unavailable | grep -oE '[0-9A-F]{8}-[0-9A-F]{16}' | head -1)}"
[ -n "$DEVICE" ] || { echo "No iPhone found. Plug it in, unlock it and tap Trust."; exit 1; }

echo "Building the app's screens…"
cd "$ROOT"
npm run build --silent >/dev/null
npx cap sync ios >/dev/null

echo "Building for $DEVICE…"
cd "$ROOT/ios/App"
xcodebuild -project App.xcodeproj -scheme App -configuration Debug -destination "id=$DEVICE" \
  -derivedDataPath ../build -allowProvisioningUpdates build 2>&1 | tee ../build.log | grep -E "error:|warning: .*signing|BUILD (SUCCEEDED|FAILED)" || true
APP="../build/Build/Products/Debug-iphoneos/App.app"
[ -d "$APP" ] || { echo "Build failed; see ios/build.log"; exit 1; }
BUNDLE_ID=$(/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" "$APP/Info.plist")

echo "Installing…"
xcrun devicectl device install app --device "$DEVICE" "$APP"

stop_app() {
  local pid
  pid=$(xcrun devicectl device info processes --device "$DEVICE" 2>/dev/null | grep -F "/App.app/" | awk '{print $1}' | head -1)
  [ -z "$pid" ] || xcrun devicectl device process terminate --device "$DEVICE" --pid "$pid" >/dev/null 2>&1 || true
}

if [ -n "$DATA" ]; then
  echo "Copying your data onto the phone…"
  # The app makes its data folder the first time it opens, so open it once before copying.
  xcrun devicectl device process launch --device "$DEVICE" "$BUNDLE_ID" >/dev/null 2>&1 || true
  sleep 6
  stop_app
  sleep 2
  xcrun devicectl device copy to --device "$DEVICE" --domain-type appDataContainer --domain-identifier "$BUNDLE_ID" \
    --source "$DATA" --destination "Library/OpenQuote/openquote.sqlite" >/dev/null
fi

echo "Opening…"
xcrun devicectl device process launch --device "$DEVICE" "$BUNDLE_ID" >/dev/null 2>&1 || echo "Installed. Open OpenQuote AU on the phone (you may need to trust the developer first)."
echo "Done."
