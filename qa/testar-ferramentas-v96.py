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
css='\n'.join((root/f).read_text() for f in ['profissional/app.css','assets/rt-design-system.css','assets/rt-v7-workspace.css','assets/rt-v8-integration.css','assets/rt-v81-disc.css','assets/rt-v9-professional.css','assets/rt-v92-clients.css','assets/rt-v93-workspace.css','assets/rt-v94-client-tabs.css','assets/rt-v95-action-plan.css','assets/rt-v96-tools.css'])
css=re.sub(r'@import\s+url\([^)]*\);','',css)
html=html.replace('</head>','<style>'+css+'</style></head>')
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
 page=browser.new_page(viewport={'width':1440,'height':950});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html)
 page.evaluate("""() => {const m=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}""")
 for file in ['core/disc-questions.js','core/demo-store.js','profissional/app.js']:
  page.add_script_tag(content=(root/file).read_text())
 assert page.locator('.sidenav a[data-page]').count()==10
 page.locator('.sidenav a[data-page="ferramentas"]').click()
 page.wait_for_timeout(130)
 assert page.evaluate('location.hash')=='#ferramentas'
 assert page.locator('#content').get_by_role('heading',name='Ferramentas').count()==1
 assert page.locator('#content').get_by_role('heading',name='DISC / ACER').count()==1
 assert page.locator('#content iframe').count()==0,'Ferramentas must not embed original interface'
 assert page.locator('#content').get_by_role('heading',name='Communication Lab').count()==1
 page.screenshot(path=str(artifacts/'v96-ferramentas-desktop.png'),full_page=True)
 page.get_by_role('link',name='Aplicar',exact=True).click()
 page.wait_for_timeout(100)
 assert page.locator('form#rt-v96-assign-disc').count()==1
 page.locator('#rt-v96-program').select_option('p2')
 page.locator('#rt-v96-visibility').select_option('privado')
 page.locator('#rt-v96-assign-disc button[type="submit"]').click()
 assert page.evaluate('location.hash')=='#ferramentas?tab=aplicacoes'
 assert page.evaluate('db.discAssignments.length')==2
 taskid=page.evaluate('db.discAssignments.find(x=>x.programId==="p2").id')
 assert page.evaluate('db.discAssignments.find(x=>x.programId==="p2").visibility')=='privado'
 assert page.locator('#content').get_by_text('Rascunho interno').count()>=1
 # cannot create 2 outstanding assignments in same process
 page.get_by_role('link',name='+ Nova aplicação').click()
 page.wait_for_timeout(100)
 page.locator('#rt-v96-program').select_option('p2')
 page.locator('#rt-v96-assign-disc button[type="submit"]').click()
 assert 'Já existe uma aplicação ativa' in page.locator('[role="alert"]').inner_text()
 assert page.evaluate('db.discAssignments.length')==2
 # Share through existing action and verify clientView projection contract
 page.evaluate('location.hash="#ferramentas?tab=aplicacoes"');page.wait_for_timeout(60)
 page.locator('.rt-v96-entry').filter(has_text='Cliente demonstrativo 02').locator('button[data-act="toggle-disc"]').click()
 assert page.evaluate('db.discAssignments.find(x=>x.programId==="p2").visibility')=='compartilhado'
 assert page.evaluate('RTDemoStore.clientView(db,"c2").discAssignments.some(x=>x.programId==="p2")')
 # Simulate the participant answering the same original questions, without an extra result copy
 valid=page.evaluate('''() => {const x=db.discAssignments.find(x=>x.programId==='p2');const ok=RTDemoStore.submitDisc(db,'c2',x.id,RTDiscQuestions.QUESTIONS.map(q=>q.options[0][1]),[0,1,2],[3,4,5]);if(ok){RTDemoStore.save(db)}return ok}''')
 assert valid
 page.evaluate('location.hash="#ferramentas?tab=resultados"');page.wait_for_timeout(80)
 assert page.locator('.rt-v96-results .rt-v81-factor').count()==4
 assert page.locator('.rt-v96-results .rt-v81-radar').count()==1
 assert 'Cliente demonstrativo 02' in page.locator('.rt-v96-results').inner_text()
 assert page.locator('#content iframe').count()==0
 # Feedback remains private until shared explicitly
 page.get_by_role('button',name='Redigir devolutiva').click()
 page.locator('#f-feedback').fill('Devolutiva didática para resposta fictícia.')
 page.locator('#f-feedbackVisibility').select_option('privado')
 page.locator('#modal-save').click()
 assert page.evaluate('db.discAssignments.find(x=>x.programId==="p2").feedbackVisibility')=='privado'
 assert not page.evaluate('RTDemoStore.clientView(db,"c2").discAssignments.find(x=>x.programId==="p2").feedback')
 page.get_by_role('button',name='Compartilhar',exact=True).click()
 assert page.evaluate('RTDemoStore.clientView(db,"c2").discAssignments.find(x=>x.programId==="p2").feedback')=='Devolutiva didática para resposta fictícia.'
 assert 'scores' not in page.evaluate('RTDemoStore.clientView(db,"c2").discAssignments.find(x=>x.programId==="p2")')
 page.screenshot(path=str(artifacts/'v96-ferramentas-resultados.png'),full_page=True)
 # Prior sidebar routes still work and point to the same shared record
 page.evaluate('location.hash="#graficos-relatorios"');page.wait_for_timeout(80)
 assert page.locator('button[data-act="select-disc"]').count()>=1
 page.evaluate('location.hash="#biblioteca"');page.wait_for_timeout(80)
 assert page.locator('#crumb').inner_text()=='Biblioteca'
 page.evaluate('location.hash="#ferramentas?tab=visao"');page.wait_for_timeout(80)
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(120)
 page.screenshot(path=str(artifacts/'v96-ferramentas-mobile.png'),full_page=True)
 widths=page.evaluate('''() => ({html:document.documentElement.scrollWidth,view:document.documentElement.clientWidth})''')
 assert widths['html']<=widths['view']+1,widths
 assert not errors,errors
 print('V9.6 OK | sidebar 10 | tool overview | assign | duplicate guard | client sharing | results charts | feedback | existing modules | mobile',widths)
 browser.close()
