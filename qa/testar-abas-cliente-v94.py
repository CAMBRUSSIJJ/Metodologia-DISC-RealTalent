#!/usr/bin/env python3
"""Validação visual funcional local da V9.4, apenas dados fictícios."""
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
css='\n'.join((root/f).read_text() for f in ['profissional/app.css','assets/rt-design-system.css','assets/rt-v7-workspace.css','assets/rt-v8-integration.css','assets/rt-v81-disc.css','assets/rt-v9-professional.css','assets/rt-v92-clients.css','assets/rt-v93-workspace.css','assets/rt-v94-client-tabs.css'])
css=re.sub(r'@import\s+url\([^)]*\);','',css)
html=html.replace('</head>','<style>'+css+'</style></head>')
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':920})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded')
 page.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})}''')
 for f in ['core/disc-questions.js','core/demo-store.js','profissional/app.js']:
  page.add_script_tag(content=(root/f).read_text())
 def go(tab,view=None,session=None):
  page.evaluate('''({tab,view,session})=>{location.hash=wsUrl('c1',tab,'p1',view?'view='+view:session?'session='+session:'');render();}''',{'tab':tab,'view':view,'session':session})
 def contains(part):return part in page.locator('#content').inner_text()
 def check(ok,msg):
  if not ok:raise AssertionError(msg+'; '+str(errors))
 check(page.locator('.sidenav a[data-page]').count()==10,'sidebar preserved')
 for tab,title in [('sessoes','Sessões'),('atividades','Atividades'),('resultados','Resultados'),('desenvolvimento','Desenvolvimento'),('documentos','Documentos')]:
  go(tab)
  check(page.locator('.rt-v94-tab-head h2').inner_text()==title,tab+' title')
  check(page.locator('.rt-v94-stat').count()==3,tab+' stats')
  check(page.locator('.rt-v94-layout').count()==1,tab+' layout')
  check(page.locator('.rt-v9-workspace-tabs a').count()==6,tab+' internal tabs')
  check(page.locator('#content .rt-v94-panel').count()>=2,tab+' panels')
  page.screenshot(path=str(artifacts/('v94-'+tab+'.png')),full_page=True)
  print('ABA OK',tab)
 go('sessoes')
 check(contains('Encontros agendados'),'sessions list')
 go('sessoes','historico');check(contains('Histórico de encontros'),'sessions history filter')
 go('sessoes',session='s1');check(contains('Pauta interna'),'session internal detail')
 go('atividades')
 page.get_by_role('button',name='+ Atribuir DISC').first.click()
 check(page.locator('#modal').evaluate('(x)=>x.open'),'disc action modal')
 page.locator('#modal-cancel').click()
 go('atividades','respondidas');check(contains('Exercícios e reflexões'),'activities filter')
 go('resultados');check(contains('Resultados do DISC/ACER'),'results content')
 go('desenvolvimento')
 check(contains('Ações combinadas'),'plan actions')
 page.get_by_role('button',name='Concluir').first.click()
 check(page.evaluate("db.actions.find(a=>a.id==='a1').status")=='concluido','action toggled')
 go('desenvolvimento','concluidas');check(contains('Praticar uma pergunta aberta'),'completed filter')
 go('documentos');check(contains('Devolutivas e registros'),'documents content')
 go('documentos','restritos');check(contains('Devolutivas e registros'),'documents filter')
 # A missed appointment is not presented as upcoming.
 page.evaluate('''() => {db.sessions.push({id:'past94',programId:'p1',date:today(),time:'00:00',focus:'Pauta interna fictícia',clientTopic:'Encontro sem confirmação',status:'agendada',visibility:'privado'});render();}''')
 go('sessoes');check(contains('Encontro aguardando confirmação'),'elapsed session priority')
 go('sessoes',session='past94');check(contains('Sem confirmação'),'elapsed session detail')
 # Review private by default.
 page.evaluate('''() => {db.discAssignments.push({id:'disc94',programId:'p1',status:'respondido',visibility:'compartilhado',scores:{D:9,I:11,S:13,C:7},completedAt:new Date().toISOString(),feedback:'',feedbackVisibility:'privado'});render()}''')
 go('resultados');check(contains('resultado(s) aguardando análise'),'disc review')
 check(contains('Restrita ao profissional'),'disc feedback private')
 go('documentos');check(not contains('disc94'),'documents no phantom')
 # Responsive and theme
 for tab in ['sessoes','atividades','resultados','desenvolvimento','documentos']:
  go(tab)
  page.set_viewport_size({'width':390,'height':844})
  over=page.evaluate('document.documentElement.scrollWidth-window.innerWidth')
  check(over<=6,tab+' mobile horizontal overflow '+str(over))
  if tab in ('sessoes','resultados'):
   page.screenshot(path=str(artifacts/('v94-'+tab+'-mobile.png')),full_page=True)
  page.set_viewport_size({'width':1440,'height':920})
 page.evaluate("document.documentElement.setAttribute('data-rt-theme','light')")
 go('atividades');page.screenshot(path=str(artifacts/'v94-atividades-light.png'),full_page=True)
 check(not errors,'JavaScript errors '+str(errors))
 print('V9.4 OK — 5 tabs, filters, modals, completion, privacy, expired sessions, responsive, themes. Errors:',errors)
 browser.close()
