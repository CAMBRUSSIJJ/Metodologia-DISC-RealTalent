#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
for(const file of ['profissional/app.js','assets/rt-v116-custom-tools.js','assets/rt-v911-toolkit.js','core/demo-store.js'])
 assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}));
const professional=read('profissional/app.js'),html=read('profissional/index.html');
const css=read('assets/rt-v116-professional-ux.css');
assert.match(professional,/\['kit','Kit da sessão'\]/);
assert.doesNotMatch(professional,/\['kit','Kit de atendimento'\]/);
assert.doesNotMatch(professional,/ws94Panel\('Como funciona'/);
assert.match(professional,/rt-v116-activities/);
assert.match(professional,/contextProgramId:pid/);
assert.match(professional,/case 'new-custom-tool':/);
assert.match(professional,/case 'assign-custom-tool':/);
assert.match(professional,/case 'review-action':/);
assert.match(professional,/function actionExtra\(/);
assert.match(professional,/function actionHistory\(/);
assert.match(professional,/reviewOn/);
assert.match(professional,/rt-v116-progress-track/);
assert.match(professional,/rt-v116-priority/);
assert.match(professional,/rt-v116-action-summary/);
assert.match(html,/rt-v116-custom-tools\.js/);
assert.match(html,/rt-v116-professional-ux\.css/);
assert.match(css,/\.rt-v116-activities/);
const memory=new Map(),localStorage={
 getItem:key=>memory.get(key)||null,
 setItem:(key,value)=>memory.set(key,String(value)),
 removeItem:key=>memory.delete(key)
};
const context={window:{},localStorage,console,Date,crypto:{randomUUID:()=>String(Date.now())}};
vm.runInNewContext(read('assets/rt-v116-custom-tools.js'),context);
const T=context.window.RTCustomTools;
assert.equal(T.list().length,0);
const tool=T.upsert({title:'Perguntas para feedback',category:'Coaching',
 purpose:'Simulação fictícia',instructions:'Converse sobre o contexto e identifique ações observáveis.'});
assert.equal(T.list().length,1);
assert.equal(T.list()[0].id,tool.id);
T.upsert({title:'Roteiro atualizado',instructions:'Explore pontos concretos para discussão.'},tool.id);
assert.equal(T.list()[0].title,'Roteiro atualizado');
assert.equal(T.remove(tool.id),true);
assert.equal(T.list().length,0);
vm.runInNewContext(read('core/demo-store.js'),context);
const S=context.window.RTDemoStore,db=S.seed();
db.actions[0].internalNotes='NOTAS INTERNAS PRIVADAS';
db.actions[0].reviewOn='2026-10-29';
db.actions[0].history=[{text:'REVISÃO INTERNA'}];
db.actions[0].progress=50;
db.actions[0].priority='alta';
const client=JSON.stringify(S.clientView(db,'c1'));
for(const secret of ['NOTAS INTERNAS PRIVADAS','REVISÃO INTERNA','reviewOn'])
 assert.ok(!client.includes(secret),'Não vazar '+secret);
assert.ok(client.includes('"progress":50'));
console.log('V11.6 QA: ferramentas próprias, kit contextual, plano operacional, CSS e privacidade OK.');
