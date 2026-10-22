#!/usr/bin/env python3
"""Atualiza os dados embutidos na UI v3 sem reconstruir a interface.

Uso: python3 atualizar-dados.py (após atualizar os arquivos JSON em data/)
"""
from pathlib import Path
import json, re
base=Path(__file__).resolve().parent
site=base/'index.html'
html=site.read_text(encoding='utf-8')
assert 'Biblioteca DISC/ACER 3.2' in html, 'A interface ativa não é a versão 3.2'
records=json.loads((base/'data/indice_pesquisa.json').read_text(encoding='utf-8'))
profiles=json.loads((base/'data/perfis.json').read_text(encoding='utf-8'))
advanced=json.loads((base/'data/perfis_avancados.json').read_text(encoding='utf-8'))
lab=json.loads((base/'data/communication_lab.json').read_text(encoding='utf-8'))
assert len(lab['cenarios'])==8 and len(lab['exercicios'])==6
assert set(advanced)=={'D','I','S','C'}
assert all(len(advanced[k]['situacoes'])==3 for k in advanced)
assert len(records)==len({r['id'] for r in records}), 'IDs duplicados no acervo'
assert {p['sigla'] for p in profiles}=={'D','I','S','C'}, 'Quatro perfis canônicos esperados'
summary={'articles':sum(r['kind']=='Artigos' for r in records),'profiles':4,
         'blends':sum(r['kind']=='Combinações' for r in records),
         'matrix':sum(r['kind']=='Matriz' for r in records),
         'scenarios':sum(r['kind']=='Casos' for r in records),
         'courses':sum(r['kind']=='Cursos' for r in records),
         'glossary':sum(r['kind']=='Glossário' for r in records)}
sections=[['conceitos','Fundamentos'],['interpretacao','Interpretação'],['comunicacao','Comunicação'],['lideranca','Liderança e equipes'],['vendas','Vendas'],['servicos','Serviços'],['desenvolvimento','Desenvolvimento'],['governanca','Ética e governança']]
def replace_tag(mark, value, content):
 pattern=rf'(<script type="application/json" id="{mark}">)[\s\S]*?(</script>)'
 data=json.dumps(value,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
 output,n=re.subn(pattern,lambda m:m.group(1)+data+m.group(2),content,count=1)
 assert n==1, 'Script JSON ausente: '+mark
 return output
html=replace_tag('library-data',{'records':records,'sections':sections,'summary':summary},html)
html=replace_tag('profile-data',profiles,html)
html=replace_tag('advanced-data',advanced,html)
html=replace_tag('lab-data',lab,html)
site.write_text(html,encoding='utf-8')
print(f'Dados sincronizados: {len(records)} conteúdos, {len(profiles)} perfis. Interface V3.2 preservada.')
