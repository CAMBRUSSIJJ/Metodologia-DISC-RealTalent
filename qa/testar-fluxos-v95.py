from playwright.sync_api import sync_playwright
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
html=(root/'profissional/index.html').read_text()
html=re.sub(r'<script\b[^>]*\bsrc=[^>]+</script>','',html,flags=re.I)
html=re.sub(r'<link\b[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
styles=[root/'profissional/app.css',root/'assets/rt-design-system.css',root/'assets/rt-v7-workspace.css',root/'assets/rt-v8-integration.css',root/'assets/rt-v81-disc.css',root/'assets/rt-v9-professional.css']
css=re.sub(r'@import\s+url\([^)]*\);','','\n'.join(p.read_text() for p in styles))
html=html.replace('</head>','<style>'+css+'</style></head>')
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
 p=browser.new_page();errors=[]
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.set_content(html)
 p.evaluate("""() => {const m=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})}""")
 for f in ['core/disc-questions.js','core/demo-store.js','profissional/app.js']:
  p.add_script_tag(content=(root/f).read_text())
 def go(path):p.evaluate('(h)=>location.hash=h',path);p.wait_for_timeout(60)
 def modal(action,id=None):
  if id is None:p.locator('[data-act="'+action+'"]').first.click()
  else:p.locator(f'[data-act="{action}"][data-id="{id}"]').first.click()
  assert p.locator('#modal').evaluate('(x)=>x.open')
 def save():p.locator('#modal-save').click();p.wait_for_timeout(100);assert not p.locator('#modal').evaluate('(x)=>x.open')
 go('#clientes');modal('new-client');p.locator('#f-name').fill('QA Alice');p.locator('#f-focus').fill('Autoconhecimento');save();
 cid=p.evaluate('db.clients[db.clients.length-1].id');assert cid in p.evaluate('location.hash')
 print('OK client created',cid)
 modal('new-process-for',cid);p.locator('#f-goal').fill('Comunicação em reuniões');save();
 pid=p.evaluate('db.programs[db.programs.length-1].id');assert 'program='+pid in p.evaluate('location.hash');print('OK process',pid)
 go(f'#cliente={cid}&tab=sessoes&program={pid}');modal('new-session-for',pid);p.locator('#f-focus').fill('Pauta restrita');save();
 assert 'tab=sessoes' in p.evaluate('location.hash');sid=p.evaluate('db.sessions[db.sessions.length-1].id');print('OK session',sid)
 go(f'#cliente={cid}&tab=desenvolvimento&program={pid}');modal('new-action-for',pid);p.locator('#f-title').fill('Fazer exercício de feedback');save();
 assert 'tab=desenvolvimento' in p.evaluate('location.hash');aid=p.evaluate('db.actions[db.actions.length-1].id')
 p.locator(f'[data-act="toggle-action"][data-id="{aid}"]').click();assert p.evaluate('db.actions[db.actions.length-1].status')=='concluido'
 print('OK action',aid)
 go(f'#cliente={cid}&tab=atividades&program={pid}');modal('new-disc',pid);p.locator('#f-visibility').select_option('compartilhado');save();
 assert 'tab=atividades' in p.evaluate('location.hash');taskId=p.evaluate('db.discAssignments[db.discAssignments.length-1].id')
 print('OK assigned DISC',taskId)
 # simulate the client side with same storage API, without inventing an answer screen
 done=p.evaluate('''({taskId,cid})=>{const t=db.discAssignments.find(x=>x.id===taskId);const Q=window.RTDiscQuestions;const answers=Q.QUESTIONS.map(q=>q.options[0][1]); const ok=RTDemoStore.submitDisc(db,cid,t.id,answers,[0,1,2],[3,4,5]);persist('cliente','disc-response',t.id);return ok}''',{'taskId':taskId,'cid':cid});assert done
 go(f'#cliente={cid}&tab=resultados&program={pid}')
 assert p.get_by_text('Resultados do DISC/ACER').count()>0 and p.get_by_text('Aplicação 1').count()>0
 modal('disc-feedback',taskId);p.locator('#f-feedback').fill('Orientação ilustrativa para o cliente');p.locator('#f-feedbackVisibility').select_option('compartilhado');save();
 assert 'tab=resultados' in p.evaluate('location.hash')
 assert p.get_by_text('Orientação ilustrativa para o cliente').count()>0
 go(f'#cliente={cid}&tab=documentos&program={pid}')
 assert p.get_by_text('Orientação ilustrativa para o cliente').count()>0
 print('OK DISC -> chart -> release -> documents')
 go(f'#cliente={cid}&tab=geral&program={pid}');p.evaluate('(cid)=>openModal("new-process",cid)',cid);p.locator('#f-goal').fill('Plano alternativo');save();
 pid2=p.evaluate('db.programs[db.programs.length-1].id')
 go(f'#cliente={cid}&tab=resultados&program={pid2}');assert p.get_by_text('Nenhum resultado disponível').count()>0
 print('OK isolated processes')
 go('#inicio');p.locator('#home-search').fill('QA Alice');assert p.locator('#home-search-results .rt-v9-search-result').count()==1
 print('OK home search')
 go('#agenda');assert p.locator('.rt-v9-dash-row').count()>=1
 print('OK agenda')
 print('JS ERRORS',errors)
 assert not errors
 browser.close()
