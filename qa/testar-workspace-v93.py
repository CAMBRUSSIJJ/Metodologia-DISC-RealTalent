#!/usr/bin/env python3
"""V9.3: testa hierarquia visual e fluxo de acompanhamento em navegador isolado.
Não usa dados reais e não depende de acesso externo à Vercel.
"""
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
css='\n'.join((root/f).read_text() for f in [
 'profissional/app.css','assets/rt-design-system.css','assets/rt-v7-workspace.css',
 'assets/rt-v8-integration.css','assets/rt-v81-disc.css',
 'assets/rt-v9-professional.css','assets/rt-v92-clients.css','assets/rt-v93-workspace.css','assets/rt-v94-client-tabs.css'])
css=re.sub(r'@import\s+url\([^)]*\);','',css)
html=html.replace('</head>','<style>'+css+'</style></head>')
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
 page=browser.new_page(viewport={'width':1440,'height':900})
 errors=[]
 page.on('pageerror',lambda err:errors.append(str(err)))
 page.set_content(html,wait_until='domcontentloaded')
 page.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})}''')
 for f in ['core/disc-questions.js','core/demo-store.js','profissional/app.js']:
  page.add_script_tag(content=(root/f).read_text())
 def go(route):
  page.evaluate('(r)=>location.hash=r',route)
  page.wait_for_timeout(65)
 def must(pred,tag):
  if not pred:raise AssertionError(tag)
 must(page.locator('.sidenav [data-page]').count()==10,'sidebar 10 abas')
 go('#cliente=c1&tab=geral&program=p1')
 must(page.locator('.rt-v93-profile-head').count()==1,'cabeçalho v93')
 must(page.locator('.rt-v93-priority').count()==1,'próxima ação única')
 must(page.locator('.rt-v93-summary-item').count()==4,'4 indicadores clicáveis')
 must(page.locator('.rt-v93-overview-layout').count()==1,'histórico+contexto')
 must(page.get_by_role('heading',name='Histórico do acompanhamento').count()==1,'histórico')
 must(page.get_by_role('heading',name='Objetivo do processo').count()==0,'rótulo leve ao invés de grande heading')
 must(page.locator('.rt-v9-workspace-tabs a').count()==6,'6 abas internas')
 must(page.locator('.rt-v9-overview-intro').count()==0,'removido cartão objetivo repetido')
 must(page.locator('.rt-v9-dashboard').count()==0,'removidos painéis duplicados')
 # Cabeçalho; menu de ações e navegação contextual.
 page.locator('.rt-v93-action-menu summary').click()
 must(page.locator('.rt-v93-action-menu[open]').count()==1,'menu ações secundárias')
 page.locator('.rt-v93-menu-options [data-act="edit-client"]').click()
 must(page.locator('#modal').evaluate('(d)=>d.open'),'editar abre modal')
 page.locator('#modal-cancel').click()
 # Links do resumo encaminham para a aba correta.
 page.locator('.rt-v93-summary-item').nth(3).click();page.wait_for_timeout(80)
 must('tab=atividades' in page.evaluate('location.hash'),'resumo navega para atividades')
 must(page.locator('.rt-v94-tab-head h2').inner_text()=='Atividades','padrão subabas')
 go('#cliente=c1&tab=geral&program=p1')
 # Uma sessão às 00:00 de hoje deve ser tratada como já ocorrida/pendente de confirmação.
 page.evaluate('''() => {db.discAssignments=[];db.instruments=[];db.actions=[];const d=today();db.sessions=db.sessions.filter(s=>s.programId!=='p1');db.sessions.push({id:'v93-past',programId:'p1',date:d,time:'00:00',status:'agendada',clientTopic:'Encontro demonstrativo vencido',focus:'',visibility:'privado'});render()}''')
 must('Confirmar situação do encontro' in page.locator('.rt-v93-priority').inner_text(),'horário vencido pede confirmação')
 must('horário já ultrapassado' in page.locator('.rt-v93-priority').inner_text(),'não apresenta vencido como futuro')
 must('Não agendada' in page.locator('.rt-v93-summary-item').nth(1).inner_text(),'sem sessão futura')
 must(page.locator('.rt-v92-timeline-list li').filter(has_text='Encontro sem confirmação').count()==1,'evento pendente no histórico')
 # Futuro não deve aparecer como acontecimento na timeline.
 page.evaluate("""() => {db.sessions=db.sessions.filter(s=>s.id!=='v93-past');db.sessions.push({id:'v93-future',programId:'p1',date:plus(5),time:'10:00',status:'agendada',clientTopic:'Encontro no futuro',focus:'',visibility:'privado'});render()}""")
 must('Preparar o próximo encontro' in page.locator('.rt-v93-priority').inner_text(),'futuro correto')
 must(page.locator('.rt-v92-timeline-list li').filter(has_text='Encontro no futuro').count()==0,'futuro não aparece como ocorrido')
 # Retorno de questionário tem prioridade sobre encontros.
 page.evaluate("""() => {db.discAssignments.push({id:'v93-disc',programId:'p1',status:'respondido',completedAt:new Date().toISOString(),assignedAt:new Date().toISOString(),feedback:'',visibility:'compartilhado'});render()}""")
 must('Revisar respostas do DISC/ACER' in page.locator('.rt-v93-priority').inner_text(),'disc priorizado')
 # Um cliente sem processo não vê painéis vazios.
 page.evaluate("""() => {db.clients.push({id:'v93-client',name:'Cliente fictício sem processo',status:'ativo',contact:'A definir',created:today()});location.hash=wsUrl('v93-client');render()}""")
 must(page.get_by_text('Nenhum processo vinculado').count()==1,'empty state')
 # Mobile: foco e sem overflow horizontal global.
 go('#cliente=c1&tab=geral&program=p1')
 page.set_viewport_size({'width':390,'height':844})
 page.wait_for_timeout(110)
 must(page.locator('.rt-v93-profile-head').is_visible(),'perfil responsivo')
 must(page.locator('.rt-v93-summary-item').count()==4,'resumo responsivo')
 overflow=page.evaluate('document.documentElement.scrollWidth - window.innerWidth')
 must(overflow<6,f'overflow horizontal {overflow}px')
 (artifacts/'v93-cliente-mobile.png').parent.mkdir(exist_ok=True)
 page.screenshot(path=str(artifacts/'v93-cliente-mobile.png'),full_page=True)
 # Desktop dark and light.
 page.set_viewport_size({'width':1440,'height':900})
 page.screenshot(path=str(artifacts/'v93-cliente-desktop.png'),full_page=True)
 page.evaluate("document.documentElement.setAttribute('data-rt-theme','light')")
 page.screenshot(path=str(artifacts/'v93-cliente-claro.png'),full_page=True)
 must(not errors,'JavaScript: '+str(errors))
 print('V9.3 OK: sidebar, 6 abas, navegação, prioridade, sessão vencida, DISC, histórico, empty state, mobile, temas. JS errors:',errors)
 browser.close()
