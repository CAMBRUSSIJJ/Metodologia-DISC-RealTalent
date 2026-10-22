#!/usr/bin/env python3
"""Verificações de estrutura + testes funcionais interativos com Playwright quando disponível."""
import asyncio
from pathlib import Path
import unittest
from html.parser import HTMLParser
B = Path(__file__).resolve().parent
class Structural(unittest.TestCase):
 def test_files_and_routes(self):
  base=(B/'profissional/index.html').read_text(); js=(B/'profissional/app.js').read_text()
  for item in ['clientes','processos','sessoes','planos','ferramentas','diretrizes']:
   self.assertIn('data-page="'+item+'"',base)
  for key in ['new-client','new-process','new-session','new-action','close-session','toggle-action','finish-process','reset']:
   self.assertIn(key,js)
 def test_integrated(self):
  for n in ['index.html','colaborador.html','lider.html','admin (1).html']:
   self.assertIn('profissional/index.html',(B/n).read_text())
  self.assertIn('../profissional/index.html',(B/'biblioteca/index.html').read_text())
 def test_no_persist_sensitive_workspace(self):
  s=(B/'profissional/app.js').read_text();self.assertNotIn('localStorage',s);self.assertNotIn('sessionStorage',s);self.assertNotIn('fetch(',s)
  self.assertNotIn('service_role',s)
 def test_preserve_original(self):
  self.assertTrue((B/'biblioteca/data/biblioteca_unificada.json').exists())
  self.assertIn('rt-knowledge-frame',(B/'index.html').read_text())
async def interactions():
 from playwright.async_api import async_playwright
 source=(B/'profissional/index.html').read_text()
 source=source.replace('<link rel="stylesheet" href="app.css" />','<style>'+(B/'profissional/app.css').read_text()+'</style>')
 source=source.replace('<script src="app.js" defer></script>','<script>'+(B/'profissional/app.js').read_text()+'</script>')
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
  errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
  await page.set_content(source,wait_until='load')
  assert await page.locator('h1').inner_text()=='Seu trabalho, em perspectiva'
  assert await page.locator('.stat').count()==4
  await page.screenshot(path='/mnt/data/disc_coaching_work/preview_coaching_home.png',full_page=True)
  # New client
  await page.locator('[data-act="go"][data-id="clientes"]').first.click()
  await page.get_by_role('heading',name='Clientes',exact=True).wait_for(timeout=4000)
  await page.get_by_role('button',name='+ Novo cliente').click()
  await page.locator('#f-name').fill('Cliente teste fictício 04')
  await page.locator('#f-focus').fill('Comunicação em equipe')
  await page.locator('#modal-save').click()
  assert await page.get_by_text('Cliente teste fictício 04').count()>=1
  # New process
  await page.locator('[data-page="processos"]').click()
  await page.locator('[data-act="new-process"]').click()
  await page.locator('#f-clientId').select_option(label='Cliente teste fictício 04')
  await page.locator('#f-goal').fill('Construir acordos observáveis de comunicação')
  await page.locator('#modal-save').click()
  await page.get_by_text('Construir acordos observáveis de comunicação').first.wait_for(timeout=4000)
  await page.locator('[data-act="process-detail"]').last.click()
  await page.get_by_role('heading',name='Cliente teste fictício 04',exact=True).wait_for(timeout=4000)
  # session
  await page.locator('[data-act="new-session-for"]').first.click()
  await page.locator('#f-focus').fill('Preparação de metas')
  await page.locator('#modal-save').click()
  await page.get_by_text('Preparação de metas').first.wait_for(timeout=4000)
  await page.locator('[data-act="session-detail"]').last.click()
  await page.locator('[data-act="close-session"]').click()
  await page.locator('#f-summary').fill('Acordados exercícios fictícios para a semana')
  await page.locator('#modal-save').click()
  await page.get_by_text('Acordados exercícios fictícios para a semana').first.wait_for(timeout=4000)
  # task
  await page.locator('[data-page="planos"]').click()
  await page.locator('[data-act="new-action"]').click()
  await page.locator('#f-title').fill('Testar uma pergunta aberta com colega fictício')
  await page.locator('#modal-save').click()
  await page.get_by_text('Testar uma pergunta aberta com colega fictício').first.wait_for(timeout=4000)
  countbefore=await page.locator('.stat-val').last.inner_text()
  await page.locator('[data-act="toggle-action"]').last.click()
  assert await page.locator('.stat-val').last.inner_text()!=countbefore
  # tools
  await page.locator('[data-page="ferramentas"]').click()
  await page.locator('article.resource').first.wait_for(timeout=4000)
  assert await page.locator('article.resource').count()==6
  # mobile
  await page.set_viewport_size({'width':390,'height':844})
  await page.locator('#menu-btn').click()
  assert 'open' in await page.locator('#side').get_attribute('class')
  await page.locator('[data-page="diretrizes"]').click()
  await page.get_by_role('heading',name='Diretrizes profissionais',exact=True).wait_for(timeout=4000)
  await page.wait_for_timeout(300)
  await page.screenshot(path='/mnt/data/disc_coaching_work/preview_coaching_mobile.png',full_page=True)
  # demo not persisted
  await page.evaluate('db=examples(); render()')
  assert len(errors)==0,errors
  print('Testes interativos: 10 fluxos e layout mobile OK; JS errors:',errors)
  await browser.close()
if __name__=='__main__':
 suite=unittest.defaultTestLoader.loadTestsFromTestCase(Structural)
 r=unittest.TextTestRunner(verbosity=2).run(suite)
 if not r.wasSuccessful(): raise SystemExit(1)
 try: asyncio.run(interactions())
 except ImportError: print('Playwright ausente: verificação estrutural concluída')
