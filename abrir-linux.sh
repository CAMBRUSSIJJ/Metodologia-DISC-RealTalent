#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${REALTALENT_PORT:-8810}"
if ! command -v python3 >/dev/null 2>&1; then echo 'Instale Python 3: sudo apt install python3' >&2; exit 1; fi
cd "$DIR"
echo '══════════════════════════════════════════════════'
echo '  RealTalent DISC/ACER V11.4 — APRESENTADOR PROFISSIONAL'
echo '══════════════════════════════════════════════════'
python3 scripts/verify-build.py
python3 scripts/ensure-pdfjs-v114.py
printf 'Diretório: %s\n' "$DIR"
printf 'Entrada: http://127.0.0.1:%s/index.html\n' "$PORT"
printf 'Professional: http://127.0.0.1:%s/profissional/index.html\n' "$PORT"
printf 'Minha Jornada: http://127.0.0.1:%s/cliente/index.html\n' "$PORT"
printf 'DISC/ACER: Cliente → Minhas atividades | Professional → Ferramentas e Gráficos e relatórios\n'
echo 'Encerrar: Ctrl+C'
# bind efetivo feito pelo servidor; erro de porta ocupada é explícito.
python3 -u scripts/server.py --port "$PORT" &
PID=$!
trap 'kill "$PID" 2>/dev/null || true' EXIT
sleep 0.5
if ! kill -0 "$PID" 2>/dev/null; then wait "$PID" || true; exit 1; fi
if [[ "${REALTALENT_NO_BROWSER:-0}" != '1' ]]; then
  if command -v firefox >/dev/null 2>&1; then
    (firefox --new-window "http://127.0.0.1:$PORT/index.html" >/dev/null 2>&1 || true) &
  elif command -v xdg-open >/dev/null 2>&1; then
    (xdg-open "http://127.0.0.1:$PORT/index.html" >/dev/null 2>&1 || true) &
  fi
fi
wait "$PID"
