"""RealTalent V9.13 — homologação E2E de atendimento demonstrativo com Playwright.

Executar na raiz: python3 qa/testar-fluxo-atendimento-v913.py
Usa HTTP estático local e dados sintéticos; NÃO acessar prontuários/contas reais.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
import os, threading, tempfile, traceback, json

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=Path(os.environ.get("REALTALENT_QA_OUTPUT",str(Path(tempfile.gettempdir())/"rt-v913-e2e")))
OUTPUT.mkdir(parents=True,exist_ok=True)
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

def serve():
    server=ThreadingHTTPServer(("127.0.0.1",0),partial(QuietHandler,directory=str(ROOT)))
    th=threading.Thread(target=server.serve_forever,daemon=True);th.start()
    return server, "http://127.0.0.1:%d"%server.server_port

def go(page,hashroute):
    page.evaluate("(v)=>{location.hash=v}",hashroute)
    page.wait_for_timeout(125)

def result(page,statement):
    return page.evaluate("()=>{return "+statement+"}")

def main():
    server,origin=serve()
    errors=[]
    steps=[]
    with sync_playwright() as playwright:
        b=playwright.chromium.launch(headless=True,args=["--no-sandbox","--disable-gpu"])
        page=b.new_page(viewport={"width":1440,"height":920},device_scale_factor=1)
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.goto(origin+"/profissional/index.html",wait_until="domcontentloaded")
        page.wait_for_function("typeof window.RTDemoStore==='object' && typeof window.RTSessionAssist==='object' && typeof window.RTProfessionalKit==='object'")
        assert result(page,"RTDemoStore.VERSION") == 11
        go(page,"#cliente=c1&tab=sessoes&program=p1&session=s1")
        is_v914=page.locator('[data-rt-v914-workspace]').count()>0
        if is_v914:
            assert page.locator('.rt-v914-stage-nav a').count()==3
            assert page.locator('#rt-v911-prep-form').count()==1
        else:
            assert page.locator('a[href*="tab=kit&session=s1"]').count()>0
            assert page.locator('a[href*="tab=perguntas&session=s1"]').count()>0
            assert page.locator('a[href*="tab=temporizador&session=s1"]').count()>0
        steps.append("01: cliente/sessão e acesso às ferramentas OK")

        # Preparação GROW — preenchida na sessão existente, nunca no portal.
        # Desde V11.6 o Kit fica exclusivamente dentro da sessão do cliente.
        if is_v914:go(page,"#cliente=c1&tab=sessoes&program=p1&session=s1&moment=antes")
        else:page.locator('a[href*="tab=kit&session=s1"]').first.click()
        form=page.locator("#rt-v911-prep-form")
        try:
            form.wait_for(state="visible",timeout=7000)
        except Exception:
            print('DEBUG GROW route:',page.url,flush=True)
            print('DEBUG page heading:',page.locator('#content').inner_text()[:1000],flush=True)
            print('DEBUG errors:',errors,flush=True)
            page.screenshot(path=str(OUTPUT/'v913-debug-grow.png'),full_page=True)
            raise
        form.locator('[name="goal"]').fill("OBJETIVO INTERNO QA: conversa de feedback")
        form.locator('[name="reality"]').fill("REALIDADE INTERNA QA: fatos da simulação")
        form.locator('[name="options"]').fill("OPÇÕES INTERNAS QA")
        form.locator('[name="wayForward"]').fill("PRÓXIMOS PASSOS INTERNOS QA")
        form.locator('button[type="submit"]').click()
        assert result(page,"RTDemoStore.load().sessions.find(s=>s.id==='s1').preparation.goal")=="OBJETIVO INTERNO QA: conversa de feedback"
        page.reload(wait_until="domcontentloaded")
        assert page.locator('#rt-v911-prep-form [name="goal"]').input_value()=="OBJETIVO INTERNO QA: conversa de feedback"
        steps.append("02: GROW preenchido, salvo e persistente após recarga")

        # Banco de perguntas: seleção, busca, filtro e vinculação à sessão.
        go(page,"#ferramentas?tab=perguntas&session=s1")
        assert page.get_by_role("heading",name="Banco de Perguntas de Coaching").count()>0
        page.locator('[data-act="rt-v913-toggle-question"][data-id="cq-01"]').first.click()
        assert "cq-01" in result(page,"RTDemoStore.load().sessions.find(s=>s.id==='s1').coachingQuestionIds")
        page.locator('a[href*="phase=realidade"]').first.click()
        page.wait_for_function("location.hash.includes('phase=realidade') && Boolean(document.querySelector('#rt-v913-question-search'))")
        page.wait_for_timeout(120)  # Aguarda render da rota antes de preencher o campo
        page.locator("#rt-v913-question-search").fill("fatos")
        assert page.locator('[data-v913-question]:visible').count()>=1
        page.locator("#rt-v913-question-search").fill("sem-resultado-qa")
        page.wait_for_function("""() => [...document.querySelectorAll("[data-v913-question]")].length > 0 && [...document.querySelectorAll("[data-v913-question]")].every(el => el.hidden && getComputedStyle(el).display === "none")""")
        assert page.locator('[data-v913-question]:visible').count()==0
        page.locator("#rt-v913-question-search").fill("")
        page.locator('[data-act="rt-v913-toggle-question"][data-id="cq-11"]').first.click()
        ids=result(page,"RTDemoStore.load().sessions.find(s=>s.id==='s1').coachingQuestionIds")
        assert ids==["cq-01","cq-11"]
        assert not result(page,"Object.hasOwn(RTDemoStore.clientView(RTDemoStore.load(),'c1').sessions.find(s=>s.id==='s1'),'coachingQuestionIds')")
        steps.append("03: banco pesquisável, filtros e roteiro privado por sessão")

        # Temporizador: configuração, start, pause, avançar; não duplica sessão.
        go(page,"#ferramentas?tab=temporizador&session=s1")
        assert page.locator("#rt-v913-clock").is_visible()
        tf=page.locator("#rt-v913-timer-form")
        tf.locator('[name="label-abertura"]').fill("Acolhimento")
        tf.locator('[name="minutes-abertura"]').fill("2")
        tf.locator('button[type="submit"]').click()
        assert result(page,"RTDemoStore.load().sessions.find(s=>s.id==='s1').timerPlan[0].minutes")==2
        assert page.locator("#rt-v913-clock").inner_text()=="02:00"
        page.locator('[data-act="rt-v913-timer"][data-id="start"]').click()
        assert result(page,"RTSessionAssist.snapshot(RTDemoStore.load().sessions.find(s=>s.id==='s1')).running")
        page.wait_for_timeout(1100)
        page.locator('[data-act="rt-v913-timer"][data-id="pause"]').click()
        paused=result(page,"RTSessionAssist.snapshot(RTDemoStore.load().sessions.find(s=>s.id==='s1')).remainingMs")
        assert 0 < paused < 120000
        page.locator('[data-act="rt-v913-timer"][data-id="next"]').click()
        assert result(page,"RTSessionAssist.snapshot(RTDemoStore.load().sessions.find(s=>s.id==='s1')).index")==1
        assert not result(page,"RTSessionAssist.snapshot(RTDemoStore.load().sessions.find(s=>s.id==='s1')).running")
        assert len(result(page,"RTDemoStore.load().sessions.filter(s=>s.id==='s1')"))==1
        steps.append("04: temporizador real, configuração, pausa e avanço manual")

        # Acordo: realmente pertence à sessão, objetivo e processo corretos.
        go(page,"#cliente=c1&tab=sessoes&program=p1&session=s1")
        page.locator('[data-act="new-session-action"][data-id="s1"]').click()
        page.locator('#modal [name="title"]').fill("AÇÃO QA: ensaiar perguntas abertas")
        page.locator('#modal [name="visibility"]').select_option("compartilhado")
        page.locator("#modal-save").click()
        action=result(page,"RTDemoStore.load().actions.find(a=>a.title==='AÇÃO QA: ensaiar perguntas abertas')")
        assert action and action["sessionId"]=="s1" and action["programId"]=="p1" and action["goalId"]=="goal-p1"
        assert result(page,"RTDemoStore.load().actions.filter(a=>a.title==='AÇÃO QA: ensaiar perguntas abertas').length")==1
        steps.append("05: compromisso no Plano de Ação sem duplicação")

        # Concluir sessão e compartilhar apenas recap autorizado.
        page.locator('[data-act="close-session"][data-id="s1"]').click()
        page.locator('#modal [name="summary"]').fill("SÍNTESE INTERNA QA — NUNCA MOSTRAR")
        page.locator("#modal-save").click()
        assert result(page,"RTDemoStore.load().sessions.find(s=>s.id==='s1').status")=="concluida"
        page.locator('[data-act="edit-session-recap"][data-id="s1"]').click()
        page.locator('#modal [name="clientRecap"]').fill("Resumo compartilhável fictício: praticar pergunta aberta.")
        page.locator('#modal [name="recapVisibility"]').select_option("compartilhado")
        page.locator("#modal-save").click()
        client=result(page,"RTDemoStore.clientView(RTDemoStore.load(),'c1')")
        session=next(x for x in client["sessions"] if x["id"]=="s1")
        assert session.get("clientRecap")=="Resumo compartilhável fictício: praticar pergunta aberta."
        for key in ["summary","preparation","coachingQuestionIds","timerPlan","timerPlanUpdatedAt"]:
            assert key not in session, "Vazamento interno: "+key
        assert not any(x["id"]=="s1" for x in result(page,"RTDemoStore.clientView(RTDemoStore.load(),'c2').sessions"))
        steps.append("06: sessão encerrada; resumo autorizado; informações internas isoladas")

        # O portal do participante não mostra conteúdo interno.
        raw=page.evaluate("RTDemoStore.load()")
        page2=b.new_page(viewport={"width":1440,"height":920})
        page2.on("pageerror",lambda e:errors.append(str(e)))
        page2.add_init_script("localStorage.setItem('rt-disc-v5-demo-20261020',"+json.dumps(json.dumps(raw,ensure_ascii=False))+")")
        page2.goto(origin+"/cliente/index.html",wait_until="domcontentloaded")
        go(page2,"#encontros")
        portal=page2.locator("#app").inner_text()
        assert "Resumo compartilhável fictício" in portal
        for secret in ["SÍNTESE INTERNA QA","OBJETIVO INTERNO QA","REALIDADE INTERNA QA","OPÇÕES INTERNAS QA"]:
            assert secret not in portal, "Dado interno exposto no portal: "+secret
        steps.append("07: Minha Jornada exibe somente informações liberadas")

        # Continuidade: próximo encontro vê compromisso pendente, sem criá-lo novamente.
        page.evaluate("""()=>{const d=RTDemoStore.load();d.sessions.push({
          id:'qa-next',programId:'p1',date:'2027-04-10',time:'11:00',
          focus:'Pauta interna QA próximo encontro',clientTopic:'Encontro futuro',
          status:'agendada',visibility:'compartilhado',summary:''
        });RTDemoStore.save(d);db=RTDemoStore.load();render();}""")
        go(page,"#cliente=c1&tab=sessoes&program=p1&session=qa-next")
        assert "AÇÃO QA: ensaiar perguntas abertas" in page.locator("#content").inner_text()
        assert result(page,"RTDemoStore.load().actions.filter(a=>a.title==='AÇÃO QA: ensaiar perguntas abertas').length")==1
        steps.append("08: acompanhamento retomado no encontro seguinte sem ação duplicada")

        # Desktop e mobile: interface responsiva em todas as novas abas.
        for width in [1440,390]:
            page.set_viewport_size({"width":width,"height":844})
            for tab in ["kit","perguntas","temporizador"]:
                go(page,("#cliente=c1&tab=sessoes&program=p1&session=s1&moment=antes" if tab=="kit" else "#ferramentas?tab="+tab+"&session=s1"))
                assert page.locator("#content").is_visible()
                overflow=page.evaluate("Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth")
                assert overflow<=5, f"Overflow horizontal {overflow}px na aba {tab}, viewport {width}px"
                page.screenshot(path=str(OUTPUT/f"v913-{tab}-{width}.png"),full_page=True)
        steps.append("09: renderização 1440px/390px, sem overflow horizontal")
        assert not errors,"Erros JS no navegador: "+repr(errors)
        steps.append("10: zero erros JavaScript de página")

        page2.close();page.close();b.close()
    server.shutdown()
    for step in steps:print("OK:",step,flush=True)
    print("HOMOLOGAÇÃO E2E V9.13: 10/10 etapas aprovadas",flush=True)

if __name__=="__main__":
    try:main()
    except Exception as e:
        print("FALHA NA HOMOLOGAÇÃO E2E:",repr(e),flush=True)
        traceback.print_exc()
        raise
