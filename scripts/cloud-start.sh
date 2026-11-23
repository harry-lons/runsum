#!/usr/bin/env bash
# Start the API (port 3011) and the web app (port 3010) for local development.
# Does not change production routes, vercel.json, or Flask handlers.
set -euo pipefail
set -m

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -x "$ROOT/apps/api/.venv/bin/python" ]]; then
  PYTHON="$ROOT/apps/api/.venv/bin/python"
elif [[ -x "$ROOT/apps/api/venv/bin/python" ]]; then
  PYTHON="$ROOT/apps/api/venv/bin/python"
else
  PYTHON="$(command -v python3)"
fi

API_PORT="${API_PORT:-3011}"
WEB_PORT="${WEB_PORT:-3010}"

pids=()
cleanup() {
  local pid
  for pid in "${pids[@]+"${pids[@]}"}"; do
    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

# API reads PORT (main.py defaults to 3011). Set it only in this process
# so the web app can use a different port.
(
  cd "$ROOT/apps/api"
  export PORT="$API_PORT"
  # Local/cloud agents: mock Strava so the dashboard works without OAuth credentials.
  # Set STRAVA_MOCK=0 to use a real Strava app instead.
  export STRAVA_MOCK="${STRAVA_MOCK:-1}"
  export JWT_SECRET="${JWT_SECRET:-dev-mock-secret}"
  export FRONTEND_URL="${FRONTEND_URL:-http://localhost:${WEB_PORT}}"
  exec "$PYTHON" main.py
) &
pids+=("$!")

(
  cd "$ROOT/apps/web"
  export PORT="$WEB_PORT"
  export BROWSER=none
  export CI=false
  if [[ -z "${REACT_APP_BACKEND_URL:-}" ]]; then
    export REACT_APP_BACKEND_URL="http://localhost:${API_PORT}"
  fi
  exec npm start
) &
pids+=("$!")

wait -n
exit $?
