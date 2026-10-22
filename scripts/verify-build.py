#!/usr/bin/env python3
"""Confere SHA256 de cada arquivo entregue, evitando execução de pacote misturado."""
import hashlib,json,sys
from pathlib import Path
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'build-manifest.json').read_text())
errors=[]
for file,expected in manifest['files'].items():
 p=root/file
 if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()!=expected:
  errors.append(file)
if errors:
 print('ERRO: Pacote RealTalent misturado/modificado; arquivos divergentes:',', '.join(errors[:20]),file=sys.stderr)
 sys.exit(2)
print(f"Integridade V{manifest['version']} OK — {len(manifest['files'])} arquivos verificados.")
