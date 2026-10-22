from pathlib import Path
from html.parser import HTMLParser
root=Path(__file__).parent
class Parser(HTMLParser):
    def __init__(self):super().__init__();self.links=[];self.ids=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag in ['link','script','a'] and (d.get('href') or d.get('src')):
            self.links.append(d.get('href') or d.get('src'))
        if 'id' in d:self.ids.append(d['id'])
for file in ['acesso.html','cliente/index.html','profissional/index.html']:
    p=Parser();p.feed((root/file).read_text());assert len(p.ids)==len(set(p.ids)),file
    for uri in p.links:
        if uri.startswith(('http','#','mailto:','tel:')):continue
        assert (root/file).parent.joinpath(uri.split('#')[0].split('?')[0]).exists(),(file,uri)
professional=(root/'profissional/app.js').read_text()
client=(root/'cliente/app.js').read_text()
store=(root/'core/demo-store.js').read_text()
for term in ['new-instrument','review-instrument','instrumentEntries','toggle-instrument','showInstruments','freshId']:
    assert term in professional,term
for term in ['instrumentos(v)','respond-instrument','submitInstrument','rt-next-hero','instrument-form']:
    assert term in client,term
for term in ['submitInstrument','visibility===\'compartilhado\'','upgrade(raw)','const VERSION = 7']:
    assert term in store,term
assert '<dialog id="instrument-dialog"' in (root/'cliente/index.html').read_text()
assert 'tab-content-mapeamento' in (root/'index.html').read_text()
assert (root/'assets/rt-v7-workspace.css').exists()
print('QA integração V7 OK: links, formulários e rotas, instrumentos/cliente, módulos originais.')
