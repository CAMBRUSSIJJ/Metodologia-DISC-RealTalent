"""QA em navegador com código injetado: não equivale a deploy URL/browser E2E."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,os,tempfile
root=Path(__file__).resolve().parents[1]
out=Path(os.environ.get('REALTALENT_QA_OUTPUT',str(Path(tempfile.gettempdir())/'realtalent-v97-qa')));out.mkdir(parents=True,exist_ok=True)

def bootstrap(browser,kind,storage=None):
    page=browser.new_page(viewport={'width':1200,'height':860})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    html=(root/kind/'index.html').read_text()
    html=re.sub(r'<script\b[^>]*\bsrc=[^>]+</script>','',html,flags=re.I)
    html=re.sub(r'<link\b[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
    page.set_content(html)
    page.evaluate("""(values)=>{const m=new Map(values);window.__mem=m;
      Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),get length(){return m.size;},key:i=>[...m.keys()][i]??null},configurable:true});
      const sess=new Map();Object.defineProperty(window,'sessionStorage',{value:{getItem:k=>sess.get(k)??null,setItem:(k,v)=>sess.set(k,String(v)),removeItem:k=>sess.delete(k)},configurable:true});
    }""",storage or [])
    for file in ['core/disc-questions.js','core/demo-store.js',f'{kind}/app.js']:
       page.add_script_tag(content=(root/file).read_text())
    page.wait_for_timeout(50)
    return page,errors

def snapshot(page):return page.evaluate('Array.from(window.__mem.entries())')

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
  # An overdue appointment is never upcoming, but is displayed for confirmation.
  c,errors=bootstrap(browser,'cliente')
  c.evaluate("""() =>{const d=RTDemoStore.load();const x=d.sessions.find(s=>s.id==='s1');x.date='2026-10-10';x.time='10:00';RTDemoStore.save(d);} """)
  c.evaluate('location.hash="#encontros"');c.wait_for_timeout(80)
  assert 'Aguardando confirmação' in c.locator('#app').inner_text()
  assert c.locator('#app').get_by_text('A confirmar',exact=True).count()>=1
  assert c.locator('#app').get_by_text('0 agendado(s)').count()>=1
  c.evaluate('location.hash="#jornada"');c.wait_for_timeout(50)
  assert c.locator('#app').get_by_text('Encontro aguardando confirmação').count()>=1
  # User opens DISC, changes answer and refreshes before completion.
  c.evaluate('location.hash="#disc"');c.wait_for_timeout(60)
  assert c.locator('#app').get_by_text('Aguardando resposta').count()>=1
  c.locator('[data-act="disc-start"]').first.click()
  assert 'QUESTÃO 1 DE' in c.locator('#app').inner_text()
  c.locator('input[name="disc-choice"]').first.check()
  first=c.evaluate('rtQuiz.answers[0]')
  assert first is not None
  c.locator('[data-act="disc-next"]').click()
  assert c.evaluate('rtQuiz.step')==1
  assert c.evaluate('RTDemoStore.load().discAssignments[0].startedAt')
  draft=c.evaluate("JSON.parse(localStorage.getItem('rt-v97-disc-draft:c1:disc-seed-1'))")
  assert draft['answers'][0]==first and draft['step']==1
  saved=snapshot(c);c.close()
  # New document/window simulates browser refresh; the session draft remains isolated per client.
  c,err2=bootstrap(browser,'cliente',saved)
  c.evaluate('location.hash="#disc"');c.wait_for_timeout(60)
  assert c.locator('[data-act="disc-start"]').count()==1
  assert c.locator('[data-act="disc-start"]').inner_text()=='Continuar'
  c.locator('[data-act="disc-start"]').click()
  assert 'QUESTÃO 2 DE' in c.locator('#app').inner_text()
  assert c.evaluate('rtQuiz.answers[0]')==first
  c.locator('[data-act="disc-cancel"]').click()
  assert c.evaluate('rtQuiz===null')
  assert c.evaluate("localStorage.getItem('rt-v97-disc-draft:c1:disc-seed-1')!==null")
  # Status in professional: underway, cancellable with confirmation, audit retained.
  p,perr=bootstrap(browser,'profissional',snapshot(c))
  p.evaluate('location.hash="#ferramentas?tab=aplicacoes"');p.wait_for_timeout(70)
  assert p.get_by_text('Em andamento').count()>=1
  p.once('dialog',lambda dialog:dialog.accept())
  p.locator('[data-act="cancel-disc"][data-id="disc-seed-1"]').click()
  assert p.evaluate("db.discAssignments.find(x=>x.id==='disc-seed-1').status")=='cancelado'
  assert p.evaluate("db.discAssignments.find(x=>x.id==='disc-seed-1').visibility")=='privado'
  assert p.evaluate("db.audit.some(a=>a.action==='cancel-disc')")
  p.evaluate('location.hash="#ferramentas?tab=aplicacoes&status=canceladas"');p.wait_for_timeout(50)
  assert p.get_by_text('Cancelada').count()>=1
  # A canceled application can be assigned anew; no stale answer becomes the new assignment.
  assert p.evaluate("RTDemoStore.assignDisc(db,'p1','compartilhado')")
  p.evaluate("RTDemoStore.save(db)")
  fresh=p.evaluate("db.discAssignments.at(-1).id")
  assert fresh!='disc-seed-1'
  c2,cerr=bootstrap(browser,'cliente',snapshot(p))
  c2.evaluate('location.hash="#disc"');c2.wait_for_timeout(65)
  assert c2.locator('[data-act="disc-start"]').count()==1
  c2.locator('[data-act="disc-start"]').click()
  assert c2.evaluate('rtQuiz.step')==0
  # Cancelled previous id does not appear to the participant and does not accept responses.
  assert c2.evaluate("RTDemoStore.clientView(RTDemoStore.load(),'c1').discAssignments.every(x=>x.id!=='disc-seed-1')")
  assert not c2.evaluate("RTDemoStore.submitDisc(RTDemoStore.load(),'c1','disc-seed-1',RTDiscQuestions.QUESTIONS.map(q=>q.options[0][1]),[0,1,2],[3,4,5])")
  # One participant does not inherit another's draft, even if both share browser.
  c2.evaluate("(cid)=>{selected=cid;rtQuiz=null;render()}",'c2')
  assert not c2.evaluate("RTDemoStore.clientView(RTDemoStore.load(),'c2').discAssignments.some(x=>x.id===fresh)")
  # no JavaScript exceptions on all apps
  assert not (errors+err2+perr+cerr),errors+err2+perr+cerr
  print('V9.7 WORKFLOW OK — auto-save, page reload, isolation, cancellation, reassign, session overdue, sharing, zero JS exceptions')
  browser.close()

if __name__=='__main__':run()
