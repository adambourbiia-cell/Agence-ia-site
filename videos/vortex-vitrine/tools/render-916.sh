#!/usr/bin/env bash
# Render the 9:16 variant. `hyperframes render` reads index.html, so this stages a temporary
# project whose index.html is index-916.html (assets and compositions are symlinked).
# Usage (from the project root): bash tools/render-916.sh
set -euo pipefail
P=$(pwd)
node tools/build.mjs --portrait
TMP=$(mktemp -d)
ln -s "$P/assets" "$TMP/assets"
ln -s "$P/compositions-916" "$TMP/compositions-916"
cp hyperframes.json package.json meta.json "$TMP/"
cp index-916.html "$TMP/index.html"
(cd "$TMP" && npx hyperframes render --quality high --fps 240 --workers 4 --output "$P/renders/v-240-916.mp4")
bash tools/finish.sh renders/v-240-916.mp4 renders/video-916.mp4
rm -rf "$TMP"
