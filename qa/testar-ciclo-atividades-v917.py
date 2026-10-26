"""V9.17 — fluxo integral Profissional ↔ Minha Jornada; dados fictícios."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
import os, tempfile, threading, traceback

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('REALTALENT_QA_OUTPUT',str(Path(tempfile.gettempdir())/'realtalent-v917')))
OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
def go(page,route):
    page.evaluate("(r)=>location.hash=r",route)
    page.wait_for_function("(r)=>location.hash===r&&document.querySelector('#content,#app')?.innerText.length>0",arg=route)
    page.wait_for_timeout(120)
def main():
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    errors=[]
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-gpu'])
            ctx=browser.new_context(viewport={'width':1440,'height':900})
            pro=ctx.new_page()
            pro.on('pageerror',lambda e:errors.append('Profissional: '+str(e)))
            origin=f'http://127.0.0.1:{server.server_port}'
            pro.goto(origin+'/profissional/index.html',wait_until='domcontentloaded')
            pro.wait_for_function("typeof RTDemoStore==='object'&&typeof render==='function'")
            pro.evaluate('RTDemoStore.reset();db=RTDemoStore.load();render()')
            go(pro,'#cliente=c1&tab=atividades&program=p1&view=todas')
            pro.locator('[data-act="new-instrument-for"]:visible').first.click()
            assert pro.locator('#f-programId').input_value()=='p1'
            assert pro.locator('#f-goalId').input_value()=='goal-p1'
            assert pro.locator('#f-visibility').input_value()=='privado'
            pro.locator('#f-title').fill('Exercício demonstrativo V917')
            pro.locator('#f-instructions').fill('Considere somente um cenário imaginário.')
            pro.locator('#modal-save').click()
            pro.wait_for_function("RTDemoStore.load().instruments.some(i=>i.title==='Exercício demonstrativo V917')")
            iid=pro.evaluate("RTDemoStore.load().instruments.find(i=>i.title==='Exercício demonstrativo V917').id")
            client=ctx.new_page()
            client.on('pageerror',lambda e:errors.append('Cliente: '+str(e)))
            client.goto(origin+'/cliente/index.html#atividades',wait_until='domcontentloaded')
            client.wait_for_function("typeof S==='object'&&typeof render==='function'")
            assert 'Exercício demonstrativo V917' not in client.locator('#app').inner_text()
            print('OK 01 — atividade criada privada e vinculada ao objetivo',flush=True)
            go(pro,'#cliente=c1&tab=atividades&program=p1&view=todas')
            pcard=pro.locator('[data-v917-instrument="'+iid+'"]')
            assert 'Objetivo:' in pcard.inner_text()
            pcard.locator('[data-act="toggle-instrument"]').click()
            client.reload(wait_until='domcontentloaded')
            client.wait_for_function("document.querySelector('#app')?.innerText.includes('Exercício demonstrativo V917')")
            row=client.locator('.rt98-activity').filter(has_text='Exercício demonstrativo V917')
            assert 'Objetivo:' in row.inner_text()
            client.locator('#demo-user').select_option('c2')
            assert 'Exercício demonstrativo V917' not in client.locator('#app').inner_text()
            client.locator('#demo-user').select_option('c1')
            print('OK 02 — disponibilização explícita e clientes não misturados',flush=True)
            row=client.locator('.rt98-activity').filter(has_text='Exercício demonstrativo V917')
            row.get_by_role('button',name='Responder atividade').click()
            for key,value in [('answer0','Conversa imaginária de equipe'),('answer1','Perguntei antes de responder'),('answer2','Retomarei a conversa')]:
                client.locator('#instrument-form [name="'+key+'"]').fill(value)
            client.locator('#instrument-form button[type="submit"]').click()
            client.wait_for_function("(iid)=>RTDemoStore.load().instruments.find(i=>i.id===iid)?.status==='respondido'",arg=iid)
            assert client.locator('.rt98-tab.active').inner_text().startswith('Concluídas')
            print('OK 03 — participante envia uma única resposta e conclui atividade',flush=True)
            pro.reload(wait_until='domcontentloaded')
            go(pro,'#cliente=c1&tab=atividades&program=p1&view=todas')
            pcard=pro.locator('[data-v917-instrument="'+iid+'"]')
            assert 'Aguardando análise profissional' in pcard.inner_text()
            pcard.get_by_role('button',name='Revisar').click()
            pro.locator('#f-feedback').fill('Devolutiva fictícia exclusivamente interna')
            assert pro.locator('#f-feedbackVisibility').input_value()=='privado'
            pro.locator('#modal-save').click()
            client.reload(wait_until='domcontentloaded')
            go(client,'#atividades')
            client.get_by_role('button',name='Concluídas').click()
            done=client.locator('.rt98-activity').filter(has_text='Exercício demonstrativo V917')
            assert done.count()==1
            assert done.get_by_role('button',name='Responder atividade').count()==0
            assert 'Devolutiva fictícia exclusivamente interna' not in client.locator('#app').inner_text()
            print('OK 04 — devolutiva privada não reabre atividade nem vaza',flush=True)
            pro.reload(wait_until='domcontentloaded')
            go(pro,'#cliente=c1&tab=atividades&program=p1&view=todas')
            pro.locator('[data-v917-instrument="'+iid+'"]').get_by_role('button',name='Revisar').click()
            pro.locator('#f-feedback').fill('Orientação fictícia compartilhada com participante')
            pro.locator('#f-feedbackVisibility').select_option('compartilhado')
            pro.locator('#modal-save').click()
            client.reload(wait_until='domcontentloaded')
            go(client,'#atividades')
            client.get_by_role('button',name='Concluídas').click()
            done=client.locator('.rt98-activity').filter(has_text='Exercício demonstrativo V917')
            assert 'Orientação fictícia compartilhada com participante' in done.inner_text()
            go(client,'#desenvolvimento')
            assert 'Exercício demonstrativo V917' in client.locator('.rt-v917-goal-exercises').first.inner_text()
            print('OK 05 — orientação só aparece após liberação e permanece ligada ao objetivo',flush=True)
            for width in (1440,900,390):
                for page,route,prefix in [(pro,'#cliente=c1&tab=atividades&program=p1&view=todas','profissional'),(client,'#desenvolvimento','participante')]:
                    page.set_viewport_size({'width':width,'height':860})
                    go(page,route)
                    overflow=page.evaluate("Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth")
                    assert overflow<=5,f'{prefix} {width}px overflow {overflow}px'
                    page.screenshot(path=str(OUT/f'v917-{prefix}-{width}.png'),full_page=True)
            assert not errors,errors
            print('OK 06 — desktop, tablet, mobile e sem erros JS',flush=True)
            ctx.close();browser.close()
    finally:server.shutdown()
    print('V9.17 E2E APROVADO — 6 grupos de verificação',flush=True)
if __name__=='__main__':
    try:main()
    except Exception as e:
        print('V9.17 E2E FALHA:',repr(e),flush=True)
        traceback.print_exc()
        raise
