/* V11.1 — contratos de vínculo, materiais publicados e privacidade. Fictício. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const mem=new Map(),localStorage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k),key:i=>[...mem.keys()][i]||null,get length(){return mem.size}};
const ctx={window:{},Date,localStorage,console};
vm.runInNewContext(read('core/demo-store.js'),ctx);
for(const p of ['apresentacoes/studio.js','profissional/app.js','cliente/app.js'])new Function(read(p));
const S=ctx.window.RTDemoStore,d=S.seed();
assert.ok(Array.isArray(d.presentationLinks)&&d.presentationLinks.length===0);
const old=S.seed();delete old.presentationLinks;assert.deepEqual(S.upgrade(old).presentationLinks,[]);
const link=S.linkPresentationToSession(d,'s1','demo-deck-v11-1','Roteiro fictício para sessão');
assert.ok(link&&link.programId==='p1'&&link.visibility==='privado');
assert.equal(S.linkPresentationToSession(d,'s1','demo-deck-v11-1','Roteiro ajustado').id,link.id);
assert.equal(S.linkPresentationToSession(d,'nao-existe','demo-deck-v11-1','Outro título'),null);
assert.equal(S.clientView(d,'c1').presentationMaterials.length,0);
const samples=[
 {kind:'cover',title:'Slide autorizado',body:'Texto fictício',notes:'NOTA ESTRITAMENTE PRIVADA',secret:'INTERNO'},
 {kind:'document',title:'PDF privado',fileId:'arquivo-interno',fileName:'segredo.pdf',body:'NUNCA ENVIAR'},
 {kind:'tool',title:'Ferramenta dinâmica privada',body:'Não enviar ferramenta'},
 {kind:'library',title:'Biblioteca autorizada',subtitle:'Conteúdo editorial',body:'Um exemplo educativo'},
];
assert.equal(S.publishPresentationSlides(d,link.id,samples),true);
assert.equal(d.presentationLinks[0].slides.length,2);
const v=S.clientView(d,'c1');
assert.equal(v.presentationMaterials.length,1);
assert.equal(v.presentationMaterials[0].slides.length,2);
assert.equal(v.presentationMaterials[0].slides[0].title,'Slide autorizado');
const payload=JSON.stringify(v);
for(const forbidden of ['NOTA ESTRITAMENTE PRIVADA','segredo.pdf','arquivo-interno','INTERNO','NUNCA ENVIAR'])
 assert.ok(!payload.includes(forbidden),'Não pode vazar '+forbidden);
assert.equal(S.clientView(d,'c2').presentationMaterials.length,0);
const a=S.createSessionAgreement(d,'s1',{goalId:'goal-p1',title:'Acordo fictício surgido durante apresentação',due:'2026-11-12'});
assert.ok(a&&a.sessionId==='s1'&&a.programId==='p1'&&a.goalId==='goal-p1'&&a.visibility==='privado');
assert.equal(S.clientView(d,'c1').actions.some(x=>x.id===a.id),false);
assert.equal(S.createSessionAgreement(d,'s1',{goalId:'goal-p2',title:'Acordo cruzado',due:'2026-11-12'}),null);
assert.equal(S.withdrawPresentation(d,link.id),true);
assert.equal(S.clientView(d,'c1').presentationMaterials.length,0);
assert.equal(S.publishPresentationSlides(d,link.id,samples),true);
d.sessions.find(s=>s.id==='s1').visibility='privado';
assert.equal(S.clientView(d,'c1').presentationMaterials.length,0);
S.save(d);assert.equal(S.load().presentationLinks[0].visibility,'privado');
assert.equal(S.unlinkPresentation(d,link.id),true);
assert.equal(d.presentationLinks.length,0);
assert.match(read('profissional/app.js'),/function rt111SessionPresentations/);
assert.match(read('cliente/app.js'),/function materiais\(v\)/);
assert.match(read('apresentacoes/index.html'),/id="presentation-session"/);
assert.match(read('apresentacoes/index.html'),/id="publish-slides-btn"/);
assert.match(read('apresentacoes/studio.js'),/function createCommitment/);
console.log('V11.1 contratos aprovados — vínculo, isolamento, slides sanitizados, revogação e compromisso existente.');
