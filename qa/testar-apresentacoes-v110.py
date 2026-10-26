"""V11.0 — Estúdio de Apresentações: E2E de edição, Biblioteca, persistência, PDF/imagem e projeção.
Somente dados demonstrativos; não importa dados de clientes.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
import base64,threading,os,tempfile,traceback

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('REALTALENT_QA_OUTPUT',str(Path(tempfile.gettempdir())/'realtalent-v11-qa')))
OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
def main():
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    errors=[]
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-gpu'])
            context=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
            page=context.new_page()
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}/apresentacoes/',wait_until='domcontentloaded')
            page.get_by_role('heading',name='Apresentações com propósito').wait_for()
            assert page.locator('#deck-list .empty-library').is_visible()
            page.locator('#new-deck').click()
            assert page.locator('#editor').is_visible()
            assert page.locator('#slides-list .slide-list-item').count()==1
            page.locator('#deck-title').fill('Oficina demonstrativa de desenvolvimento')
            page.locator('#slide-title').fill('Boas-vindas ao encontro')
            page.locator('#slide-notes').fill('Nota privada do profissional — NÃO projetar')
            page.locator('#slide-kind').select_option('text')
            page.locator('#add-slide').click()
            assert page.locator('#slides-list .slide-list-item').count()==2
            page.locator('#slide-title').fill('Ideias de conversa')
            page.locator('#slide-body').fill('Escuta\nComunicação\nExemplos fictícios')
            assert 'Ideias de conversa' in page.locator('#stage').inner_text()
            page.locator('#move-up').click()
            assert page.locator('#slides-list .slide-list-item').first.get_attribute('aria-current')=='true'
            page.locator('#duplicate-slide').click()
            assert page.locator('#slides-list .slide-list-item').count()==3
            print('OK 01 — criar/editar, adicionar, mover e duplicar slide',flush=True)

            page.locator('#present').click()
            assert page.locator('#presenter').is_visible()
            assert 'Nota privada do profissional' not in page.locator('#presenter').inner_text()
            assert 'Slide 2 de 3' in page.locator('#presenter-count').inner_text()
            page.keyboard.press('ArrowRight')
            assert 'Slide 3 de 3' in page.locator('#presenter-count').inner_text()
            page.keyboard.press('ArrowLeft')
            assert 'Slide 2 de 3' in page.locator('#presenter-count').inner_text()
            page.locator('#exit-presenter').click()
            assert not page.locator('#presenter').is_visible()
            print('OK 02 — projeção, atalhos e notas ocultas',flush=True)

            page.reload(wait_until='domcontentloaded')
            page.locator('#deck-list .deck-card').first.get_by_role('button',name='Abrir').click()
            assert 'Oficina demonstrativa de desenvolvimento' in page.locator('#deck-title').input_value()
            assert page.locator('#slides-list .slide-list-item').count()==3
            page.locator('#slide-kind').select_option('library')
            page.locator('#add-slide').click()
            dialog=page.locator('#library-dialog')
            dialog.wait_for(state='visible')
            page.locator('#library-search').fill('Fundamentos do modelo')
            page.locator('#library-results .library-result').first.click()
            assert page.locator('#selected-resource').inner_text().endswith('art:fundamentos')
            assert 'Fundamentos do modelo' in page.locator('#stage').inner_text()
            print('OK 03 — persistência local e inserção da Biblioteca original',flush=True)

            page.locator('#slide-kind').select_option('document')
            page.locator('#add-slide').click()
            sample=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1cAAAAASUVORK5CYII=')
            page.locator('#upload-file').set_input_files({'name':'imagem-demonstrativa.png','mimeType':'image/png','buffer':sample})
            page.wait_for_function("Boolean(document.querySelector('#stage img')?.src?.startsWith('blob:'))")
            page.reload(wait_until='domcontentloaded')
            page.locator('#deck-list .deck-card').first.get_by_role('button',name='Abrir').click()
            page.locator('#slides-list .slide-list-item').last.click()
            page.wait_for_function("Boolean(document.querySelector('#stage img')?.src?.startsWith('blob:'))")
            print('OK 04 — arquivos de imagem mantidos em IndexedDB após recarga',flush=True)

            page.locator('#slide-kind').select_option('tool')
            page.locator('#add-slide').click()
            assert page.locator('#stage .tool-board input[type=range]').count()==8
            page.locator('#slide-tool').select_option('5w2h')
            assert page.locator('#stage .tool-board textarea').count()==7
            page.locator('#slide-kind').select_option('question')
            page.locator('#add-slide').click()
            page.locator('#slide-body').fill('Opção fictícia A\nOpção fictícia B\nOpção fictícia C')
            assert page.locator('#stage .option-btn').count()==3
            page.locator('#present').click()
            page.locator('#presentation-stage .option-btn').nth(1).click()
            assert page.locator('#presentation-stage .option-btn').nth(1).get_attribute('aria-pressed')=='true'
            page.locator('#exit-presenter').click()
            print('OK 05 — ferramenta 5W2H, Roda e pergunta interativa',flush=True)

            for width in (1440,900,390):
                page.set_viewport_size({'width':width,'height':840})
                overflow=page.evaluate('Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth')
                assert overflow<=5,f'Overflow editor: {width}px excede {overflow}px'
                page.screenshot(path=str(OUT/f'v110-studio-{width}.png'),full_page=True)
            page.locator('#editor-back').click()
            assert page.locator('#deck-list .deck-card').count()==1
            assert not errors,f'Erros Javascript: {errors}'
            print('OK 06 — viewport desktop/tablet/mobile, coleção e sem erros JS',flush=True)

            # Integração no menu profissional.
            professional=context.new_page()
            professional.on('pageerror',lambda e:errors.append('Profissional: '+str(e)))
            professional.goto(f'http://127.0.0.1:{server.server_port}/profissional/index.html#apresentacoes',wait_until='domcontentloaded')
            professional.wait_for_function("document.querySelector('[data-rt-module=presentations]')!==null")
            assert professional.locator('[data-page="apresentacoes"]').get_attribute('aria-current')=='page'
            assert professional.locator('[data-rt-module="presentations"]').get_attribute('allowfullscreen') is not None
            embedded=professional.frame_locator('[data-rt-module="presentations"]')
            assert embedded.get_by_role('heading',name='Apresentações com propósito').is_visible()
            print('OK 07 — nova aba integrada à navegação e iframe com tela cheia',flush=True)
            assert not errors,errors
            context.close();browser.close()
    finally:server.shutdown()
    print('V11.0 E2E APROVADO — 7 grupos de validação',flush=True)
if __name__=='__main__':
    try:main()
    except Exception as err:
        print('V11.0 E2E FALHOU:',repr(err),flush=True)
        traceback.print_exc()
        raise
