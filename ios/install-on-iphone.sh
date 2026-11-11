#!/bin/bash
# Builds the OpenQuote AU iPhone app and installs it on a connected iPhone (free Apple ID: re-run every 7 days).
set -euo pipefail
cd "$(dirname "$0")/App"
DEVICE="${1:-$(xcrun devicectl list devices 2>/dev/null | grep -E 'physical|paired' | grep -v simulated | grep -oE '[0-9A-F]{8}-[0-9A-F]{16}' | head -1)}"
[ -n "$DEVICE" ] || { echo "No paired iPhone found. Plug it in, unlock it and tap Trust."; exit 1; }
echo "Building for $DEVICE…"
xcodebuild -project App.xcodeproj -scheme App -configuration Debug -destination "id=$DEVICE" \
  -derivedDataPath ../build -allowProvisioningUpdates build 2>&1 | tee ../build.log | grep -E "error:|warning: .*signing|BUILD (SUCCEEDED|FAILED)" || true
APP="../build/Build/Products/Debug-iphoneos/App.app"
[ -d "$APP" ] || { echo "Build failed; see ios/build.log"; exit 1; }
echo "Installing…"
xcrun devicectl device install app --device "$DEVICE" "$APP"
echo "Opening…"
BUNDLE_ID=$(/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" "$APP/Info.plist")
xcrun devicectl device process launch --device "$DEVICE" "$BUNDLE_ID" || echo "Installed. Open OpenQuote AU on the phone (you may need to trust the developer first)."
