#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 scripts/verify-build.py
node --check core/demo-store.js
node --check profissional/app.js
node --check cliente/app.js
node testar-nucleo-v5.js
node testar-nucleo-v7.js
python3 testar-design-v6.py
python3 testar-estrutura-v5.py
python3 testar-final-integrado.py
python3 testar-biblioteca-v31.py
python3 testar-biblioteca-v32.py
python3 testar-integracao.py
python3 testar-v7-integracao.py
echo '=== RealTalent V7: QA estrutural e núcleo aprovado. QA visual manual ainda necessário. ==='
