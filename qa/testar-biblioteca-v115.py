"""V11.5 E2E — importar, organizar, filtrar e apresentar material fictício."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
import threading,base64

ROOT=Path(__file__).resolve().parents[1]
IMAGE=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1cAAAAASUVORK5CYII=')
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

def main():
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
            ctx=browser.new_context(viewport={'width':1280,'height':720})
            page=ctx.new_page()
            page.goto(f'http://127.0.0.1:{server.server_port}/biblioteca/index.html?embedded=1#view=arquivos')
            page.get_by_role('heading',name='Meus arquivos').wait_for()
            page.locator('.rt-v115-add-folder').click()
            page.locator('.rt-v115-dialog input[name=name]').fill('Workshops')
            page.locator('.rt-v115-dialog button[type=submit]').click()
            page.locator('.rt-v113-upload input[type=file]').set_input_files({
                'name':'material-demo.png','mimeType':'image/png','buffer':IMAGE})
            page.locator('.rt-v113-file').first.wait_for()
            page.locator('.rt-v113-file button',has_text='Organizar').click()
            page.locator('.rt-v115-dialog [name=title]').fill('Treinamento')
            page.locator('.rt-v115-dialog [name=category]').select_option('Treinamentos')
            page.locator('.rt-v115-dialog [name=tags]').fill('Liderança, Comunicação')
            page.locator('.rt-v115-dialog button[type=submit]').click()
            page.get_by_label('Pesquisar materiais').fill('Treinamento')
            assert page.locator('.rt-v113-file').count()==1
            page.get_by_role('button',name='Salvar visão').click()
            page.locator('.rt-v115-dialog [name=name]').fill('Treinamentos')
            page.locator('.rt-v115-dialog button[type=submit]').click()
            page.get_by_role('button',name='Lista').click()
            page.reload()
            page.get_by_role('heading',name='Meus arquivos').wait_for()
            assert page.locator('.rt-v115-results.rt-v115-list').count()==1
            page.locator('.rt-v113-file button',has_text='Prévia').click()
            page.locator('.rt-v115-preview-stage img').wait_for()
            page.locator('.rt-v115-preview-head button').click()
            with page.expect_popup() as popup:
                page.locator('.rt-v113-file button',has_text='▶ Apresentar').click()
            popup.value.locator('#doc-title').wait_for()
            assert popup.value.locator('#doc-title').inner_text()=='Treinamento'
            browser.close()
            print('V11.5: pastas, importação, organização, visão, lista, prévia e apresentação OK')
    finally:
        server.shutdown()
if __name__=='__main__':main()
