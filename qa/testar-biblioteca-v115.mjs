#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const memory=new Map();
const storage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
const window={location:{href:'https://example.test/biblioteca/index.html'},localStorage:storage,crypto:{randomUUID:(()=>{let i=0;return()=>String(++i)})()}};
const context={window,localStorage:storage,URL,console,Date,Map,Set,Blob,Array,Math,Object,Promise,Error,Uint8Array,String};
vm.runInNewContext(read('assets/rt-presentation-library-v113.js'),context);
const S=window.RTPresentationLibrary;
assert.ok(S&&typeof S.createFolder==='function');
assert.equal(S.metadata().length,0);
assert.equal(S.settings().folders.length,0);
assert.equal(S.settings().mode,'grid');
storage.setItem('rt-presentation-library-v113',JSON.stringify([{
 id:'legacy-1',title:'Material legado',fileName:'teste.pdf',mime:'application/pdf',
 size:1100,createdAt:'2026-10-20',favorite:true
}]));
assert.equal(S.metadata()[0].folderId,'root');
assert.equal(S.metadata()[0].category,'Sem categoria');
assert.deepEqual(Array.from(S.metadata()[0].tags),[]);
const folder=S.createFolder('Ferramentas profissionais');
assert.equal(S.settings().folders.length,1);
assert.equal(S.settings().folders[0].name,'Ferramentas profissionais');
assert.equal(S.change('legacy-1',{folderId:folder.id,category:'DISC/ACER',tags:['Sessão','Sessão','Liderança']}),true);
assert.equal(S.metadata()[0].folderId,folder.id);
assert.equal(S.metadata()[0].category,'DISC/ACER');
assert.deepEqual(Array.from(S.metadata()[0].tags),['Sessão','Liderança']);
assert.throws(()=>S.createFolder('Ferramentas profissionais'),/Já existe/);
assert.throws(()=>S.change('legacy-1',{folderId:'fantasma'}),/Pasta inválida/);
S.renameFolder(folder.id,'Coaching');
assert.equal(S.settings().folders[0].name,'Coaching');
const category=S.addCategory('Acompanhamento');
assert.equal(category,'Acompanhamento');
const view=S.saveView('Favoritos de coaching',{
 folder:folder.id,category:'DISC/ACER',type:'pdf',favorite:true,query:'liderança',
 tag:'Liderança',sort:'name'
});
assert.equal(S.settings().views.length,1);
assert.equal(S.settings().views[0].filters.folder,folder.id);
S.setMode('list');assert.equal(S.settings().mode,'list');
const moved=S.removeFolder(folder.id);
assert.equal(moved,1);
assert.equal(S.metadata()[0].folderId,'root');
assert.equal(S.metadata()[0].favorite,true);
assert.equal(S.metadata()[0].category,'DISC/ACER');
assert.deepEqual(Array.from(S.metadata()[0].tags),['Sessão','Liderança']);
assert.equal(S.settings().views[0].filters.folder,'all');
S.deleteView(view.id);assert.equal(S.settings().views.length,0);
const app=read('biblioteca/app.js'),workspace=read('biblioteca/presentation-workspace-v115.js');
const html=read('biblioteca/index.html'),css=read('biblioteca/presentation-workspace-v115.css');
new vm.Script(app);new vm.Script(workspace);
assert.match(app,/RTPresentationWorkspace\.mount/);
assert.match(workspace,/function dropZone\(/);
assert.match(workspace,/function loadPdfLib\(/);
assert.match(workspace,/function showPreview\(/);
assert.match(workspace,/function saveCurrentView\(/);
assert.match(workspace,/function renderFilterBar\(/);
assert.match(workspace,/function fileDetails\(/);
assert.match(workspace,/function lazyPreview\(/);
assert.match(html,/presentation-workspace-v115\.js/);
assert.match(html,/presentation-workspace-v115\.css/);
assert.match(css,/\.rt-v115-grid\{/);
assert.doesNotMatch(workspace,/\.innerHTML\s*=/);
console.log('RealTalent V11.5: migração, pastas, filtros, visões, componentes e sintaxe OK.');
