from pathlib import Path
from testar_minhas_atividades_v98 import load
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
 p,errors=load(b)
 p.locator('[data-act="disc-start"]').click()
 for i in range(20):
  assert 'QUESTÃO '+str(i+1)+' DE 20' in p.locator('#app').inner_text()
  if i==19: assert p.locator('[data-act="disc-next"]').inner_text().startswith('Continuar para os adjetivos')
  p.locator('input[name="disc-choice"]').first.check()
  p.locator('[data-act="disc-next"]').click()
 for r in range(2):
  assert p.locator(".rt-v81-adjectives").count()==1, p.locator("#app").inner_text()[:220]
  for n in range(3):p.locator('[data-act="disc-adj-toggle"]').nth(n).click()
  p.locator('[data-act="disc-adj-next"]').click()
 assert p.evaluate('location.hash')=='#atividades'
 assert p.locator('.rt98-tab[data-id="concluidas"]').get_attribute('aria-pressed')=='true'
 assert p.get_by_text('Mapeamento DISC/ACER',exact=True).count()==1
 assert p.evaluate('RTDemoStore.load().discAssignments[0].status')=='respondido'
 assert not any('scores' in x for x in p.evaluate('RTDemoStore.clientView(RTDemoStore.load(),"c1").discAssignments'))
 assert not errors,errors
 print('FULL DISC 20+2 OK, no early completion, persisted responses, return to concluded filter')
 b.close()
