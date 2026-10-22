#!/usr/bin/env python3
"""Testes básicos offline do Communication Lab V3.2 e retrocompatibilidade."""
from pathlib import Path
import unittest,re,json
B=Path(__file__).resolve().parent/'biblioteca'
class LabTests(unittest.TestCase):
 def setUp(self):
  self.lab=json.loads((B/'data/communication_lab.json').read_text(encoding='utf8'))
  self.html=(B/'index.html').read_text(encoding='utf8')
  self.js=(B/'app.js').read_text(encoding='utf8')
 def test_eight_multistage_scenarios(self):
  self.assertEqual(len(self.lab['cenarios']),8)
  self.assertEqual(len({x['id'] for x in self.lab['cenarios']}),8)
  self.assertEqual(sum(len(x['etapas']) for x in self.lab['cenarios']),24)
  for scene in self.lab['cenarios']:
   for stage in scene['etapas']:
    self.assertEqual(len(stage['alternativas']),3)
    self.assertTrue(stage['pergunta'] and stage['fala'])
    self.assertTrue(all(set(c)=={'texto','resposta','feedback'} and all(c.values()) for c in stage['alternativas']))
 def test_six_exercises_and_checklist(self):
  self.assertEqual(len(self.lab['exercicios']),6)
  self.assertEqual(len({e['id'] for e in self.lab['exercicios']}),6)
  self.assertTrue(all(len(e['criterios'])==3 and e['tarefa'] for e in self.lab['exercicios']))
 def test_four_factors_and_educational_guardrails(self):
  self.assertEqual(set(self.lab['dicas_fatores']),{'D','I','S','C'})
  self.assertEqual(len(self.lab['contextos']),5)
  self.assertIn('não geram um perfil DISC/ACER',self.js)
  self.assertIn('não interpretam o significado com IA',self.js)
 def test_embedded_json_exactly_matches(self):
  m=re.search(r'<script type="application/json" id="lab-data">([\s\S]*?)</script>',self.html)
  self.assertIsNotNone(m)
  self.assertEqual(json.loads(m.group(1)),self.lab)
 def test_legacy_catalog_and_store(self):
  self.assertEqual(len(json.loads((B/'data/indice_pesquisa.json').read_text())),135)
  self.assertIn("const KEY = 'rt-disc-acer-library-v2'",self.js)
  self.assertIn('lab:local.lab',self.js)
  self.assertIn('local.favorites',self.js)
  self.assertIn('local.plans',self.js)
 def test_integration_and_no_credentials(self):
  r=B.parent
  self.assertIn('biblioteca/index.html',(r/'index.html').read_text())
  self.assertIn('laboratorio:drawLab',self.js)
  for f in r.rglob('*.html'):
   self.assertNotRegex(f.read_text(),r'(?i)(?:service_role|SUPABASE_SERVICE_ROLE_KEY)\s*[:=]\s*["\x27][A-Za-z0-9\-_.]{50,}')
if __name__=='__main__':unittest.main(verbosity=2)
