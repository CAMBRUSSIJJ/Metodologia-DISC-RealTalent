#!/usr/bin/env python3
"""QA estrutural independente de navegador; teste de interface manual ainda é obrigatório."""
from pathlib import Path
from html.parser import HTMLParser
import subprocess
r=Path(__file__).parent
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.ids=set();self.dups=[]
 def handle_starttag(self,t,atts):
  d=dict(atts)
  if 'id' in d:
   if d['id'] in self.ids:self.dups.append(d['id'])
   self.ids.add(d['id'])
for path in ['acesso.html','cliente/index.html','profissional/index.html']:
 p=Parser();p.feed((r/path).read_text()); assert not p.dups,(path,p.dups)
for j in ['core/demo-store.js','cliente/app.js','profissional/app.js']:
 subprocess.run(['node','--check',str(r/j)],check=True)
subprocess.run(['node',str(r/'testar-nucleo-v5.js')],check=True)
assert (r/'originais/RealTalent_SISTEMA_FUNCIONAL_ORIGINAL.html').exists()
for f in ['index.html','cliente/index.html','profissional/index.html','acesso.html']:
 assert (r/f).exists(),f
p=(r/'index.html').read_text()
assert 'cliente/index.html' in p and 'profissional/index.html' in p and 'tab-content-plano' in p
c=(r/'cliente/app.js').read_text();pr=(r/'profissional/app.js').read_text()
for s in ['atividades','encontros','desenvolvimento','materiais','reflexoes','perfil','visibility','delete-reflection']:
 assert s in c,s
for s in ['new-client','new-process','new-session','new-action','new-guidance','configuracoes','publicReflections','persist(']:
 assert s in pr,s
assert "summary,focus,...s" in (r/'core/demo-store.js').read_text()
for x in ['RELATORIO_DE_LACUNAS_V5.md','SEGURANCA_E_PERMISSOES_V5.md']:
 assert (r/'docs'/x).exists(),x
print('QA estrutura V5: páginas, navegação, ações, compilação JS, núcleo compartilhado e backup original OK.')
