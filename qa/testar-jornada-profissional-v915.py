"""RealTalent V9.15: jornada profissional derivada dos registros existentes. Apenas dados fictícios."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from playwright.sync_api import sync_playwright
import threading, tempfile, os, traceback

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get("REALTALENT_QA_OUTPUT",str(Path(tempfile.gettempdir())/"realtalent-v915-qa")))
OUT.mkdir(parents=True,exist_ok=True)

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

def go(page,route):
    page.evaluate("(route)=>{location.hash=route}",route)
    page.locator("#content").wait_for(state="visible")
    page.wait_for_timeout(140)

def main():
    server=ThreadingHTTPServer(("127.0.0.1",0),partial(QuietHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    errors=[]
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=["--no-sandbox","--disable-gpu"])
            page=browser.new_page(viewport={"width":1440,"height":900})
            page.on("pageerror",lambda err:errors.append(str(err)))
            page.goto(f"http://127.0.0.1:{server.server_port}/profissional/index.html",wait_until="domcontentloaded")
            page.wait_for_function("typeof RTDemoStore==='object' && typeof render==='function'")
            page.evaluate("RTDemoStore.reset();db=RTDemoStore.load();render()")
            go(page,"#cliente=c1&tab=geral&program=p1")
            journey=page.locator(".rt-v915-journey")
            assert journey.is_visible()
            assert journey.locator("[data-v915-step]").count()==4
            for key,tab in [("objetivos","desenvolvimento"),("sessoes","sessoes"),("acoes","desenvolvimento"),("atividades","atividades")]:
                assert f"tab={tab}" in journey.locator(f'[data-v915-step="{key}"]').get_attribute("href")
            assert "Não representa evolução psicológica" in journey.inner_text()
            assert page.locator(".rt-v9-workspace-tabs a").count()==6
            assert page.locator(".rt-v92-timeline").count()==1
            print("OK 01 — uma jornada de quatro áreas, histórico e seis abas originais",flush=True)

            goal_names=page.evaluate("RTDemoStore.goalsOf(RTDemoStore.load(),'p1').map(g=>g.title)")
            assert goal_names
            for name in goal_names[:3]:
                assert name in page.locator(".rt-v915-goals").inner_text()
            assert page.locator(".rt-v915-goals").count()==1
            print("OK 02 — objetivos realmente vinculados ao processo",flush=True)

            page.evaluate("""()=>{
                const d=RTDemoStore.load();
                RTDemoStore.createGoal(d,'p1','Novo objetivo fictício V915');
                d.sessions.push({id:'v915-expired',programId:'p1',date:'2020-06-10',time:'09:00',status:'agendada',clientTopic:'Sessão pendente de confirmação',summary:''});
                d.actions.push({id:'v915-late',programId:'p1',title:'Acordo fictício vencido V915',status:'pendente',due:'2020-06-11',visibility:'privado'});
                d.instruments.push({id:'v915-response',programId:'p1',title:'Reflexão fictícia respondida',responses:'Relato de teste',feedback:'',assignedAt:'2020-06-10',visibility:'privado'});
                RTDemoStore.save(d);db=RTDemoStore.load();render();
            }""")
            go(page,"#cliente=c1&tab=geral&program=p1")
            assert "Novo objetivo fictício V915" in page.locator(".rt-v915-goals").inner_text()
            assert "sem confirmação" in journey.locator('[data-v915-step="sessoes"]').inner_text()
            assert "prazo vencido" in journey.locator('[data-v915-step="acoes"]').inner_text()
            assert "para revisar" in journey.locator('[data-v915-step="atividades"]').inner_text()
            assert journey.locator('[data-attention="true"]').count()>=3
            print("OK 03 — pendências reais atualizam a jornada sem registros adicionais",flush=True)

            page.locator('[data-v915-step="atividades"]').click()
            assert page.locator(".rt-v94-tab-head h2").inner_text()=="Atividades"
            go(page,"#cliente=c2&tab=geral&program=p2")
            assert "Novo objetivo fictício V915" not in page.locator(".rt-v915-goals").inner_text()
            assert "Acordo fictício vencido V915" not in page.locator("#content").inner_text()
            print("OK 04 — navegação e isolamento dos contextos demonstrativos",flush=True)

            go(page,"#processos")
            assert page.locator(".rt-v915-process-guide").count()==1
            assert not page.locator(".rt-v915-process-guide").get_attribute("open")
            page.locator(".rt-v915-process-guide summary").click()
            assert page.locator(".rt-v915-process-guide[open]").count()==1
            page.locator('[data-act="process-detail"]').first.click()
            assert "tab=geral" in page.url and page.locator(".rt-v915-journey").is_visible()
            print("OK 05 — processos levam à jornada e guia fica recolhido",flush=True)

            for width in (1440,900,390):
                page.set_viewport_size({"width":width,"height":860})
                go(page,"#cliente=c1&tab=geral&program=p1")
                overflow=page.evaluate("Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth")
                assert overflow<=5,f"Overflow {overflow}px no viewport {width}"
                page.screenshot(path=str(OUT/f"v915-jornada-{width}.png"),full_page=True)
            assert not errors,f"Erros Javascript: {errors}"
            print("OK 06 — desktop/tablet/mobile e zero erros JS",flush=True)
            page.close();browser.close()
    finally:
        server.shutdown()
    print("V9.15 E2E APROVADO — 6 grupos de validação",flush=True)

if __name__=="__main__":
    try:main()
    except Exception as exc:
        print("V9.15 E2E FALHOU:",repr(exc),flush=True)
        traceback.print_exc()
        raise
