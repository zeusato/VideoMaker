#!/bin/sh
# One command for a film project:
#   [tools/data.mjs] → voice (scripts/voice.mjs) → fonts (when missing) → events → picture → mix → master
#   → captions/<name>.srt → reading check → poster
# Env: LIB (lemo-opuscar), SKILL (this skill), SKIP_VIDEO=1 (keep out/video.mp4, redo the sound only),
#      DRAFT=1 (render with ?q=draft, for review), WORKERS (default 3).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
NAME=$(basename "$HERE")
LIB=${LIB:-$(cd "$HERE/../../vendor/lemo-opuscar" && pwd)}
SKILL=${SKILL:-"$HOME/.claude/skills/video-ai"}
export LIB SKILL
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the lemo-opuscar folder"; exit 1; }
[ -f "$SKILL/scripts/voice.mjs" ] || { echo "set SKILL to the video-ai skill folder"; exit 1; }
# Windows: winget Python and ffmpeg 7+, the installed Chrome, a UTF-8 console
export PATH="$HOME/AppData/Local/Programs/Python/Python312:$(ls -d "$HOME"/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg*/ffmpeg-*/bin 2>/dev/null | head -1):$PATH"
export PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-"C:/Program Files/Google/Chrome/Application/chrome.exe"} PYTHONUTF8=1
PY="$LIB/.venv/bin/python"
Q=""; [ -n "$DRAFT" ] && Q="--q q=draft"

[ -f "$HERE/tools/data.mjs" ] && node "$HERE/tools/data.mjs" "$HERE"
node "$SKILL/scripts/voice.mjs" "$HERE"
for f in $(grep -o 'fonts/[^)]*\.woff2' "$HERE/fonts.css" 2>/dev/null || echo missing); do [ -f "$HERE/$f" ] || { node "$SKILL/scripts/fonts.mjs" "$HERE"; break; }; done
node "$SKILL/scripts/export.mjs" "$HERE"

cd "$LIB"
node core/render/events.mjs "$HERE" $Q
[ -n "$SKIP_VIDEO" ] && [ -f "$HERE/out/video.mp4" ] || node core/render/video.mjs "$HERE" --fps 24 --workers ${WORKERS:-3} $Q --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" 24 1
node -e "const c=require(process.argv[1]);console.log(JSON.stringify(c.lines.map(l=>({t0:l.t0,t1:Math.max(l.t1+.6,l.t0+1.8),text:l.text}))))" "$HERE/out/cues.json" > "$HERE/out/cues_srt.json"
mkdir -p "$HERE/captions"   # never beside the .mp4: players auto-load a same-named .srt and double the burned-in subtitles
"$PY" core/render/srt.py "$HERE/out/cues_srt.json" "$HERE/captions/$NAME.srt"
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { grep -v "^OK" "$HERE/out/readcheck.txt"; echo "readcheck: fix the lines above"; }
T_POSTER=$(node -e "import('file:///' + process.argv[1].replace(/\\\\/g,'/') + '/timeline.js').then(m=>console.log((m.T.end+1.5).toFixed(2)))" "$HERE")
ffmpeg -v error -y -ss "$T_POSTER" -i "$HERE/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"
