#!/bin/sh
# video-ai: get the workspace ready to make films. Run from the workspace (the folder Claude Code runs in).
#   sh "$SKILL/scripts/setup.sh"                 check system tools, download or update lemo-opuscar → prints LIB= and SKILL=
#   sh "$SKILL/scripts/setup.sh" deps            + the library's core packages: npm, headless browser, Python .venv (~350 MB)
#   sh "$SKILL/scripts/setup.sh" assets <pack>…  + big asset packs: hdri, vcsl, vsco2ce, freepats, karoryfer, salamander
#   sh "$SKILL/scripts/setup.sh" demo <slug>     + one style's demo source (read it only after TREATMENT.md is written)
#   sh "$SKILL/scripts/setup.sh" all             check + library + deps + hdri, vcsl, vsco2ce, freepats (the set used so far)
# Layout:  <workspace>/vendor/lemo-opuscar   the library (LIB; override with LIB=…)
#          <workspace>/films/<name>/         one folder per film
#          <workspace>/.env                  ELEVENLABS_API_KEY=… (never committed, never printed)
# System tools (Node 20+, ffmpeg 7+, Python 3.11+, Git) are reported, not installed: the agent asks the user first.
set -e
SKILL=$(cd "$(dirname "$0")/.." && pwd)
WS=$(pwd)
LIB=${LIB:-$WS/vendor/lemo-opuscar}
REPO=https://github.com/lemomo-ai/lemo-opuscar.git
. "$SKILL/scripts/env.sh"
WIN=; case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) WIN=1 ;; esac

# —— 1. system tools ——
py_ok() { "$1" -c 'import sys; sys.exit(sys.version_info < (3, 11))' 2>/dev/null; }
PY=; for c in python3.12 python3.13 python3.11 python python3; do py_ok "$c" && { PY=$c; break; }; done   # "python" before "python3": on Windows python3 is often the Store stub
miss=
command -v git >/dev/null || miss="$miss|git: winget install Git.Git"
if command -v node >/dev/null && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ]; then :; else miss="$miss|node 20+: winget install OpenJS.NodeJS.LTS"; fi
ffv=$(ffmpeg -version 2>/dev/null | sed -n '1s/^ffmpeg version n\{0,1\}\([0-9][0-9]*\)\..*/\1/p')
[ -n "$ffv" ] && [ "$ffv" -ge 7 ] || miss="$miss|ffmpeg 7+ (found: ${ffv:-none}): winget install Gyan.FFmpeg"
[ -n "$PY" ] || miss="$miss|Python 3.11+ (not the Microsoft Store one): winget install Python.Python.3.12"
if [ -n "$WIN" ] && [ -z "$PLAYWRIGHT_CHROME" ]; then echo "· no installed Chrome: deps downloads Playwright's headless shell instead"; fi
if [ -n "$miss" ]; then
  echo "✗ missing system tools (ask the user, then install, then open a new shell):"
  echo "$miss" | tr '|' '\n' | sed '/^$/d; s/^/    /'
  exit 1
fi
echo "✓ git, node $(node -v), ffmpeg $ffv, $($PY -V)"

# —— 2. the library: a sparse clone (guides, core/, every STYLE.md; no demo sources or gallery) ——
# We clone and update it ourselves (marked videoai.managed, never lemo.managed): the library's own setup.sh
# writes its sparse patterns through Git Bash, which rewrites "/styleboard/" into "C:/Program Files/Git/styleboard/".
# So git gets a C:/ path and MSYS_NO_PATHCONV; the library's setup.sh is only used for `deps`.
is_lib() { [ -f "$1/AGENTS.md" ] && [ -d "$1/core/render" ]; }
gitlib() { if [ -n "$WIN" ]; then MSYS_NO_PATHCONV=1 git -C "$(cygpath -m "$LIB")" "$@"; else git -C "$LIB" "$@"; fi; }
managed() { [ "$(gitlib config --get videoai.managed 2>/dev/null)" = true ]; }
sparse() {   # the library's own set, plus the demos already added (`setup.sh demo`)
  set -- '/*' '!/styles/*/demo/' '!/styleboard/' '!/docs/frames/' '!/docs/cover.jpg' '!/docs/opuscar98.jpg' '!/styles/*/poster.jpg' \
    $(gitlib sparse-checkout list 2>/dev/null | sed -n 's#^.*\(/styles/[^/*]*/\(demo/\|poster\.jpg\)\)$#\1#p' | sort -u)
  gitlib sparse-checkout set --no-cone "$@"
}
if [ "$(gitlib config --get lemo.managed 2>/dev/null)" = true ]; then   # a clone made by an earlier version of this script
  gitlib config --unset lemo.managed; gitlib config videoai.managed true
fi
if managed; then
  if gitlib fetch --quiet --depth 1 origin main 2>/dev/null && gitlib reset --quiet --hard FETCH_HEAD; then sparse
  else echo "! could not update $LIB (offline?); using the local copy"; is_lib "$LIB" || sparse; fi
elif ! is_lib "$LIB"; then
  [ -e "$LIB" ] && [ -n "$(ls -A "$LIB" 2>/dev/null)" ] && { echo "✗ $LIB exists but is not lemo-opuscar. Set LIB to another folder."; exit 1; }
  echo "↓ lemo-opuscar → $LIB"
  mkdir -p "$(dirname "$LIB")"
  git clone --quiet --depth 1 --filter=blob:none --sparse --branch main "$REPO" "$LIB" || { rm -rf "$LIB"; echo "✗ download failed (offline?)"; exit 1; }
  gitlib config videoai.managed true
  sparse
fi
is_lib "$LIB" || { echo "✗ $LIB is incomplete: delete it and run setup.sh again"; exit 1; }

# Windows: python -m venv makes .venv/Scripts, the library calls .venv/bin/python; a two-line shim bridges them
venv() {
  [ -n "$WIN" ] || return 0
  [ -x "$LIB/.venv/Scripts/python.exe" ] || "$PY" -m venv "$LIB/.venv"
  mkdir -p "$LIB/.venv/bin"
  printf '#!/bin/sh\nexec "$(dirname "$0")/../Scripts/python.exe" "$@"\n' > "$LIB/.venv/bin/python"
  chmod +x "$LIB/.venv/bin/python"
}
deps() {   # the library's setup.sh deps (npm, headless browser, .venv packages); its tool check is ours already
  st=$(mktemp)
  { if LEMO_OPUSCAR_HOME="$LIB" sh "$LIB/plugin/skills/lemo-opuscar/scripts/setup.sh" deps; then echo 0 > "$st"; else echo $? > "$st"; fi; } 2>&1 \
    | sed -e '/^LIB=/d' -e '/^! missing:/d' -e '/^! packages not installed/d'
  s=$(cat "$st"); rm -f "$st"; [ "$s" = 0 ] || { echo "✗ deps failed (exit $s)"; exit "$s"; }
  # npm may rewrite the lock file: put it back, and record the checksum the library's setup.sh compares against
  if managed; then gitlib checkout -q -- package.json package-lock.json
    cat "$LIB/package.json" "$LIB/package-lock.json" | cksum | cut -d' ' -f1 > "$LIB/node_modules/.lemo-ok"; fi
}
ready() { [ -f "$LIB/node_modules/.lemo-ok" ] && ls "$LIB"/.venv/.lemo-core >/dev/null 2>&1; }
# GitHub release downloads can crawl at ~60 KB/s per connection (measured from Vietnam) while many connections in
# parallel add up. So each pack is fetched as PARALLEL byte ranges into the file fetch.sh resumes from
# (.release/<file>.download); fetch.sh then finds it complete, checks its sha256 and unpacks it.
prefetch() {   # prefetch <pack name in tools/assets.json>
  info=$(node -e "const m=require(process.argv[1]),p=m.packs[process.argv[2]];if(p)console.log(m.repo,m.tag,p.file,p.size)" "$LIB/tools/assets.json" "$1")
  [ -n "$info" ] || return 0
  set -- $info
  url=https://github.com/$1/releases/download/$2/$3 dst="$LIB/.release/$3.download" size=$4
  mkdir -p "$LIB/.release"
  have=$(wc -c 2>/dev/null < "$dst" || echo 0); have=$((have))
  [ "$have" -gt "$size" ] && { rm -f "$dst"; have=0; }
  [ "$have" -eq "$size" ] && return 0
  n=${PARALLEL:-24}; chunk=$(( (size - have + n - 1) / n )); parts=$(mktemp -d)
  echo "↓ $3 ($((size / 1000000)) MB, $n connections$( [ "$have" -gt 0 ] && echo ", resuming at $((have / 1000000)) MB"))"
  for try in 1 2 3; do
    i=0
    while [ $i -lt $n ]; do
      s=$((have + i * chunk)) e=$((have + (i + 1) * chunk - 1)); [ $e -ge "$size" ] && e=$((size - 1))
      want=$((e - s + 1)); got=$(wc -c 2>/dev/null < "$parts/$i" || echo 0); got=$((got))
      [ $s -le $e ] && [ "$got" -lt "$want" ] && curl -sL --fail --connect-timeout 20 -r $((s + got))-$e "$url" >> "$parts/$i" &
      i=$((i + 1))
    done
    wait
    ok=1 i=0
    while [ $i -lt $n ]; do
      s=$((have + i * chunk)) e=$((have + (i + 1) * chunk - 1)); [ $e -ge "$size" ] && e=$((size - 1))
      [ $s -le $e ] && [ "$(wc -c 2>/dev/null < "$parts/$i" || echo 0)" -ne $((e - s + 1)) ] && ok=
      i=$((i + 1))
    done
    [ -n "$ok" ] && break
    echo "  some parts are short; retrying them ($try/3)"
  done
  [ -n "$ok" ] || { rm -rf "$parts"; echo "✗ $3: download incomplete; run the same command again"; exit 1; }
  i=0; while [ $i -lt $n ]; do [ -f "$parts/$i" ] && cat "$parts/$i" >> "$dst"; i=$((i + 1)); done
  rm -rf "$parts"
}
fetch() {
  for p in "$@"; do
    case $p in
      hdri) ls "$LIB"/core/assets/polyhaven/*.hdr >/dev/null 2>&1 && ! ls "$LIB"/.release/hdri.* >/dev/null 2>&1 && { echo "✓ hdri (already here)"; continue; }
        prefetch hdri; (cd "$LIB" && sh tools/fetch.sh hdri) ;;
      vcsl|vsco2ce|freepats|karoryfer|salamander)
        # done = unpacked, and no half-finished download left (fetch.sh deletes it after unpacking)
        [ -n "$(ls -A "$LIB/core/audio/instruments/$p" 2>/dev/null)" ] && ! ls "$LIB/.release/instruments-$p".* >/dev/null 2>&1 && { echo "✓ $p (already here)"; continue; }
        prefetch "instruments-$p"; (cd "$LIB" && sh tools/fetch.sh instruments "$p") ;;
      all) fetch vcsl vsco2ce freepats karoryfer salamander ;;
      *) echo "✗ unknown pack: $p (hdri, vcsl, vsco2ce, freepats, karoryfer, salamander, all)"; exit 1 ;;
    esac
  done
}

case "$1" in
  ""|check) ready || echo "! packages not installed yet: run sh \"\$SKILL/scripts/setup.sh\" deps (a few minutes) before the first render" ;;
  deps) venv; deps ;;
  assets) shift; [ $# -gt 0 ] || { echo "usage: setup.sh assets hdri vcsl …"; exit 1; }; venv; fetch "$@" ;;
  demo)
    [ -n "$2" ] && [ -f "$LIB/styles/$2/STYLE.md" ] || { echo "usage: setup.sh demo <slug>  (slugs: $LIB/styles/README.md)"; exit 1; }
    gitlib sparse-checkout add "/styles/$2/demo/" "/styles/$2/poster.jpg"
    echo "demo source: $LIB/styles/$2/demo" ;;
  all) venv; deps; fetch hdri vcsl vsco2ce freepats ;;
  *) sed -n '2,13p' "$0"; exit 1 ;;
esac
mkdir -p "$WS/films"
[ -f "$WS/.env" ] || echo "· no $WS/.env yet: the ElevenLabs key goes there as ELEVENLABS_API_KEY=… (only the API voice and forced alignment need it)"
echo "LIB=$LIB"
echo "SKILL=$SKILL"
