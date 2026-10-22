"""QA estático V6: visual, arquivos e navegação. Não substitui QA end-to-end no navegador."""
from pathlib import Path
from bs4 import BeautifulSoup
import subprocess,re
base=Path(__file__).resolve().parent
pages=['index.html','acesso.html','profissional/index.html','cliente/index.html']
for f in pages:
    s=(base/f).read_text()
    doc=BeautifulSoup(s,'html.parser')
    assert doc.title and doc.title.text,'Missing title: '+f
    for link in doc.find_all('link',href=True):
        href=link['href'].split('?')[0]
        if href.startswith(('http','data:','#')): continue
        assert (base/f).parent.joinpath(href).exists(), f'Broken CSS: {f} -> {href}'
    for node in doc.find_all('script',src=True):
        src=node['src'].split('?')[0]
        if src.startswith(('http','data:')): continue
        assert (base/f).parent.joinpath(src).exists(), f'Broken JS: {f} -> {src}'
    for node in doc.find_all('a',href=True):
        href=node['href'].split('#')[0].split('?')[0]
        if not href or href.startswith(('http','mailto:','javascript:','#')):continue
        assert (base/f).parent.joinpath(href).exists(), f'Broken link: {f} -> {href}'
for f in ['profissional/index.html','cliente/index.html']:
    s=(base/f).read_text()
    assert '../assets/rt-design-system.css' in s
    assert '../assets/rt-design-system.js' in s
    assert s.count('data-rt-space=')==3
    assert 'data-rt-theme-toggle' in s
    assert 'aria-current="page"' in s
home=(base/'index.html').read_text()
assert 'rt-v6-workspaces' in home
assert 'href="profissional/index.html"' in home and 'href="cliente/index.html"' in home
assert '<section class="rt-home-hero' in home
assert '<div id="tab-content-mapeamento"' in home
assert 'tab-content-biblioteca' in home
assert (base/'originais/RealTalent_SISTEMA_FUNCIONAL_ORIGINAL.html').exists()
css=(base/'assets/rt-design-system.css').read_text()
for token in ['#0f0d1a','#1a1630','#a08cff','#7b5fff','Plus Jakarta Sans','@media','rt-workspace-switch']:
    assert token in css
assert 'rt_theme' in (base/'assets/rt-design-system.js').read_text()
for f in ['profissional/app.js','cliente/app.js','core/demo-store.js','assets/rt-design-system.js']:
    r=subprocess.run(['node','--check',str(base/f)],capture_output=True,text=True)
    assert r.returncode==0,f'{f}: {r.stderr}'
print('QA V6 OK: 4 telas, links locais e recursos íntegros, navegação cruzada, design compartilhado, modo claro/escuro e JS válido.')
