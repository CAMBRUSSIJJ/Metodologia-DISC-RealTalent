"""V11.1 — Estúdio ↔ sessão ↔ Plano de Ação ↔ Minha Jornada. Dados fictícios."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
from datetime import date,timedelta
import tempfile,os,threading,traceback
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('REALTALENT_QA_OUTPUT',str(Path(tempfile.gettempdir())/'realtalent-v111')))
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
            ctx=browser.new_context(viewport={'width':1440,'height':900})
            origin=f'http://127.0.0.1:{server.server_port}'
            studio=ctx.new_page()
            studio.on('pageerror',lambda e:errors.append('studio '+str(e)))
            studio.on('dialog',lambda d:d.accept())
            studio.goto(origin+'/apresentacoes/?session=s1',wait_until='domcontentloaded')
            studio.wait_for_function("typeof RTDemoStore==='object'")
            studio.evaluate('RTDemoStore.reset()')
            studio.locator('[data-template="session"]').click()
            assert studio.locator('#presentation-session').input_value()=='s1'
            assert studio.locator('#session-workflow').is_hidden()
            studio.locator('#link-session').click()
            assert studio.locator('#session-workflow').is_visible()
            assert studio.evaluate('RTDemoStore.load().presentationLinks[0].visibility')=='privado'
            assert studio.locator('#presentation-goal').input_value()=='goal-p1'
            print('OK 01 — vincular apresentação à sessão, privada inicialmente',flush=True)

            studio.locator('#slide-notes').fill('NOTA PRIVADA NÃO COMPARTILHÁVEL')
            selectable=studio.locator('#publish-slides input[type=checkbox]')
            assert selectable.count()>=3
            selectable.first.check()
            selectable.nth(1).check()
            studio.locator('#publish-slides-btn').click()
            assert studio.evaluate("RTDemoStore.load().presentationLinks[0].visibility")=='compartilhado'
            client=ctx.new_page()
            client.on('pageerror',lambda e:errors.append('portal '+str(e)))
            client.goto(origin+'/cliente/index.html#materiais',wait_until='domcontentloaded')
            client.wait_for_function("document.querySelector('#app')?.innerText.includes('Apresentações disponibilizadas')")
            assert client.locator('[data-v111-shared]').count()==1
            client.locator('[data-v111-shared] summary').click()
            assert 'NOTA PRIVADA NÃO COMPARTILHÁVEL' not in client.locator('#app').inner_text()
            assert client.locator('.rt-v111-material-slide').count()==2
            client.locator('#demo-user').select_option('c2')
            assert client.locator('[data-v111-shared]').count()==0
            client.locator('#demo-user').select_option('c1')
            print('OK 02 — slides selecionados visíveis só ao cliente correto, sem notas',flush=True)

            pro=ctx.new_page()
            pro.on('pageerror',lambda e:errors.append('profissional '+str(e)))
            pro.goto(origin+'/profissional/index.html#cliente=c1&tab=sessoes&program=p1&session=s1',wait_until='domcontentloaded')
            pro.wait_for_function("document.querySelector('.rt-v111-session-presentations')?.innerText.includes('Sessão de desenvolvimento')",timeout=7000)
            assert pro.locator('.rt-v111-session-link').count()==1
            url=pro.locator('.rt-v111-session-link a').first.get_attribute('href')
            assert 'session=s1' in url and 'deck=' in url
            print('OK 03 — sessão profissional referencia roteiro original',flush=True)

            studio.locator('#presentation-action-form [name=title]').fill('Experimentar escuta ativa num caso fictício')
            studio.locator('#presentation-action-form [name=due]').fill((date.today()+timedelta(days=7)).isoformat())
            assert studio.locator('#presentation-action-form [name=visibility]').input_value()=='privado'
            studio.locator('#presentation-action-form button[type=submit]').click()
            studio.wait_for_function("RTDemoStore.load().actions.some(a=>a.title==='Experimentar escuta ativa num caso fictício')")
            act=studio.evaluate("RTDemoStore.load().actions.find(a=>a.title==='Experimentar escuta ativa num caso fictício')")
            assert act['sessionId']=='s1' and act['programId']=='p1' and act['goalId']=='goal-p1' and act['visibility']=='privado'
            client.reload(wait_until='domcontentloaded')
            assert 'Experimentar escuta ativa num caso fictício' not in client.locator('#app').inner_text()
            print('OK 04 — novo compromisso no plano existente, privado por padrão',flush=True)

            studio.locator('#withdraw-slides').click()
            client.reload(wait_until='domcontentloaded')
            client.wait_for_function("document.querySelector('#app')?.innerText.includes('Apresentações disponibilizadas')")
            assert client.locator('[data-v111-shared]').count()==0
            assert studio.evaluate("RTDemoStore.load().presentationLinks[0].visibility")=='privado'
            print('OK 05 — recolhimento revoga o material do portal',flush=True)

            for width in (1440,900,390):
                studio.set_viewport_size({'width':width,'height':840})
                overflow=studio.evaluate('Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth')
                assert overflow<=5,f'Estúdio {width}: transbordamento {overflow}px'
                studio.screenshot(path=str(OUT/f'v111-estudio-{width}.png'),full_page=True)
                client.set_viewport_size({'width':width,'height':840})
                overflow=client.evaluate('Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth')
                assert overflow<=5,f'Portal {width}: transbordamento {overflow}px'
            assert not errors,errors
            print('OK 06 — desktop/tablet/mobile, sem erros JavaScript',flush=True)
            ctx.close();browser.close()
    finally:server.shutdown()
    print('V11.1 E2E APROVADO — 6 grupos de integração',flush=True)
if __name__=='__main__':
    try:main()
    except Exception as exc:
        print('V11.1 E2E FALHA:',repr(exc),flush=True)
        traceback.print_exc()
        raise
