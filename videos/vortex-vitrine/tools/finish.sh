#!/usr/bin/env bash
# Post-process the 240 fps render into the delivery file:
#   1. motion blur: average 4 sub-frames (tmix) and resample to 60 fps
#   2. replace the render's stem audio with the master mix (tools/mix.py), loudness-normalised
#      to -15 LUFS / -1.5 dBTP (two-pass loudnorm)
# Usage (from the project root): bash tools/finish.sh
set -euo pipefail
IN=renders/v-240.mp4
OUT=renders/video.mp4
MIX=assets/audio/mix.wav

# pass 1: measure loudness
STATS=$(ffmpeg -hide_banner -i "$MIX" -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$STATS" | grep "\"$1\"" | sed -E 's/.*: "([^"]+)".*/\1/'; }
LN="loudnorm=I=-15:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true"

# pass 2: blur + mux + normalise
ffmpeg -hide_banner -y -i "$IN" -i "$MIX" \
  -filter_complex "[0:v]tmix=frames=4:weights='1 1 1 1',fps=60[v];[1:a]${LN},aresample=48000[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 256k -shortest "$OUT"

ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tail -2
ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate -show_entries format=duration -of compact "$OUT"
