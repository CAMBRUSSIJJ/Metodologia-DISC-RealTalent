#!/usr/bin/env python3
"""Servidor local APENAS para demonstração, com cache HTML/JS/CSS desativado."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('X-Realtalent-Version', '9.7-demo')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()
    def log_message(self, fmt,*args):
        print('[RealTalent V9.7] '+fmt%args,flush=True)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8807)
    args=p.parse_args()
    root=Path(__file__).resolve().parent.parent
    os.chdir(root)
    try:
        with ThreadingHTTPServer(('127.0.0.1',args.port),Handler) as server:
            print(f'V9.7 | ORIGEM: {root} | http://127.0.0.1:{args.port}/index.html',flush=True)
            server.serve_forever()
    except OSError as e:
        raise SystemExit(f'ERRO: a porta {args.port} está indisponível ({e}). Defina REALTALENT_PORT=8808 para testar outra porta.')
