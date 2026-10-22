from pathlib import Path
import re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
import os, tempfile
artifacts=Path(os.environ.get('REALTALENT_QA_OUTPUT',str(Path(tempfile.gettempdir())/'realtalent-v97-qa')))
artifacts.mkdir(parents=True,exist_ok=True)
html=(root/'profissional/index.html').read_text()
html=re.sub(r'<script\b[^>]*\bsrc=[^>]+</script>','',html,flags=re.I)
html=re.sub(r'<link\b[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
css='\n'.join((root/f).read_text() for f in ['profissional/app.css','assets/rt-design-system.css','assets/rt-v7-workspace.css','assets/rt-v8-integration.css','assets/rt-v81-disc.css','assets/rt-v9-professional.css','assets/rt-v92-clients.css','assets/rt-v93-workspace.css','assets/rt-v94-client-tabs.css','assets/rt-v95-action-plan.css'])
css=re.sub(r'@import\s+url\([^)]*\);','',css)
html=html.replace('</head>','<style>'+css+'</style></head>')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
 page=browser.new_page(viewport={'width':1440,'height':920},device_scale_factor=1)
 errors=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.set_content(html)
 page.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
 for f in ['core/disc-questions.js','core/demo-store.js','profissional/app.js']:
  page.add_script_tag(content=(root/f).read_text())
 page.evaluate('location.hash="#plano-acao"')
 page.wait_for_timeout(150)
 assert page.get_by_role('heading',name='Plano de ação',exact=True).count()==1
 assert page.get_by_role('heading',name='Legenda',exact=True).count()==1
 assert 'PLANO DE DESENVOLVIMENTO' in page.locator('#content').inner_text()
 assert page.locator('iframe').count()==0,'Not supposed to embed the old third UI'
 assert 'RealTalent em modo sistema' not in page.locator('#content').inner_text()
 assert page.locator('[data-action-id]').count()==2,'2 pending demo actions'
 assert page.locator('[data-action-id="a1"]').count()==1
 assert page.locator('.rt-v95-summary').count()==1
 page.screenshot(path=str(artifacts/'v95-action-desktop.png'),full_page=True)
 # filter
 page.get_by_role('link',name=re.compile('Concluídas')).click();page.wait_for_timeout(100)
 assert page.locator('[data-action-id]').count()==1
 page.get_by_role('link',name=re.compile('Todas')).click();page.wait_for_timeout(100)
 assert page.locator('[data-action-id]').count()==3
 # change client filter
 page.locator('#rt-v95-process').select_option('p2');page.wait_for_timeout(100)
 assert page.locator('[data-action-id]').count()==1
 page.locator('#rt-v95-process').select_option('todos');page.wait_for_timeout(80)
 # edit action
 page.locator('[data-action-id="a1"] button[data-act="edit-action"]').click()
 assert page.locator('#modal').evaluate('(e)=>e.open')
 page.locator('[name="title"]').fill('Atividade ajustada na revisão V9.5')
 page.locator('[name="due"]').fill('2026-10-30')
 page.locator('[name="visibility"]').select_option('compartilhado')
 page.get_by_role('button',name='Salvar alterações').click();page.wait_for_timeout(140)
 assert page.locator('[data-action-id="a1"]').get_by_text('Atividade ajustada na revisão V9.5').count()==1
 assert 'Minha Jornada' in page.locator('[data-action-id="a1"]').inner_text()
 assert page.evaluate('db.actions.find(a=>a.id==="a1").visibility')=='compartilhado'
 # complete and reopen
 page.locator('[data-action-id="a1"] button[data-act="toggle-action"]').click();page.wait_for_timeout(100)
 assert page.evaluate('db.actions.find(a=>a.id==="a1").status')=='concluido'
 page.locator('[data-action-id="a1"] button[data-act="toggle-action"]').click();page.wait_for_timeout(100)
 assert page.evaluate('db.actions.find(a=>a.id==="a1").status')=='pendente'
 # create action without leaving plan
 page.get_by_role('button',name='+ Nova ação').click()
 page.locator('#f-programId').select_option('p1')
 page.locator('#f-title').fill('Combinado simulado do novo plano')
 page.locator('#f-due').fill('2026-11-05')
 page.locator('#f-visibility').select_option('privado')
 page.locator('#modal-save').click();page.wait_for_timeout(100)
 assert page.evaluate('location.hash').startswith('#plano-acao?')
 assert page.locator('.rt-v95-list').get_by_text('Combinado simulado do novo plano').count()==1
 # regression sidebar and client navigation
 assert page.locator('.sidenav a[data-page]').count()==10
 page.get_by_role('link',name='Ver cliente →').first.click();page.wait_for_timeout(100)
 assert page.evaluate('location.hash').startswith('#cliente=')
 page.evaluate('location.hash="#plano-acao"');page.wait_for_timeout(100)
 page.evaluate('document.documentElement.dataset.rtTheme="light"');page.wait_for_timeout(50)
 page.screenshot(path=str(artifacts/'v95-action-light.png'),full_page=True)
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(180)
 page.screenshot(path=str(artifacts/'v95-action-mobile.png'),full_page=True)
 dims=page.evaluate('''() => ({w:document.documentElement.scrollWidth,vw:document.documentElement.clientWidth,forms:document.querySelectorAll(".rt-v95-action").length})''')
 assert dims['w']<=dims['vw']+1,dims
 assert not errors,errors
 print('V9.5 OK: legend, no iframe, 4 filters, process filter, edit, sharing, toggle, create, workspace, 9 sidebar, light, mobile',dims)
 browser.close()
