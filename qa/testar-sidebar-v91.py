from pathlib import Path
from playwright.sync_api import sync_playwright
import re
root=Path(__file__).resolve().parents[1]
import os, tempfile
artifacts=Path(os.environ.get('REALTALENT_QA_OUTPUT',str(Path(tempfile.gettempdir())/'realtalent-v97-qa')))
artifacts.mkdir(parents=True,exist_ok=True)
html=(root/'profissional/index.html').read_text()
html=re.sub(r'<script\b[^>]*\bsrc=[^>]+</script>','',html,flags=re.I)
html=re.sub(r'<link\b[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
css='\n'.join((root/f).read_text() for f in ['profissional/app.css','assets/rt-design-system.css','assets/rt-v7-workspace.css','assets/rt-v8-integration.css','assets/rt-v81-disc.css','assets/rt-v9-professional.css'])
css=re.sub(r'@import\s+url\([^)]*\);','',css)
html=html.replace('</head>','<style>'+css+'</style></head>')
expected=[('inicio','Visão geral'),('clientes','Clientes'),('processos','Processo de desenvolvimento'),('atividades-guiadas','Atividades guiadas'),('graficos-relatorios','Gráficos e relatórios'),('sessoes','Sessões'),('plano-desenvolvimento','Plano de desenvolvimento'),('plano-acao','Plano de ação'),('ferramentas','Ferramentas'),('biblioteca','Biblioteca')]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
    page=browser.new_page(viewport={'width':1440,'height':900});errs=[]
    page.on('pageerror',lambda e:errs.append(str(e)))
    page.set_content(html)
    page.evaluate("""() => {const m=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})}""")
    for f in ['core/disc-questions.js','core/demo-store.js','profissional/app.js']:
        page.add_script_tag(content=(root/f).read_text())
    labels=page.locator('.sidebar nav.sidenav [data-page]')
    assert labels.count()==10,labels.count()
    assert [x.strip() for x in page.locator('.sidebar nav.sidenav [data-page] span:last-child').all_text_contents()]==[x[1] for x in expected]
    for k,label in expected:
        page.locator(f'.sidenav a[data-page="{k}"]').click()
        page.wait_for_timeout(160)
        assert page.evaluate('location.hash')=='#'+k,(k,page.evaluate('location.hash'))
        assert page.locator('#crumb').inner_text()==label,(k,page.locator('#crumb').inner_text())
        assert page.locator(f'.sidenav a[data-page="{k}"][aria-current="page"]').count()==1
        assert page.locator('#content').inner_text().strip()
        print('OK',k,label)
    page.evaluate('location.hash="#atividades-guiadas"')
    page.wait_for_timeout(60)
    page.get_by_role('button',name='+ Nova atividade').click()
    assert page.locator('#modal').evaluate('(e)=>e.open')
    page.locator('#modal-cancel').click()
    page.evaluate('location.hash="#processos"');page.wait_for_timeout(40)
    assert page.get_by_text('Processos registrados').count()==1
    page.evaluate('location.hash="#plano-desenvolvimento"');page.wait_for_timeout(40)
    assert page.get_by_text('Ações pendentes').count()==1
    page.evaluate('location.hash="#graficos-relatorios"');page.wait_for_timeout(40)
    assert page.get_by_text('Selecione um resultado').count()==1
    page.evaluate('location.hash="#sessoes"');page.wait_for_timeout(40)
    assert page.get_by_role('button',name='+ Agendar sessão').count()==1
    for alias,target in [('agenda','sessoes'),('relatorios','graficos-relatorios'),('mapeamento','ferramentas'),('planos','plano-desenvolvimento'),('plano-disc','plano-acao')]:
        page.evaluate(f'location.hash="#{alias}"');page.wait_for_timeout(60)
        assert page.evaluate('location.hash')=='#'+target,alias
    page.evaluate('location.hash="#inicio"');page.wait_for_timeout(60)
    page.screenshot(path=str(artifacts/'v91-sidebar-desktop.png'),full_page=True)
    page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(90)
    assert page.locator('.hamburger').is_visible()
    page.locator('.hamburger').click()
    assert 'open' in page.locator('#side').get_attribute('class')
    page.locator('.sidenav [data-page="atividades-guiadas"]').click()
    page.wait_for_timeout(100)
    assert page.evaluate('location.hash')=='#atividades-guiadas'
    assert 'open' not in page.locator('#side').get_attribute('class')
    page.locator('.hamburger').click()
    page.wait_for_timeout(350)
    page.screenshot(path=str(artifacts/'v91-sidebar-mobile.png'),full_page=True)
    # The nav never gets clipped inside its scroll container
    metrics=page.locator('#side').evaluate('(e)=>({scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,overflow:getComputedStyle(e).overflowY})')
    print('Mobile sidebar scroll',metrics)
    print('Page errors',errs)
    assert not errs,errs
    browser.close()
