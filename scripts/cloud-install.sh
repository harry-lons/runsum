#!/usr/bin/env bash
# Install shared dev dependencies for the RunSum monorepo.
# Web deps land in apps/web/node_modules. API deps land in apps/api/venv.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

npm ci --prefix "$ROOT/apps/web"

python3 -m venv "$ROOT/apps/api/venv"
"$ROOT/apps/api/venv/bin/python" -m pip install --upgrade pip
"$ROOT/apps/api/venv/bin/pip" install -r "$ROOT/apps/api/requirements.txt"
