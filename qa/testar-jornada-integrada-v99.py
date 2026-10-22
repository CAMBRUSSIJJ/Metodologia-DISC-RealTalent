"""Integração simulada no mesmo navegador e contrato clientView; sem autenticação real."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, json, tempfile, os
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('REALTALENT_QA_OUTPUT',str(Path(tempfile.gettempdir())/'realtalent-v99-qa')));OUT.mkdir(parents=True,exist_ok=True)

def boot(browser,area,store=None,mobile=False):
 p=browser.new_page(viewport={'width':390 if mobile else 1440,'height':844 if mobile else 950})
 errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 html=(ROOT/area/'index.html').read_text()
 html=re.sub(r'<script\b[^>]*\bsrc=[^>]+</script>','',html,flags=re.I)
 html=re.sub(r'<link\b[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
 files=['cliente/app.css','assets/rt-design-system.css','assets/rt-v7-workspace.css','assets/rt-v8-integration.css','assets/rt-v81-disc.css','assets/rt-v97-workflow.css','assets/rt-v98-client.css','assets/rt-v99-integrated.css'] if area=='cliente' else ['profissional/app.css','assets/rt-design-system.css','assets/rt-v7-workspace.css','assets/rt-v8-integration.css','assets/rt-v81-disc.css','assets/rt-v9-professional.css','assets/rt-v92-clients.css','assets/rt-v93-workspace.css','assets/rt-v94-client-tabs.css','assets/rt-v95-action-plan.css','assets/rt-v96-tools.css','assets/rt-v97-workflow.css','assets/rt-v99-integrated.css']
 html=html.replace('</head>','<style>'+'\n'.join((ROOT/f).read_text() for f in files)+'</style></head>')
 p.set_content(html)
 p.evaluate('''values=>{const m=new Map(values||[]);window.__mem=m;
 Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),get length(){return m.size},key:i=>[...m.keys()][i]??null}});
 const sess=new Map();Object.defineProperty(window,'sessionStorage',{configurable:true,value:{getItem:k=>sess.get(k)??null,setItem:(k,v)=>sess.set(k,String(v))}});}''',store or [])
 for js in ['core/disc-questions.js','core/demo-store.js',f'{area}/app.js']:p.add_script_tag(content=(ROOT/js).read_text())
 p.set_default_timeout(5000)
 p.wait_for_timeout(80)
 return p,errors

def snap(p):return p.evaluate('Array.from(window.__mem.entries())')

def main():
 with sync_playwright() as t:
  browser=t.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
  pro,e1=boot(browser,'profissional')
  assert pro.evaluate('RTDemoStore.VERSION')==11
  assert pro.evaluate('db.goals.length')==3
  # Professional workflow: create a new goal through modal
  pro.evaluate('location.hash="#cliente=c1&tab=desenvolvimento&program=p1"');pro.wait_for_timeout(80)
  assert pro.get_by_text('Objetivos acordados').count()>=1
  pro.locator('[data-act="new-goal"]').first.click()
  pro.locator('#modal [name="title"]').fill('Conduzir conversas com clareza')
  pro.locator('#modal-save').click()
  assert pro.evaluate('RTDemoStore.load().goals.some(g=>g.title==="Conduzir conversas com clareza")')
  pro.locator('[data-act="new-action-for"]').first.click()
  # The goal options should be displayed for current process
  assert pro.locator('#modal [name="goalId"]').count()==1
  new_id=pro.evaluate('RTDemoStore.load().goals.find(g=>g.title==="Conduzir conversas com clareza").id')
  pro.locator('#modal [name="goalId"]').select_option(new_id)
  pro.locator('#modal [name="title"]').fill('Preparar uma conversa em uma situação simulada')
  pro.locator('#modal-save').click()
  a_id=pro.evaluate('RTDemoStore.load().actions.find(a=>a.title==="Preparar uma conversa em uma situação simulada").id')
  assert pro.evaluate('([aid,gid])=>RTDemoStore.load().actions.find(a=>a.id===aid).goalId===gid',[a_id,new_id])
  # Wrong program goal cannot be assigned to different client
  assert not pro.evaluate('RTDemoStore.linkActionGoal(db,"a1","goal-p2")')
  assert pro.evaluate('RTDemoStore.clientView(db,"c2").goals.every(g=>g.programId!=="p1")')
  pro.screenshot(path=str(OUT/'v99-professional.png'),full_page=True)
  # Client: action is linked to goal; account can submit experienced outcome
  cl,e2=boot(browser,'cliente',snap(pro))
  cl.evaluate('location.hash="#atividades"');cl.wait_for_timeout(90)
  assert cl.get_by_text('Preparar uma conversa em uma situação simulada').count()==1
  cl.locator(f'[data-act="report-action"][data-id="{a_id}"]').click()
  assert cl.locator('#rt99-experience-dialog').is_visible()
  cl.locator('[name="outcome"]').select_option('tentada')
  cl.locator('#rt99-experience-dialog [name="note"]').fill('Encontrei dificuldades ao iniciar a conversa fictícia.')
  cl.locator('#rt99-experience-dialog button[type="submit"]').click()
  assert cl.evaluate('(aid)=>RTDemoStore.load().actions.find(a=>a.id===aid).experience.outcome',a_id)=='tentada'
  assert cl.evaluate('(aid)=>RTDemoStore.load().actions.find(a=>a.id===aid).status',a_id)=='concluido'
  cl.evaluate('location.hash="#desenvolvimento"');cl.wait_for_timeout(90)
  assert 'Conduzir conversas com clareza' in cl.locator('#app').inner_text()
  assert 'Encontrei dificuldades' in cl.locator('#app').inner_text()
  cl.screenshot(path=str(OUT/'v99-client.png'),full_page=True)
  print("DEBUG # Goal reflection private to pro until explic",flush=True)
  # Goal reflection private to pro until explicit sharing
  cl.locator('[data-act="reflect-goal"][data-id="'+new_id+'"]').click()
  cl.locator('#reflection-dialog [name="title"]').fill('Reflexão demonstrativa')
  cl.locator('#reflection-dialog [name="text"]').fill('Notei um ponto importante no exercício fictício.')
  cl.locator('#reflection-dialog button[type="submit"]').click()
  reflection=cl.evaluate('RTDemoStore.load().reflections.at(-1)')
  assert reflection['goalId']==new_id and reflection['visibility']=='privado'
  assert cl.evaluate('RTDemoStore.publicReflections(RTDemoStore.load(),"c1").length')==0
  # Reuse the already validated Professional page to inspect the updated shared store.
  pro.evaluate('values=>{for(const [key,value] of values)window.localStorage.setItem(key,value); db=RTDemoStore.load();render();}',snap(cl))
  pro.evaluate('location.hash="#cliente=c1&tab=desenvolvimento&program=p1&view=concluidas"');pro.wait_for_timeout(90)
  assert 'Encontrei dificuldades' in pro.locator('#content').inner_text()
  pro.evaluate('location.hash="#cliente=c1&tab=documentos&program=p1"');pro.wait_for_timeout(90)
  assert 'Reflexão demonstrativa' not in pro.locator('#content').inner_text()
  assert not pro.evaluate('RTDemoStore.clientView(RTDemoStore.load(),"c2").actions.some(a=>a.id==="'+a_id+'")')
  assert not(e1+e2),(e1+e2)
  print("DEBUG mobile,em=boot",flush=True)
  mobile,em=boot(browser,'cliente',snap(cl),mobile=True)
  mobile.evaluate('location.hash="#desenvolvimento"');mobile.wait_for_timeout(80)
  assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth+3')
  assert not em,em
  # V9.8 migration: remove goals / goalIds and downgrade version to 9
  print("DEBUG old=pro.evaluate",flush=True)
  old=pro.evaluate('RTDemoStore.seed()');old['version']=9;old.pop('goals');
  for a in old['actions']:a.pop('goalId',None)
  legacy,eg=boot(browser,'cliente',[[pro.evaluate('RTDemoStore.KEY'),json.dumps(old)]])
  assert legacy.evaluate('RTDemoStore.load().version')==11
  assert legacy.evaluate('RTDemoStore.load().actions.every(a=>RTDemoStore.load().goals.some(g=>g.id===a.goalId))')
  assert not eg,eg
  print('V9.9 QA OK: goal creation, linked action, attempted outcome, client/pro sync, reflection privacy, migration, mobile, zero JS errors')
  browser.close()

if __name__=='__main__':main()
