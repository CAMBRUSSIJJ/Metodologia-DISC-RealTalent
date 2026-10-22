from pathlib import Path
from html.parser import HTMLParser
import re, json, zipfile
root=Path(__file__).parent
s=(root/'index.html').read_text()
orig=(root/'originais/RealTalent_SISTEMA_FUNCIONAL_ORIGINAL.html').read_text()
assert s.count('id="tab-content-inicio"')==1
for tab in ['mapeamento','relatorio','graficos','plano','dashboard','sobre','biblioteca']:
 assert s.count('id="tab-content-'+tab+'"')==1,tab
 assert s.count('id="tab-'+tab+'"')==1,tab
assert 'const RT_USER_TABS' in s
assert 'rt-library-iframe' in s
assert 'profissional/index.html' in s
assert "['inicio','mapeamento','relatorio','graficos','plano','dashboard','sobre']" in orig
assert 'id="tab-content-plano"' in orig
assert '<script' in s and 'RealTalent em modo sistema' in s
for f in ['profissional/index.html','biblioteca/index.html','biblioteca/app.js','biblioteca/data/biblioteca_unificada.json','colaborador.html','lider.html','admin (1).html']:
 assert (root/f).exists(),f
lib=json.loads((root/'biblioteca/data/biblioteca_unificada.json').read_text())
assert lib, 'empty library data'
print('QA final: original preservado, todas as abas, links, workspace e Biblioteca presentes.')
