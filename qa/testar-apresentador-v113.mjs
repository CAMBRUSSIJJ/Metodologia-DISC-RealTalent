#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const jsFiles=['assets/rt-presentation-library-v113.js','apresentacoes/visualizador.js',
 'apresentacoes/central.js','biblioteca/app.js','profissional/app.js'];
for(const p of jsFiles){assert.doesNotThrow(()=>new vm.Script(read(p),{filename:p}),p+' syntax');}
const library=read('biblioteca/app.js'),files=read('assets/rt-presentation-library-v113.js');
const professional=read('profissional/app.js'),viewer=read('apresentacoes/visualizador.js');
const html=read('apresentacoes/visualizador.html'),central=read('apresentacoes/central.html');
assert.match(library,/\['arquivos','▣','Meus arquivos'\]/);
assert.match(library,/▶ Apresentar/);
assert.match(library,/drawFiles\(root\)/);
assert.match(library,/presentationStore\.importFiles/);
assert.match(files,/MAX_BYTES=25\*1024\*1024/);
assert.match(files,/indexedDB\.open\(DB,1\)/);
assert.match(files,/application\/pdf/);
assert.match(files,/deleteFile\(fileId\)/);
assert.match(viewer,/getPage\(state\.page\)/);
for(const tool of ['laser','pen','marker','eraser'])assert.match(html,new RegExp('data-tool="'+tool+'"'));
for(const feature of ['fullscreen','notes','resources','zoom-in','zoom-out','clock'])assert.match(html,new RegExp('id="'+feature+'"'));
assert.match(professional,/apresentacoes\/central\.html/);
assert.match(professional,/view=arquivos/);
assert.match(central,/Materiais favoritos/);
assert.doesNotMatch(central,/new-deck/);
console.log('RealTalent V11.3: estrutura, sintaxe, importação e rotas verificadas.');
