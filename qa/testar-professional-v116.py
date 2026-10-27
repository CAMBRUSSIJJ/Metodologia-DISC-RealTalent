"""V11.6 — cenários demonstrativos no Chromium: UX, ações, ferramentas e kit do cliente."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from playwright.sync_api import sync_playwright
import threading
ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass

def main():
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    errors=[]
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-gpu'])
            context=browser.new_context(viewport={'width':1280,'height':720})
            page=context.new_page()
            page.on('pageerror',lambda e:errors.append(str(e)))
            base=f'http://127.0.0.1:{server.server_port}/profissional/index.html'
            page.goto(base+'#cliente=c1&tab=atividades&program=p1',wait_until='domcontentloaded')
            page.locator('.rt-v116-activities').wait_for()
            assert page.get_by_role('heading',name='Como funciona').count()==0
            assert page.locator('.rt-v116-activities .rt-v94-main').count()==1
            print('OK 01 — atividades ocupam largura sem painel Como funciona')
            page.get_by_role('link',name='Kit da sessão').click()
            page.locator('#rt-v911-session-select').wait_for()
            ids=page.locator('#rt-v911-session-select option').evaluate_all(
                '(nodes)=>nodes.map(n=>n.value)')
            assert ids==['s1'],f'O kit não pode misturar clientes: {ids}'
            print('OK 02 — Kit de atendimento restrito ao cliente c1')
            page.goto(base+'#ferramentas?tab=minhas')
            # A V11.7 substituiu o modal antigo pelo construtor de formulários.
            # Esta regressão testa a compatibilidade dos roteiros V11.6 sem sections;
            # a criação visual V11.7 é coberta em testar-ferramentas-v117.py.
            page.evaluate("""() => RTCustomTools.upsert({
                title: 'Roteiro de feedback fictício',
                purpose: 'Reflexão sobre comunicação',
                instructions: 'Faça perguntas abertas sobre uma conversa hipotética e registre ações observáveis.'
            })""")
            page.reload()
            legacy=page.locator('.rt-v116-tool').filter(has_text='Roteiro de feedback fictício')
            legacy.wait_for()
            assert page.locator('.rt-v116-tool').count()==1
            assert 'Roteiro legado' in legacy.inner_text(), 'O catálogo deve preservar o roteiro V11.6'
            print('OK 03 — roteiro V11.6 legado preservado no catálogo')
            page.goto(base+'#cliente=c1&tab=atividades&program=p1')
            page.get_by_role('button',name='Atribuir ferramenta própria').click()
            assert page.locator('#f-toolId option').count()==1
            page.locator('#modal-save').click()
            page.locator('[data-v917-instrument]').filter(has_text='Roteiro de feedback fictício').wait_for()
            print('OK 04 — ferramenta atribuída apenas ao processo selecionado')
            page.goto(base+'#plano-acao')
            page.locator('.rt-v116-action').first.wait_for()
            page.locator('.rt-v116-action').first.get_by_role('button',name='Revisar avanço').click()
            fields=page.locator('#modal-form')
            fields.locator('[name=priority]').select_option('alta')
            fields.locator('[name=progress]').select_option('50')
            fields.locator('[name=reviewOn]').fill('2026-11-04')
            fields.locator('[name=internalNotes]').fill('ANOTAÇÃO INTERNA FICTÍCIA')
            page.locator('#modal-save').click()
            card=page.locator('.rt-v116-action').first
            assert '50%' in card.inner_text()
            assert 'alta' in card.inner_text()
            payload=page.evaluate("JSON.stringify(RTDemoStore.clientView(RTDemoStore.load(),'c1'))")
            assert 'ANOTAÇÃO INTERNA FICTÍCIA' not in payload
            print('OK 05 — revisar avanço sem expor nota interna')
            assert not errors,'JavaScript: '+'; '.join(errors)
            browser.close()
    finally:server.shutdown()

if __name__=='__main__':main()
