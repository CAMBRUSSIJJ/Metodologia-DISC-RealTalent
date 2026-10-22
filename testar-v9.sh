#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 testar-v9.py
node testar-nucleo-v81.js
python3 testar-biblioteca-v31.py
python3 scripts/verify-build.py
