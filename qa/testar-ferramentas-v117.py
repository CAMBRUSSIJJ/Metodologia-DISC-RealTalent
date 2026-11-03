"""Chromium V11.7: criar formulário, atribuir a um cliente e responder pela Minha Jornada."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from playwright.sync_api import sync_playwright
import threading

ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass

def main():
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    failures=[]
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
            ctx=browser.new_context(viewport={'width':1280,'height':720})
            pro=ctx.new_page()
            pro.on('pageerror',lambda e:failures.append(str(e)))
            base=f'http://127.0.0.1:{server.server_port}'
            pro.goto(base+'/profissional/index.html#ferramentas?tab=minhas')
            pro.get_by_role('link',name='+ Criar formulário').click()
            pro.locator('#rt-v117-builder-form').wait_for()
            pro.locator('#rt-v117-builder-form [name=title]').fill('Roteiro de prática comunicativa')
            pro.locator('#rt-v117-builder-form [name=instructions]').fill('Utilize exemplos inteiramente fictícios.')
            pro.locator('[data-sp=title]').fill('Reflexão inicial')
            pro.locator('[data-qp=label]').first.fill('Qual alternativa deseja experimentar?')
            pro.locator('[data-qp=type]').first.select_option('unica')
            pro.locator('[data-qp=options]').first.fill('Escuta ativa\nFeedback claro')
            pro.locator('[data-v117-action=q-add]').first.click()
            pro.locator('[data-qp=label]').nth(1).fill('Explique sua escolha.')
            pro.locator('[data-qp=required]').nth(1).uncheck()
            pro.locator('.rt-v117-header-actions button[type=submit]').click()
            pro.locator('.rt-v116-tool').filter(has_text='Roteiro de prática comunicativa').wait_for()
            print('PASS 01: formulário criado com seção, escolha única e campo opcional')
            pro.goto(base+'/profissional/index.html#cliente=c1&tab=atividades&program=p1')
            pro.get_by_role('button',name='Atribuir ferramenta própria').click()
            pro.locator('#f-visibility').select_option('compartilhado')
            pro.locator('#modal-save').click()
            pro.locator('[data-v917-instrument]').filter(has_text='Roteiro de prática comunicativa').wait_for()
            print('PASS 02: ferramenta atribuída explicitamente ao cliente c1')
            client=ctx.new_page()
            client.on('pageerror',lambda e:failures.append(str(e)))
            client.goto(base+'/cliente/index.html?demo=c1#atividades')
            card=client.locator('.rt98-activity').filter(has_text='Roteiro de prática comunicativa')
            card.wait_for()
            card.get_by_role('button',name='Responder atividade').click()
            client.locator('#instrument-fields .rt-v117-client-section').wait_for()
            client.locator('#instrument-fields input[type=radio][value="Escuta ativa"]').check()
            client.locator('#instrument-form button[type=submit]').click()
            client.locator('#instrument-dialog').wait_for(state='hidden')
            print('PASS 03: Minha Jornada envia respostas do formulário e aceita campo opcional')
            pro.reload()
            item=pro.locator('[data-v917-instrument]').filter(has_text='Roteiro de prática comunicativa')
            item.wait_for()
            item.locator('details').first.evaluate('(el)=>el.open=true')
            assert 'Escuta ativa' in item.inner_text()
            item.get_by_role('button',name='Revisar').click()
            pro.locator('#f-feedback').fill('Devolutiva educativa fictícia.')
            pro.locator('#f-feedbackVisibility').select_option('privado')
            pro.locator('#modal-save').click()
            print('PASS 04: profissional revisa respostas e mantém devolutiva privada')
            assert not failures,'JavaScript: '+'; '.join(failures)
            browser.close()
    finally:server.shutdown()
if __name__=='__main__':main()
