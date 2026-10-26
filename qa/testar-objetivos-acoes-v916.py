"""RealTalent V9.16 — Playwright E2E de objetivos, ações e continuidade. Dados sintéticos."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
import threading,os,tempfile,traceback

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('REALTALENT_QA_OUTPUT',str(Path(tempfile.gettempdir())/'realtalent-v916')))
OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
def go(page,route):
    page.evaluate("(r)=>location.hash=r",route)
    page.wait_for_function("(r)=>location.hash===r && document.querySelector('#content')?.innerText.length>0",route)
    page.wait_for_timeout(130)
def main():
    srv=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=srv.serve_forever,daemon=True).start()
    errors=[]
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-gpu'])
            page=browser.new_page(viewport={'width':1440,'height':900})
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(f'http://127.0.0.1:{srv.server_port}/profissional/index.html',wait_until='domcontentloaded')
            page.wait_for_function("typeof RTDemoStore==='object' && typeof render==='function'")
            page.evaluate("RTDemoStore.reset();db=RTDemoStore.load();render()")
            go(page,'#cliente=c1&tab=desenvolvimento&program=p1')
            goal=page.locator('[data-v916-goal="goal-p1"]')
            assert goal.is_visible()
            goal.get_by_role('button',name='Editar objetivo').click()
            page.locator('#f-title').fill('Objetivo de comunicação V916 revisado')
            page.get_by_role('button',name='Salvar objetivo').click()
            assert page.evaluate("RTDemoStore.load().goals.find(g=>g.id==='goal-p1').title")=='Objetivo de comunicação V916 revisado'
            assert page.evaluate("RTDemoStore.load().actions.find(a=>a.id==='a1').goalId")=='goal-p1'
            print('OK 01 — edição preserva compromissos relacionados',flush=True)
            goal=page.locator('[data-v916-goal="goal-p1"]')
            goal.get_by_role('button',name='+ Ação').click()
            assert page.locator('#modal [name="programId"]').input_value()=='p1'
            assert page.locator('#modal [name="goalId"]').input_value()=='goal-p1'
            assert page.locator('#modal [name="visibility"]').input_value()=='privado'
            page.locator('#modal [name="title"]').fill('Compromisso privado V916 para teste')
            page.locator('#modal-save').click()
            page.wait_for_function("location.hash.includes('goal=goal-p1') && !document.querySelector('#modal').open")
            action=page.evaluate("RTDemoStore.load().actions.find(a=>a.title==='Compromisso privado V916 para teste')")
            assert action['programId']=='p1' and action['goalId']=='goal-p1' and action['visibility']=='privado'
            assert page.locator('#rt-v916-goal-filter').input_value()=='goal-p1'
            print('OK 02 — criação vinculada ao objetivo e privada por padrão',flush=True)
            page.locator('[data-v916-goal="goal-p1"]').get_by_role('link',name='Ver ações').click()
            page.wait_for_function("location.hash.includes('view=todas&goal=goal-p1')")
            page.locator('.rt-v94-filters').get_by_role('link',name='Concluídas').click()
            page.wait_for_function("location.hash.includes('view=concluidas&goal=goal-p1')")
            page.locator('#rt-v916-goal-filter').select_option('todos')
            page.wait_for_function("!location.hash.includes('&goal=')")
            print('OK 03 — filtros preservados e removíveis',flush=True)
            page.evaluate("""()=>{
                const d=RTDemoStore.load(),a=d.actions.find(x=>x.title==='Compromisso privado V916 para teste');
                a.sessionId='s1';RTDemoStore.save(d);db=RTDemoStore.load();render();
            }""")
            go(page,'#cliente=c1&tab=desenvolvimento&program=p1&view=todas')
            source=page.get_by_role('link',name='Abrir sessão de origem')
            assert source.count()>=1
            source.first.click()
            page.wait_for_function("location.hash.includes('session=s1')")
            print('OK 04 — compromisso abre sessão de origem',flush=True)
            go(page,'#plano-acao?filter=todas&program=p1')
            expected=page.evaluate("RTDemoStore.load().actions.filter(a=>a.programId==='p1').length")
            assert page.locator('[data-action-id]').count()==expected
            board=page.locator('[data-action-id]').filter(has_text='Compromisso privado V916 para teste')
            assert board.count()==1
            assert 'Objetivo de comunicação V916 revisado' in board.inner_text()
            assert board.get_by_role('link',name='Sessão de origem').count()==1
            assert page.locator('.rt-v95-summary strong').first.inner_text()==str(page.evaluate("RTDemoStore.load().actions.filter(a=>a.programId==='p1'&&a.status!=='concluido').length"))
            print('OK 05 — painel global aplica totais do processo escolhido',flush=True)
            go(page,'#cliente=c2&tab=desenvolvimento&program=p2')
            assert 'Compromisso privado V916 para teste' not in page.locator('#content').inner_text()
            for width in (1440,900,390):
                page.set_viewport_size({'width':width,'height':860})
                go(page,'#cliente=c1&tab=desenvolvimento&program=p1&view=todas')
                spill=page.evaluate("Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth")
                assert spill<=5,f'Overflow {spill}px em {width}px'
                page.screenshot(path=str(OUT/f'v916-{width}.png'),full_page=True)
            assert not errors,errors
            print('OK 06 — isolamento, responsividade e zero erros JS',flush=True)
            page.close();browser.close()
    finally:srv.shutdown()
    print('V9.16 E2E APROVADO — 6 grupos de verificações',flush=True)
if __name__=='__main__':
    try:main()
    except Exception as e:
        print('V9.16 E2E FALHA:',repr(e),flush=True)
        traceback.print_exc()
        raise
