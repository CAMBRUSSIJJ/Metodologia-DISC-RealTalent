from pathlib import Path
from playwright.sync_api import sync_playwright
import re, sys, os
ROOT=Path(__file__).resolve().parents[1]
import tempfile
OUT=Path(os.environ.get('REALTALENT_QA_OUTPUT', str(Path(tempfile.gettempdir())/'realtalent-v98-qa')));OUT.mkdir(parents=True,exist_ok=True)

def load(browser,width=1440,height=960,storage=None):
    p=browser.new_page(viewport={'width':width,'height':height}, device_scale_factor=1)
    errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
    html=(ROOT/'cliente/index.html').read_text()
    html=re.sub(r'<script\b[^>]*\bsrc=[^>]+</script>','',html,flags=re.I)
    html=re.sub(r'<link\b[^>]*\brel="stylesheet"[^>]*>','',html,flags=re.I)
    styles='\n'.join((ROOT/f).read_text() for f in ['cliente/app.css','assets/rt-design-system.css','assets/rt-v7-workspace.css','assets/rt-v8-integration.css','assets/rt-v81-disc.css','assets/rt-v97-workflow.css','assets/rt-v98-client.css'])
    html=html.replace('</head>','<style>'+styles+'</style></head>')
    p.set_content(html)
    p.evaluate('''(values)=>{const m=new Map(values);window.__mem=m;
      Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),get length(){return m.size},key:i=>[...m.keys()][i]??null},configurable:true});
      const sess=new Map();Object.defineProperty(window,'sessionStorage',{value:{getItem:k=>sess.get(k)??null,setItem:(k,v)=>sess.set(k,String(v))},configurable:true});}''',storage or [])
    for f in ['core/disc-questions.js','core/demo-store.js','cliente/app.js']:
       p.add_script_tag(content=(ROOT/f).read_text())
    p.wait_for_timeout(100)
    return p,errors

with sync_playwright() as b:
 browser=b.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
 p,errors=load(browser)
 assert p.locator('.side nav a[data-page]').count()==5
 assert p.locator('.side-bottom a[href="#perfil"]').count()==1
 assert p.locator('#app .rt98-primary h2').inner_text()=='Responder DISC/ACER'
 assert p.locator('#app .rt98-secondary .rt98-mini').count()==2
 p.screenshot(path=str(OUT/'v98-inicio-desktop.png'),full_page=True)
 p.locator('#app [data-act="disc-start"]').click()
 assert p.evaluate('location.hash')=='#disc'
 assert p.locator('[data-page="atividades"]').get_attribute('aria-current')=='page'
 assert 'QUESTÃO 1 DE 20' in p.locator('#app').inner_text()
 p.locator('input[name="disc-choice"]').first.check()
 p.locator('[data-act="disc-next"]').click()
 assert 'QUESTÃO 2 DE 20' in p.locator('#app').inner_text()
 p.evaluate('location.hash="#atividades"');p.wait_for_timeout(120)
 p.locator('[data-act="activities-filter"][data-id="andamento"]').click()
 assert p.get_by_text('Mapeamento DISC/ACER',exact=True).count()==1
 assert p.locator('[data-act="disc-start"]').count()==1
 p.screenshot(path=str(OUT/'v98-atividades-desktop.png'),full_page=True)
 p.locator('[data-act="activities-filter"][data-id="fazer"]').click()
 assert p.locator('#app').get_by_text('Meu estilo de comunicação').count()==1
 assert p.get_by_text('Praticar uma pergunta aberta em uma conversa de rotina').count()==1
 p.locator('[data-act="respond-instrument"]').first.click()
 assert p.locator('#instrument-dialog').is_visible()
 for i in range(3):p.locator(f'[name="answer{i}"]').fill(f'Resposta fictícia {i+1}')
 p.locator('#instrument-dialog button[type="submit"]').click()
 assert p.evaluate('location.hash')=='#atividades'
 assert p.locator('[data-act="activities-filter"][data-id="concluidas"]').get_attribute('aria-pressed')=='true'
 assert p.locator('#app').get_by_text('Meu estilo de comunicação').count()==1
 p.locator('[data-act="activities-filter"][data-id="fazer"]').click()
 p.locator('[data-act="report-action"]').first.click()
 assert p.locator('#rt99-experience-dialog').is_visible()
 p.locator('#rt99-experience-dialog [name="outcome"]').select_option('realizada')
 p.locator('#rt99-experience-dialog button[type="submit"]').click()
 assert p.evaluate('RTDemoStore.load().actions.find(x=>x.id==="a1").status')=='concluido'
 p.evaluate('location.hash="#instrumentos"');p.wait_for_timeout(80)
 assert p.locator('[data-page="atividades"]').get_attribute('aria-current')=='page'
 p.evaluate('location.hash="#reflexoes"');p.wait_for_timeout(70)
 assert p.locator('[data-page="atividades"]').get_attribute('aria-current')=='page'
 p.evaluate('location.hash="#perfil"');p.wait_for_timeout(70)
 assert p.locator('.rt98-profile-link').get_attribute('aria-current')=='page'
 assert not errors,errors
 mobile,me=load(browser,width=390,height=844)
 assert mobile.locator('nav[aria-label="Menu do participante"] a').count()==5
 assert mobile.locator('.rt98-primary h2').inner_text()=='Responder DISC/ACER'
 mobile.screenshot(path=str(OUT/'v98-inicio-mobile.png'),full_page=True)
 mobile.evaluate('location.hash="#atividades"');mobile.wait_for_timeout(90)
 mobile.screenshot(path=str(OUT/'v98-atividades-mobile.png'),full_page=True)
 extent=mobile.evaluate('({width:document.documentElement.scrollWidth,inner:window.innerWidth})')
 assert extent['width']<=extent['inner']+3,extent
 assert not me,me
 print('V9.8 UX QA OK: 5 links, priority DISC, resume, states, guided responses, actions, legacy routes, mobile width, zero JS errors')
 browser.close()
