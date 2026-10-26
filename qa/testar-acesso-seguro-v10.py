"""Smoke E2E da V10 desativada — sem banco, chaves ou dados pessoais."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
import threading, traceback

ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
def main():
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    errors=[]
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-gpu'])
            page=browser.new_page(viewport={'width':1440,'height':900})
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}/seguro/',wait_until='domcontentloaded')
            page.wait_for_function("document.querySelector('#status')?.textContent.includes('não configurado')")
            assert not page.locator('#workspace').is_visible(), 'Workspace não pode abrir sem backend exclusivo'
            assert not page.locator('#auth').is_visible(), 'Login não deve oferecer autenticação sem configuração'
            assert 'ainda não configurado' in page.locator('#status').inner_text()
            assert page.get_by_role('heading',name='Um espaço com acesso individual').is_visible()
            print('OK 01 — beta bloqueada até configuração dedicada',flush=True)
            for width in (1440,900,390):
                page.set_viewport_size({'width':width,'height':860})
                overflow=page.evaluate('Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth')
                assert overflow<=5,f'overflow de {overflow}px em {width}px'
            assert not errors,errors
            print('OK 02 — acessibilidade básica, layouts responsivos e sem exceções JS',flush=True)
            browser.close()
    finally:
        server.shutdown()
    print('V10 SMOKE APROVADO — nenhuma credencial necessária',flush=True)
if __name__=='__main__':
    try:main()
    except Exception as exc:
        print('V10 SMOKE FALHOU:',repr(exc),flush=True)
        traceback.print_exc()
        raise
