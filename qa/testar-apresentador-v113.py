"""V11.3 — E2E Biblioteca → Apresentador. Somente arquivo sintético PNG."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
import base64, threading, os, tempfile

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('REALTALENT_QA_OUTPUT',str(Path(tempfile.gettempdir())/'realtalent-v113')))
OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

def main():
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    errors=[]
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-gpu'])
            context=browser.new_context(viewport={'width':1280,'height':720})
            page=context.new_page()
            page.on('pageerror',lambda e:errors.append('library: '+str(e)))
            origin=f'http://127.0.0.1:{server.server_port}'
            page.goto(origin+'/biblioteca/index.html?embedded=1#view=arquivos',wait_until='domcontentloaded')
            page.get_by_role('heading',name='Meus arquivos').wait_for()
            assert page.locator('.rt-v113-empty').is_visible()
            sample=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1cAAAAASUVORK5CYII=')
            page.locator('.rt-v113-upload input[type=file]').set_input_files({
                'name':'apresentacao-ficticia.png','mimeType':'image/png','buffer':sample
            })
            page.locator('.rt-v113-file').first.wait_for()
            assert 'apresentacao-ficticia' in page.locator('.rt-v113-file').first.inner_text()
            print('V11.3 OK 01 — importar imagem pela Biblioteca',flush=True)
            with page.expect_popup() as new_window:
                page.get_by_role('button',name='▶ Apresentar').first.click()
            viewer=new_window.value
            viewer.on('pageerror',lambda e:errors.append('viewer: '+str(e)))
            viewer.wait_for_load_state('domcontentloaded')
            viewer.locator('#document img').wait_for()
            assert viewer.locator('#doc-title').inner_text()=='apresentacao-ficticia'
            assert viewer.locator('#document img').get_attribute('src').startswith('blob:')
            viewer.locator('#zoom-in').click()
            assert viewer.locator('#zoom-value').inner_text()=='110%'
            viewer.locator('[data-tool="pen"]').click()
            assert viewer.locator('#ink').is_visible()
            viewer.locator('#clear-ink').click()
            viewer.locator('#notes-toggle').click()
            assert viewer.locator('#notes').is_visible()
            viewer.locator('#close-notes').click()
            viewer.locator('#focus').click()
            assert viewer.locator('#topbar').is_hidden()
            viewer.keyboard.press('Escape')
            assert viewer.locator('#topbar').is_visible()
            print('V11.3 OK 02 — abrir original e utilizar ferramentas',flush=True)
            viewer.close()
            page.reload(wait_until='domcontentloaded')
            page.locator('.rt-v113-file').first.wait_for()
            page.locator('.rt-v113-card-actions button').nth(1).click()
            central=context.new_page()
            central.on('pageerror',lambda e:errors.append('central: '+str(e)))
            central.goto(origin+'/apresentacoes/central.html',wait_until='domcontentloaded')
            assert central.locator('#favorites .item').count()==1
            assert central.locator('#recent .item').count()==1
            print('V11.3 OK 03 — persistência, favoritos e recentes',flush=True)
            page.goto(origin+'/biblioteca/index.html?embedded=1#item=art:fundamentos',wait_until='domcontentloaded')
            page.get_by_role('heading',name='Fundamentos do modelo').wait_for()
            with page.expect_popup() as popup:
                page.get_by_role('button',name='▶ Apresentar').click()
            article=popup.value
            article.on('pageerror',lambda e:errors.append('article: '+str(e)))
            article.locator('.article-slide').wait_for()
            assert article.locator('#page-info').inner_text().startswith('Página 1 de')
            article.locator('#next').click()
            assert 'Fundamentos do modelo' in article.locator('.article-slide').inner_text()
            print('V11.3 OK 04 — artigo da Biblioteca no apresentador',flush=True)
            assert not errors, 'Erros de JavaScript: '+'; '.join(errors)
            browser.close()
    finally:
        server.shutdown()

if __name__=='__main__':
    main()
