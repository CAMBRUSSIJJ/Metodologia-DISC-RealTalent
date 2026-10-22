"""QA interativo V9.10 — executado apenas com dados fictícios e armazenamento temporário."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os, re, json, tempfile
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('REALTALENT_QA_OUTPUT',str(Path(tempfile.gettempdir())/'realtalent-v910-qa')));OUT.mkdir(parents=True,exist_ok=True)
STYLES={'profissional':['profissional/app.css','assets/rt-design-system.css','assets/rt-v7-workspace.css','assets/rt-v8-integration.css','assets/rt-v81-disc.css','assets/rt-v9-professional.css','assets/rt-v92-clients.css','assets/rt-v93-workspace.css','assets/rt-v94-client-tabs.css','assets/rt-v95-action-plan.css','assets/rt-v96-tools.css','assets/rt-v97-workflow.css','assets/rt-v99-integrated.css','assets/rt-v910-sessions.css'],
'cliente':['cliente/app.css','assets/rt-design-system.css','assets/rt-v7-workspace.css','assets/rt-v8-integration.css','assets/rt-v81-disc.css','assets/rt-v97-workflow.css','assets/rt-v98-client.css','assets/rt-v99-integrated.css','assets/rt-v910-sessions.css']}

def boot(browser,area,stored=None,mobile=False):
 p=browser.new_page(viewport={'width':390 if mobile else 1440,'height':850 if mobile else 950});errors=[]
 p.on('pageerror',lambda e:errors.append(str(e)))
 html=(ROOT/area/'index.html').read_text()
 html=re.sub(r'<script\b[^>]*\bsrc=[^>]+</script>','',html,flags=re.I)
 html=re.sub(r'<link\b[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
 css='\n'.join((ROOT/f).read_text() for f in STYLES[area]);html=html.replace('</head>','<style>'+css+'</style></head>')
 p.set_content(html)
 p.evaluate('''values=>{const m=new Map(values||[]);window.__mem=m;Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),get length(){return m.size},key:i=>[...m.keys()][i]??null}});const sm=new Map();Object.defineProperty(window,'sessionStorage',{configurable:true,value:{getItem:k=>sm.get(k)??null,setItem:(k,v)=>sm.set(k,String(v))}});}''',stored or [])
 for js in ['core/disc-questions.js','core/demo-store.js',f'{area}/app.js']:p.add_script_tag(content=(ROOT/js).read_text())
 p.wait_for_timeout(100);p.set_default_timeout(4500);return p,errors

def snap(p):return p.evaluate('Array.from(window.__mem.entries())')

def main():
 with sync_playwright() as t:
  b=t.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
  pro,ep=boot(b,'profissional')
  assert pro.evaluate('RTDemoStore.VERSION')==11
  # migration from previous V9.9 schema is lossless
  old=pro.evaluate('RTDemoStore.seed()');old['version']=10
  for s in old['sessions']:s.pop('recapVisibility',None);s.pop('clientRecap',None)
  for a in old['actions']:a.pop('sessionId',None)
  assert pro.evaluate('raw=>{const u=RTDemoStore.upgrade(raw);return u.version===11&&u.sessions.every(s=>s.recapVisibility==="privado")&&u.actions.every(a=>a.sessionId===null);}',old)
  # A new agreement must be linked to a session, goal, and process.
  pro.evaluate('location.hash="#cliente=c1&tab=sessoes&program=p1&session=s1"');pro.wait_for_timeout(150)
  assert 'Compromissos deste encontro' in pro.locator('#content').inner_text()
  pro.locator('[data-act="new-session-action"][data-id="s1"]').click()
  pro.locator('#modal [name="title"]').fill('Praticar uma conversa guiada após o encontro')
  pro.locator('#modal [name="visibility"]').select_option('compartilhado')
  pro.locator('#modal-save').click();pro.wait_for_timeout(100)
  aid=pro.evaluate('RTDemoStore.load().actions.find(a=>a.title==="Praticar uma conversa guiada após o encontro").id')
  assert pro.evaluate('id=>{const a=RTDemoStore.load().actions.find(x=>x.id===id);return a.sessionId==="s1"&&a.programId==="p1"&&a.goalId==="goal-p1"&&a.visibility==="compartilhado"}',aid)
  assert not pro.evaluate('''()=>RTDemoStore.createSessionAgreement(db,'s1',{title:'Tentativa entre clientes',goalId:'goal-p2',due:'2026-11-01',visibility:'compartilhado'})''')
  assert pro.evaluate('RTDemoStore.load().actions.filter(a=>a.id==="'+aid+'").length')==1
  # A past agreement is visible as a reminder during the next session, without duplication.
  pro.evaluate('''()=>{const d=RTDemoStore.load();d.sessions.push({id:'s-new',programId:'p1',date:'2027-04-10',time:'11:00',focus:'Pauta interna do próximo encontro',clientTopic:'Próximo encontro compartilhado',status:'agendada',visibility:'compartilhado',summary:'',clientRecap:'',recapVisibility:'privado'});RTDemoStore.save(d);db=RTDemoStore.load();}''')
  pro.evaluate('location.hash="#cliente=c1&tab=sessoes&program=p1&session=s-new"');pro.wait_for_timeout(100)
  assert 'Para retomar neste encontro' in pro.locator('#content').inner_text()
  assert 'Praticar uma conversa guiada após o encontro' in pro.locator('#content').inner_text()
  pro.evaluate('location.hash="#cliente=c1&tab=sessoes&program=p1&session=s1"');pro.wait_for_timeout(100)
  pro.locator('[data-act="close-session"][data-id="s1"]').click()
  pro.locator('#modal [name="summary"]').fill('REGISTRO INTERNO SIGILOSO DEMONSTRATIVO')
  pro.locator('#modal-save').click();pro.wait_for_timeout(100)
  assert pro.evaluate('RTDemoStore.load().sessions.find(s=>s.id==="s1").status')=='concluida'
  cl,ec=boot(b,'cliente',snap(pro));cl.evaluate('location.hash="#encontros"');cl.wait_for_timeout(100)
  assert 'REGISTRO INTERNO SIGILOSO' not in cl.locator('#app').inner_text()
  assert 'Nenhum resumo disponibilizado' in cl.locator('#app').inner_text()
  cl.close()
  # Explicit draft and share; a private recap must never reach the client.
  pro.locator('[data-act="edit-session-recap"][data-id="s1"]').click()
  pro.locator('#modal [name="clientRecap"]').fill('Praticar perguntas abertas até o próximo encontro.')
  assert pro.locator('#modal [name="recapVisibility"]').input_value()=='privado'
  pro.locator('#modal-save').click();pro.wait_for_timeout(100)
  assert not pro.evaluate('RTDemoStore.clientView(RTDemoStore.load(),"c1").sessions.find(s=>s.id==="s1").clientRecap')
  pro.locator('[data-act="edit-session-recap"][data-id="s1"]').click()
  pro.locator('#modal [name="recapVisibility"]').select_option('compartilhado')
  pro.locator('#modal-save').click();pro.wait_for_timeout(100)
  assert pro.evaluate('RTDemoStore.load().sessions.find(s=>s.id==="s1").recapVisibility')=='compartilhado'
  assert not pro.evaluate('RTDemoStore.clientView(RTDemoStore.load(),"c2").sessions.some(s=>s.id==="s1")')
  cl2,ec2=boot(b,'cliente',snap(pro));print("STEP: boot cl2 done",flush=True);cl2.evaluate('location.hash="#encontros"');cl2.wait_for_timeout(100);print("STEP: cl2 redirected",flush=True)
  assert 'Praticar perguntas abertas até o próximo encontro.' in cl2.locator('#app').inner_text()
  assert 'Praticar uma conversa guiada após o encontro' in cl2.locator('#app').inner_text()
  assert 'REGISTRO INTERNO SIGILOSO' not in cl2.locator('#app').inner_text()
  assert 'Pauta interna do próximo encontro' not in cl2.locator('#app').inner_text()
  # Client can record an experience; professional sees it in originating session.
  cl2.evaluate('location.hash="#atividades"');cl2.wait_for_timeout(90)
  cl2.locator('[data-act="report-action"][data-id="'+aid+'"]').click()
  cl2.locator('#rt99-experience-dialog [name="outcome"]').select_option('tentada')
  cl2.locator('#rt99-experience-dialog [name="note"]').fill('Precisei adaptar a abordagem na simulação.')
  cl2.locator('#rt99-experience-dialog button[type="submit"]').click()
  assert cl2.evaluate('id=>RTDemoStore.load().actions.find(a=>a.id===id).experience.outcome',aid)=='tentada'
  pro.evaluate('values=>{for(const [key,value] of values)localStorage.setItem(key,value);db=RTDemoStore.load();render();}',snap(cl2))
  pro.evaluate('location.hash="#cliente=c1&tab=sessoes&program=p1&session=s1"');pro.wait_for_timeout(110)
  assert 'Precisei adaptar a abordagem na simulação.' in pro.locator('#content').inner_text()
  assert not pro.evaluate('RTDemoStore.load().actions.some(a=>a.sessionId==="s1"&&a.programId!=="p1")')
  cl2.screenshot(path=str(OUT/'v910-cliente-encontros.png'),full_page=True)
  pro.screenshot(path=str(OUT/'v910-professional-sessoes.png'),full_page=True)
  cm,em=boot(b,'cliente',snap(pro),mobile=True);cm.evaluate('location.hash="#encontros"');cm.wait_for_timeout(110)
  assert cm.evaluate('document.documentElement.scrollWidth<=innerWidth+4'),cm.evaluate('[document.documentElement.scrollWidth,innerWidth]')
  assert not(ep+ec+ec2+em),(ep+ec+ec2+em)
  # Private meeting cannot publish a recap even if explicitly requested.
  assert pro.evaluate('''()=>{const d=RTDemoStore.load(),s=d.sessions.find(s=>s.id==='s4');return RTDemoStore.updateSessionRecap(d,s.id,'Texto privado','compartilhado')&&s.recapVisibility==='privado';}''')
  print('V9.10 QA OK — sessão→acordo→cliente→relato→profissional, migração, retomada, isolamento, visibilidade, mobile, JS')
  b.close()
if __name__=='__main__':main()
