"""QA de demonstração RealTalent V5, exige servidor HTTP local e playwright + chromium instalados."""
from playwright.sync_api import sync_playwright
from urllib.parse import urljoin
import sys, json
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:18988/'
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    ctx=b.new_context(viewport={'width':1360,'height':900},accept_downloads=True)
    page=ctx.new_page();page.set_default_timeout(6500);errs=[]
    page.on('pageerror',lambda err: errs.append(str(err)))
    page.goto(urljoin(BASE,'acesso.html')); assert page.get_by_role('heading',name='RealTalent Professional').count()==1
    page.goto(urljoin(BASE,'profissional/index.html'))
    page.wait_for_selector('main #content .page-title');print('Professional home OK:',page.locator('.page-title').inner_text())
    page.on('dialog',lambda d:d.accept());page.locator('[data-act="reset"]').click()
    page.locator('[data-act="new-client"]').count() # home not necessarily new client
    page.goto(urljoin(BASE,'profissional/index.html#clientes'))
    page.locator('[data-act="new-client"]').click();page.locator('#f-name').fill('Cliente fictício QA');page.locator('#f-focus').fill('Praticar escuta ativa');page.locator('#modal-save').click()
    page.reload();assert page.get_by_text('Cliente fictício QA').count()>0,'client persistence failed'
    print('Client CRUD persists OK')
    page.goto(urljoin(BASE,'profissional/index.html#processos'))
    page.locator('[data-act="new-process"]').first.click();page.locator('#f-clientId').select_option(label='Cliente fictício QA');page.locator('#f-goal').fill('Conduzir reuniões com escuta ativa');page.locator('#modal-save').click()
    page.reload();assert page.get_by_text('Conduzir reuniões com escuta ativa').count()>0
    db=page.evaluate('RTDemoStore.load()'); c=next(c for c in db['clients'] if c['name']=='Cliente fictício QA'); newpid=next(x['id'] for x in db['programs'] if x['clientId']==c['id']);print('Process persistence OK',newpid)
    page.goto(urljoin(BASE,'profissional/index.html#processo='+newpid));page.locator('[data-act="new-action-for"]').first.click()
    page.locator('#f-title').fill('Escutar sem interromper durante reunião simulada');page.locator('#modal-save').click()
    page.goto(urljoin(BASE,'profissional/index.html#processo='+newpid));page.locator('[data-act="new-guidance"]').first.click();page.locator('#f-text').fill('Registre uma situação fictícia de escuta ativa.');page.locator('#modal-save').click()
    page.goto(urljoin(BASE,'cliente/index.html?demo='+c['id']+'#atividades'))
    assert page.get_by_text('Escutar sem interromper durante reunião simulada').count()>0
    page.locator('[data-act="toggle"]').first.click()
    assert page.get_by_text('Concluída').count()>0
    page.reload();assert page.get_by_text('Concluída').count()>0
    print('Cross-portal activity and completion OK')
    page.goto(urljoin(BASE,'cliente/index.html?demo='+c['id']+'#materiais'))
    assert page.get_by_text('Registre uma situação fictícia de escuta ativa.').count()>0
    print('Shared guidance OK')
    page.goto(urljoin(BASE,'cliente/index.html?demo='+c['id']+'#reflexoes'))
    page.locator('[data-act="new-reflection"]').click();page.locator('[name="title"]').fill('Reflexão só minha');page.locator('[name="text"]').fill('Conteúdo privado fictício QA');page.locator('#reflection-form button[type="submit"]').click()
    page.goto(urljoin(BASE,'profissional/index.html#cliente='+c['id']))
    assert page.get_by_text('Conteúdo privado fictício QA').count()==0,'private reflection leaked into professional UI'
    page.goto(urljoin(BASE,'cliente/index.html?demo='+c['id']+'#reflexoes'))
    page.locator('[data-act="visibility"]').first.click()
    page.goto(urljoin(BASE,'profissional/index.html#cliente='+c['id']))
    assert page.get_by_text('Conteúdo privado fictício QA').count()==1, 'shared reflection unavailable to professional'
    print('Reflection privacy filter and opt-in sharing OK')
    # internal session summary never in client view even after adding professional summary
    page.goto(urljoin(BASE,'cliente/index.html?demo=c2#encontros'))
    assert page.get_by_text('Exemplo fictício de encerramento').count()==0
    print('Professional-only summary is absent from participant view')
    page.goto(urljoin(BASE,'profissional/index.html#configuracoes'))
    page.locator('[data-act="set-role"][data-id="consultor"]').click();page.reload()
    assert page.locator('[data-act="set-role"][data-id="consultor"]').get_attribute('class').find('selected')>=0
    print('Professional role preference persists OK')
    # mobile smoke
    page.set_viewport_size({'width':390,'height':844});page.goto(urljoin(BASE,'cliente/index.html?demo=c1#jornada'))
    assert page.locator('#toggle').is_visible()
    page.locator('#toggle').click();assert 'open' in page.locator('#side').get_attribute('class')
    page.screenshot(path='/mnt/data/rt-v5-cliente-mobile.png',full_page=True)
    page.set_viewport_size({'width':1440,'height':900});page.screenshot(path='/mnt/data/rt-v5-cliente-desktop.png',full_page=True)
    assert not errs, 'JS errors: '+str(errs)
    print('QA E2E completo: sem pageerrors.')
    b.close()
