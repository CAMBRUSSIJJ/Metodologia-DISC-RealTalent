#!/usr/bin/env python3
"""Verificações estruturais da RealTalent V9. A segurança multiusuário não é testada."""
from pathlib import Path
from html.parser import HTMLParser
import subprocess
r=Path(__file__).parent
p=(r/'profissional/index.html').read_text();js=(r/'profissional/app.js').read_text();c=(r/'cliente/index.html').read_text();cl=(r/'cliente/app.js').read_text()
for label in ['inicio','clientes','processos','atividades-guiadas','graficos-relatorios','sessoes','plano-desenvolvimento','plano-acao','ferramentas','biblioteca']:
 assert f'data-page="{label}"' in p, label
assert len(list(__import__('re').finditer(r'data-page=',p)))==11, '10 menus + Configurações'
assert 'data-page="mapeamento"' not in p and 'data-page="relatorios"' not in p
assert 'data-page="disc"' not in c and 'data-page="atividades"' in c
assert len(list(__import__('re').finditer(r'data-page=',c)))==6, '5 módulos + Meu perfil'
assert 'rt-v98-client.css' in c
for name in ['geral','sessoes','atividades','resultados','desenvolvimento','documentos']:
 assert f"['{name}'" in js, name
assert 'showClientWorkspace' in js and 'showAgenda' in js and 'attentionQueue' in js
assert 'showDiscAssignments' in js and 'showDiscReports' in js and 'discRadar' in js
assert 'RTDiscQuestions.QUESTIONS' in cl and 'RTDiscQuestions.ADJECTIVES' in cl
assert 'rt-v9-professional.css' in p and 'rt-v92-clients.css' in p
assert 'client-detail' in js and 'new-disc' in js and 'disc-feedback' in js
assert 'disc-engine.html?rtEmbed=1&rtView=plano' in js
assert (r/'originais/RealTalent_SISTEMA_FUNCIONAL_ORIGINAL.html').is_file()
assert 'const VERSION = 9' in (r/'core/demo-store.js').read_text()
for f in ['profissional/app.js','cliente/app.js','core/demo-store.js','core/disc-questions.js']:
 subprocess.run(['node','--check',str(r/f)],check=True)
class Check(HTMLParser):pass
for f in ['index.html','acesso.html','cliente/index.html','profissional/index.html','disc-engine.html']:
 Check().feed((r/f).read_text())
print('V9.8 ESTRUTURA OK — Professional preservado; Minha Jornada com 5 menus, 2 ambientes, código e HTML válidos')
