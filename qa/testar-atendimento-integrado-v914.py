"""RealTalent V9.14 — Playwright: atendimento integrado e responsividade.
Executar: python qa/testar-atendimento-integrado-v914.py
Somente dados fictícios. Servidor HTTP temporário na máquina de QA.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import os, tempfile, threading, traceback

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=Path(os.environ.get("REALTALENT_QA_OUTPUT",str(Path(tempfile.gettempdir())/"rt-v914-e2e")))
OUTPUT.mkdir(parents=True,exist_ok=True)

class Silent(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

def start_server():
    server=ThreadingHTTPServer(("127.0.0.1",0),partial(Silent,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    return server,f"http://127.0.0.1:{server.server_port}"

def go(p,url):
    p.evaluate("(v)=>{location.hash=v}",url)
    p.wait_for_timeout(140)

def main():
    server,origin=start_server()
    errors=[]
    milestones=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,args=["--no-sandbox","--disable-gpu"])
        page=browser.new_page(viewport={"width":1440,"height":900})
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.goto(origin+"/profissional/index.html",wait_until="domcontentloaded")
        page.wait_for_function("typeof RTSessionWorkspace==='object' && typeof RTSessionAssist==='object' && typeof RTDemoStore==='object'")
        page.evaluate("RTDemoStore.reset();db=RTDemoStore.load();render()")
        go(page,"#sessoes?filter=proximos")
        assert page.get_by_role("heading",name="Sessões").count()>0
        assert page.locator(".rt-v914-agenda-card").count()>=1
        assert page.locator(".rt-v914-agenda-cta a").first.get_attribute("href").find("session=")>-1
        milestones.append("01: lista de sessões e entrada direta")

        go(page,"#cliente=c1&tab=sessoes&program=p1&session=s1")
        assert page.locator('[data-rt-v914-workspace]').is_visible()
        assert page.get_by_role("navigation",name="Etapas do atendimento").count()==1
        assert page.locator(".rt-v914-stage-nav a[aria-current='step']").count()==1
        assert page.locator(".rt-v914-stage-nav a[aria-current='step']").inner_text().find("Antes")>=0
        assert page.locator("#rt-v911-prep-form").is_visible()
        assert page.locator('[data-act="new-session-action"][data-id="s1"]').count()==1
        assert page.locator('[data-act="close-session"][data-id="s1"]').count()==1
        assert "Compromissos deste encontro" in page.locator("#content").inner_text()
        milestones.append("02: espaço amplo / Antes / ações únicas")

        page.locator('#rt-v911-prep-form [name="goal"]').fill("V914 GROW PRIVADO SOMENTE PROFISSIONAL")
        page.locator("#rt-v911-prep-form button[type=submit]").click()
        assert page.evaluate("RTDemoStore.load().sessions.find(s=>s.id==='s1').preparation.goal")=="V914 GROW PRIVADO SOMENTE PROFISSIONAL"
        page.reload(wait_until="domcontentloaded")
        assert page.locator('#rt-v911-prep-form [name="goal"]').input_value()=="V914 GROW PRIVADO SOMENTE PROFISSIONAL"
        milestones.append("03: GROW permanece na sessão e sobrevive recarga")

        go(page,"#cliente=c1&tab=sessoes&program=p1&session=s1&moment=durante")
        page.locator("#rt-v914-live-form").wait_for(state="visible")
        page.locator('#rt-v914-live-form [name="liveNotes"]').fill("V914 NOTAS PRIVADAS NA CONDUÇÃO")
        page.locator("#rt-v914-live-form button[type=submit]").click()
        assert page.evaluate("RTDemoStore.load().sessions.find(s=>s.id==='s1').liveNotes")=="V914 NOTAS PRIVADAS NA CONDUÇÃO"
        assert page.locator("#rt-v913-clock").is_visible()
        page.locator('[data-act="rt-v913-timer"][data-id="start"]').click()
        assert page.evaluate("RTSessionAssist.snapshot(RTDemoStore.load().sessions.find(s=>s.id==='s1')).running")
        page.locator('[data-act="rt-v913-timer"][data-id="pause"]').click()
        assert not page.evaluate("RTSessionAssist.snapshot(RTDemoStore.load().sessions.find(s=>s.id==='s1')).running")
        page.locator('[data-act="rt-v913-toggle-question"][data-id="cq-01"]').click()
        assert page.evaluate("RTDemoStore.load().sessions.find(s=>s.id==='s1').coachingQuestionIds.includes('cq-01')")
        assert "moment=durante" in page.url,"Inline question selection should not leave the session"
        milestones.append("04: notas, temporizador e perguntas operam dentro da sessão")

        go(page,"#cliente=c1&tab=sessoes&program=p1&session=s1&moment=depois")
        assert page.locator(".rt-v914-stage-nav a[aria-current='step']").inner_text().find("Depois")>=0
        assert page.locator('[data-act="new-session-action"][data-id="s1"]').count()==1
        page.locator('[data-act="new-session-action"][data-id="s1"]').click()
        page.locator('#modal [name="title"]').fill("Acordo V914 — exercitar pergunta de abertura")
        page.locator('#modal [name="visibility"]').select_option("compartilhado")
        page.locator("#modal-save").click()
        assert page.evaluate("RTDemoStore.load().actions.filter(x=>x.title==='Acordo V914 — exercitar pergunta de abertura'&&x.sessionId==='s1').length")==1
        assert "moment=depois" in page.url,"Salvar acordo não deve devolver o profissional à preparação"
        milestones.append("05: acordo único vinculado à sessão, com etapa preservada")

        page.locator('[data-act="close-session"][data-id="s1"]').click()
        page.locator('#modal [name="summary"]').fill("V914 SÍNTESE PRIVADA NUNCA PUBLICAR")
        page.locator("#modal-save").click()
        assert page.evaluate("RTDemoStore.load().sessions.find(x=>x.id==='s1').status")=="concluida"
        page.locator('[data-act="edit-session-recap"][data-id="s1"]').click()
        page.locator('#modal [name="clientRecap"]').fill("Resumo aprovado V914 para Minha Jornada")
        page.locator('#modal [name="recapVisibility"]').select_option("compartilhado")
        page.locator("#modal-save").click()
        cv=page.evaluate("RTDemoStore.clientView(RTDemoStore.load(),'c1')")
        row=next(x for x in cv["sessions"] if x["id"]=="s1")
        assert row.get("clientRecap")=="Resumo aprovado V914 para Minha Jornada"
        for k in ["preparation","summary","liveNotes","liveNotesUpdatedAt","coachingQuestionIds","timerPlan"]:
            assert k not in row,"Private field leaked: "+k
        assert not any(x["id"]=="s1" for x in page.evaluate("RTDemoStore.clientView(RTDemoStore.load(),'c2').sessions"))
        milestones.append("06: conclusão / recap compartilhável / notas privadas")

        # Explicit selection of completed session defaults to the after stage.
        go(page,"#cliente=c1&tab=sessoes&program=p1&session=s1")
        assert page.locator('.rt-v914-stage-nav a[aria-current="step"]').inner_text().find("Depois")>=0
        assert page.locator('[data-act="edit-session-recap"][data-id="s1"]').count()==1
        milestones.append("07: reabertura de sessão concluída recupera a etapa Depois")

        # E2E desde cadastro do cliente até a preparação do primeiro atendimento.
        go(page,"#clientes")
        page.locator('[data-act="new-client"]').first.click()
        page.locator('#modal [name="name"]').fill("Cliente E2E Jornada V914")
        page.locator("#modal-save").click()
        new_client=page.evaluate("RTDemoStore.load().clients.find(c=>c.name==='Cliente E2E Jornada V914').id")
        assert new_client in page.url
        page.get_by_role("button",name="+ Criar processo").click()
        page.locator('#modal [name="goal"]').fill("Aprimorar comunicação demonstrativa")
        page.locator("#modal-save").click()
        new_process=page.evaluate("(id)=>RTDemoStore.load().programs.find(p=>p.clientId===id).id",new_client)
        page.get_by_role("button",name="Agendar sessão").first.click()
        page.locator('#modal [name="date"]').fill("2099-05-14")
        page.locator('#modal [name="clientTopic"]').fill("Encontro criado no fluxo E2E")
        page.locator("#modal-save").click()
        new_session=page.evaluate("(id)=>RTDemoStore.load().sessions.find(s=>s.programId===id).id",new_process)
        assert "session="+new_session in page.url and "moment=antes" in page.url
        assert page.locator("#rt-v911-prep-form").is_visible()
        go(page,"#cliente="+new_client+"&tab=sessoes&program="+new_process+"&session="+new_session+"&moment=durante")
        assert page.get_by_role("link",name="Continuar para Depois").count()==1
        milestones.append("08A: cadastro, processo e sessão direto na preparação")

        # Encontros ultrapassados devem aparecer em Sem confirmação, nunca em Próximos.
        page.evaluate("""(sid)=>{
            const d=RTDemoStore.load(),s=d.sessions.find(x=>x.id===sid);
            d.sessions.push({...s,id:'qa-v914-overdue',date:'2020-01-10',time:'09:00',clientTopic:'V914 QA horário ultrapassado'});
            RTDemoStore.save(d); db=RTDemoStore.load(); render();
        }""",new_session)
        go(page,"#sessoes?filter=sem-confirmacao")
        overdue_text=page.locator(".rt-v914-agenda-list").inner_text()
        assert "V914 QA horário ultrapassado" in overdue_text
        assert "Encontro criado no fluxo E2E" not in overdue_text
        assert page.locator('.rt-v914-agenda-summary a[aria-current="page"]').count()==1
        go(page,"#sessoes?filter=proximos")
        upcoming_text=page.locator(".rt-v914-agenda-list").inner_text()
        assert "Encontro criado no fluxo E2E" in upcoming_text
        assert "V914 QA horário ultrapassado" not in upcoming_text
        milestones.append("08B: categorias de agenda sem confundir passado e futuro")

        for width in [1440,900,390]:
            page.set_viewport_size({"width":width,"height":860})
            for stage in ["antes","durante","depois"]:
                go(page,"#cliente=c1&tab=sessoes&program=p1&session=s1&moment="+stage)
                assert page.locator('[data-rt-v914-workspace]').is_visible()
                spill=page.evaluate("Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth")
                assert spill<=5,f"Transbordamento horizontal {spill}px em {width}px etapa {stage}"
                page.screenshot(path=str(OUTPUT/f"v914-{stage}-{width}.png"),full_page=True)
        milestones.append("08: desktop, tablet e celular sem transbordamento horizontal")
        assert not errors,"Page errors: "+repr(errors)
        milestones.append("09: zero erros JavaScript")
        page.close();browser.close()
    server.shutdown()
    for m in milestones:print("OK:",m,flush=True)
    print("V9.14 E2E APROVADO — 11 verificações de fluxo.",flush=True)

if __name__=="__main__":
    try:main()
    except Exception as e:
        print("V9.14 E2E FALHA:",repr(e),flush=True)
        traceback.print_exc()
        raise
