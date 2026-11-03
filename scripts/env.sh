# Sourced by setup.sh and every build.sh: puts winget's Python and ffmpeg 7+ on PATH (a fresh shell may not
# see them yet), points the renderer at the installed Chrome when there is one, and makes Python print UTF-8.
#   . "$SKILL/scripts/env.sh"
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    for d in "$HOME"/AppData/Local/Programs/Python/Python31[1-3] "$HOME"/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg*/ffmpeg-*/bin; do
      [ -d "$d" ] && PATH="$d:$PATH"
    done
    [ -z "$PLAYWRIGHT_CHROME" ] && [ -f "C:/Program Files/Google/Chrome/Application/chrome.exe" ] && PLAYWRIGHT_CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe"
    ;;
esac
export PATH PLAYWRIGHT_CHROME PYTHONUTF8=1 PYTHONIOENCODING=utf-8
