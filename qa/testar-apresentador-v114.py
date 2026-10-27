"""RealTalent V11.4 — valida PDF 3 páginas, zoom, miniaturas, tinta e exportação.
O documento gerado neste teste é 100% fictício e não contém dados privados.
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright
import json
import threading

ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args): pass

def pdf_bytes():
    pages=3
    objs=[
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Count 3 /Kids [3 0 R 4 0 R 5 0 R] >>',
    ]
    for index in range(pages):
        objs.append(f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 9 0 R >> >> /Contents {6+index} 0 R >>'.encode())
    for index in range(pages):
        stream=f'BT /F1 24 Tf 60 720 Td (Pagina {index+1} - RealTalent QA) Tj ET\n'.encode()
        objs.append(b'<< /Length '+str(len(stream)).encode()+b' >>\nstream\n'+stream+b'endstream')
    objs.append(b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
    doc=b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'
    offsets=[0]
    for index,obj in enumerate(objs,1):
        offsets.append(len(doc))
        doc+=str(index).encode()+b' 0 obj\n'+obj+b'\nendobj\n'
    xref=len(doc)
    doc+=b'xref\n0 '+str(len(offsets)).encode()+b'\n0000000000 65535 f \n'
    for offset in offsets[1:]:
        doc+=f'{offset:010d} 00000 n \n'.encode()
    doc+=b'trailer\n<< /Size '+str(len(offsets)).encode()+b' /Root 1 0 R >>\nstartxref\n'+str(xref).encode()+b'\n%%EOF\n'
    return doc

def main():
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    origin=f'http://127.0.0.1:{server.server_port}'
    errors=[]
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-gpu'])
            context=browser.new_context(viewport={'width':1280,'height':720},accept_downloads=True)
            library=context.new_page()
            library.on('pageerror',lambda e:errors.append('biblioteca: '+str(e)))
            library.goto(origin+'/biblioteca/index.html?embedded=1#view=arquivos',wait_until='domcontentloaded')
            library.get_by_role('heading',name='Meus arquivos').wait_for()
            library.locator('.rt-v113-upload input[type=file]').set_input_files({
                'name':'apresentacao-teste.pdf','mimeType':'application/pdf','buffer':pdf_bytes()
            })
            library.locator('.rt-v113-file').first.wait_for()
            with library.expect_popup() as popup:
                library.get_by_role('button',name='▶ Apresentar').first.click()
            viewer=popup.value
            viewer.on('pageerror',lambda e:errors.append('apresentador: '+str(e)))
            viewer.wait_for_load_state('domcontentloaded')
            viewer.wait_for_function("document.querySelector('#page-info')?.textContent==='Página 1 de 3'",timeout=20000)
            viewer.locator('#document canvas.pdf-page').wait_for()
            print('OK 01 — PDF.js obtém o total de 3 páginas e renderiza a página 1',flush=True)
            viewer.locator('#thumbnail-toggle').click()
            assert viewer.locator('.thumb-item').count()==3
            viewer.locator('.thumb-item[data-page="3"]').click()
            viewer.wait_for_function("document.querySelector('#page-info')?.textContent==='Página 3 de 3'")
            assert viewer.locator('#next').is_disabled()
            viewer.locator('#prev').click()
            viewer.wait_for_function("document.querySelector('#page-info')?.textContent==='Página 2 de 3'")
            viewer.locator('#fit-width').click()
            assert viewer.locator('#zoom-value').inner_text().startswith('Largura')
            viewer.locator('#zoom-in').click()
            assert viewer.locator('#zoom-value').inner_text().endswith('110%')
            print('OK 02 — miniaturas, navegação, limites e zoom',flush=True)
            viewer.locator('#fit-page').click()
            viewer.locator('#thumbnail-toggle').click()
            viewer.locator('[data-tool="pen"]').click()
            ink=viewer.locator('#ink')
            b=ink.bounding_box()
            viewer.mouse.move(b['x']+b['width']*.35,b['y']+b['height']*.35)
            viewer.mouse.down()
            viewer.mouse.move(b['x']+b['width']*.55,b['y']+b['height']*.52,steps=8)
            viewer.mouse.up()
            assert viewer.locator('#undo-ink').is_enabled()
            viewer.locator('#next').click()
            viewer.wait_for_function("document.querySelector('#page-info')?.textContent==='Página 3 de 3'")
            assert viewer.locator('#undo-ink').is_disabled()
            viewer.locator('#prev').click()
            viewer.wait_for_function("document.querySelector('#page-info')?.textContent==='Página 2 de 3'")
            assert viewer.locator('#undo-ink').is_enabled()
            viewer.locator('#undo-ink').click()
            assert viewer.locator('#redo-ink').is_enabled()
            viewer.locator('#redo-ink').click()
            print('OK 03 — anotações preservadas por página, desfazer/refazer',flush=True)
            with viewer.expect_download() as download:
                viewer.locator('#export-ink').click()
            export=json.loads(Path(download.value.path()).read_text())
            assert export['format']=='realtalent-v11.4-marcacoes'
            assert [p['page'] for p in export['pages']]==[2]
            assert export['pages'][0]['strokes'][0]['tool']=='pen'
            print('OK 04 — exportação separada das marcações',flush=True)
            assert not errors, 'JavaScript: '+'; '.join(errors)
            browser.close()
    finally:
        server.shutdown()

if __name__=='__main__':
    main()
