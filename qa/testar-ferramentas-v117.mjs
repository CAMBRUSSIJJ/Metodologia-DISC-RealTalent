#!/usr/bin/env node
/* V11.7 — contratos e limites em dados fictícios, independentes do navegador. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
for(const p of ['assets/rt-v116-custom-tools.js','assets/rt-v117-tool-builder.js','core/demo-store.js','profissional/app.js','cliente/app.js'])
 assert.doesNotThrow(()=>new vm.Script(read(p),{filename:p}));
let next=0;
const data=new Map(),localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
const box={window:{crypto:{randomUUID:()=>String(++next)}},localStorage,console,Date,Map,Set,Math,JSON};
vm.runInNewContext(read('assets/rt-v116-custom-tools.js'),box);
const T=box.window.RTCustomTools;
const schema=[{id:'s1',title:'Conversa educativa',questions:[
 {id:'q1',label:'Uma ideia?',type:'curta',required:true},
 {id:'q2',label:'Detalhe',type:'paragrafo',required:false},
 {id:'q3',label:'Alternativa',type:'unica',options:['A','B'],required:true},
 {id:'q4',label:'Práticas',type:'multipla',options:['Escuta','Acordo'],required:false},
 {id:'q5',label:'Avaliação de satisfação',type:'escala',required:true}
]}];
const tool=T.upsert({title:'Roteiro de comunicação',instructions:'Utilize somente exemplos fictícios.',sections:schema});
assert.equal(T.list().length,1);
assert.equal(tool.sections[0].questions.length,5);
assert.throws(()=>T.normalizeSections([{title:'Falha',questions:[{id:'x',label:'Escolha',type:'unica',options:['Igual','Igual']}]}],true));
vm.runInNewContext(read('core/demo-store.js'),box);
const S=box.window.RTDemoStore,db=S.seed();
const assigned=S.assignCustomForm(db,{programId:'p1',goalId:'goal-p1',title:tool.title,
 sections:tool.sections,toolId:tool.id,visibility:'compartilhado'});
assert.ok(assigned);
assert.equal(assigned.kind,'formulario-personalizado');
T.upsert({title:'Roteiro de comunicação editado',instructions:'Novas orientações fictícias.',
 sections:[{id:'s1',title:'Outra seção',questions:[{id:'q6',label:'Outra pergunta',type:'curta'}]}]},tool.id);
assert.equal(assigned.sections[0].questions.length,5,'atribuição deve ter snapshot imutável');
assert.equal(assigned.sections[0].questions[0].id,'q1');
assert.equal(S.submitCustomForm(db,'c2',assigned.id,{q1:'X',q3:'A',q5:'4'}),false,'não atribuído ao cliente c2');
assert.equal(S.submitCustomForm(db,'c1',assigned.id,{q1:'X',q3:'inválida',q5:'4'}),false);
assert.equal(S.submitCustomForm(db,'c1',assigned.id,{q1:'X',q3:'A',q4:['Outro'],q5:'4'}),false);
assert.equal(S.submitCustomForm(db,'c1',assigned.id,{q1:'X',q3:'A',q5:'7'}),false);
assert.equal(S.submitCustomForm(db,'c1',assigned.id,{q1:'X',q3:'A',q5:'4',extra:'Dado'}),false);
assert.equal(S.submitCustomForm(db,'c1',assigned.id,{q1:'Exemplo ilustrativo',q2:'',q3:'A',q4:['Escuta'],q5:'4'}),true);
assert.equal(assigned.status,'respondido');
assert.equal(assigned.responses.length,5);
assert.equal(S.submitCustomForm(db,'c1',assigned.id,{q1:'Outro',q3:'B',q5:'1'}),false,'não permitir duplo envio');
assert.equal(S.reviewGuidedActivity(db,assigned.id,'Devolutiva profissional interna.','privado'),true);
assert.equal(S.clientView(db,'c1').instruments.find(i=>i.id===assigned.id).feedback,'','devolutiva não liberada');
assert.equal(S.reviewGuidedActivity(db,assigned.id,'Orientação compartilhada.','compartilhado'),true);
assert.equal(S.clientView(db,'c1').instruments.find(i=>i.id===assigned.id).feedback,'Orientação compartilhada.');
assert.equal(S.submitInstrument(db,'c1','i-seed-1',['Situação','Resposta','Próxima ação']),true,'compatibilidade legada');
const pro=read('profissional/app.js'),client=read('cliente/app.js');
assert.match(pro,/RTToolBuilder\.render/);
assert.match(pro,/assignCustomForm/);
assert.match(pro,/activityResponses\(t\)/);
assert.match(client,/customFields\(i\)/);
assert.match(client,/submitCustomForm/);
assert.match(read('cliente/index.html'),/id="instrument-fields"/);
assert.match(read('profissional/index.html'),/rt-v117-tool-builder\.js/);
assert.match(read('profissional/index.html'),/rt-v117-custom-forms\.css/);
console.log('V11.7 QA OK: 5 tipos, snapshot, autorização demonstrativa, validação, revisão e legados.');
