#!/usr/bin/env python3
"""Testes de consistência do conteúdo DISC/ACER v3.1 (stdlib)."""
from pathlib import Path
import json,re,unittest

B=Path(__file__).resolve().parent/'biblioteca'
class AdvancedTests(unittest.TestCase):
 def setUp(self):
  self.extra=json.loads((B/'data/perfis_avancados.json').read_text(encoding='utf8'))
  self.profiles=json.loads((B/'data/perfis.json').read_text(encoding='utf8'))
  self.html=(B/'index.html').read_text(encoding='utf8')
 def test_four_factors_and_12_cases(self):
  self.assertEqual(set(self.extra),{'D','I','S','C'})
  self.assertEqual(set(p['sigla'] for p in self.profiles),set(self.extra))
  self.assertEqual(sum(len(x['situacoes']) for x in self.extra.values()),12)
  self.assertEqual(len({(p,c['id']) for p,group in self.extra.items() for c in group['situacoes']}),12)
 def test_feedback_and_context(self):
  for sigla,group in self.extra.items():
   self.assertEqual(len(group['situacoes']),3,sigla)
   self.assertEqual({c['area'] for c in group['situacoes']},{'Comunicação','Liderança','Vendas'})
   for c in group['situacoes']:
    self.assertTrue(all(c[k].strip() for k in ('cenario','pergunta','reflexao','microacao')))
    self.assertEqual(len(c['alternativas']),3)
    self.assertTrue(all(a['texto'].strip() and a['feedback'].strip() for a in c['alternativas']))
   self.assertEqual(len(group['experimentos']),3)
   self.assertEqual(len(group['mitos']),3)
 def test_embedded_matches_source(self):
  match=re.search(r'<script type="application/json" id="advanced-data">([\s\S]+?)</script>',self.html)
  self.assertIsNotNone(match)
  self.assertEqual(json.loads(match.group(1)),self.extra)
 def test_old_catalog_intact(self):
  records=json.loads((B/'data/indice_pesquisa.json').read_text(encoding='utf8'))
  self.assertEqual(len(records),135)
  self.assertEqual(len(set(r['id'] for r in records)),135)
  self.assertIn('id="library-data"',self.html)
 def test_backward_compatible_store(self):
  js=(B/'app.js').read_text(encoding='utf8')
  self.assertIn("const KEY = 'rt-disc-acer-library-v2'",js)
  for name in ('local.favorites','local.read','local.recent','local.notes','local.practices','local.plans'):
   self.assertIn(name,js)
 def test_educational_safeguards(self):
  js=(B/'app.js').read_text(encoding='utf8')
  self.assertIn('Não há nota de personalidade',js)
  self.assertIn('não fundamentam decisões automáticas',js)
  self.assertIn('apenas neste navegador',js)
if __name__=='__main__':unittest.main(verbosity=2)
