#!/usr/bin/env python3
# Compatibilidade: redireciona verificações estáticas ao teste da versão atual.
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('testar-v9.py')),run_name='__main__')
