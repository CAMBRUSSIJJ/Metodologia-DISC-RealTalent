/* V7 core regression tests. Demo-only isolation checks, NOT server authorization. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const mem=new Map();
const store={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)};
const ctx={window:{},localStorage:store,Date,Math,crypto:require('node:crypto').webcrypto};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname+'/core/demo-store.js','utf8'),ctx,{filename:'demo-store.js'});
const S=ctx.window.RTDemoStore;let d=S.load();assert.equal(d.version,7);
// No implicit sharing of records missing visibility, including legacy payloads
const a={id:'a-unknown',programId:'p1',title:'Only professional',status:'pendente'};
d.actions.push(a);d.sessions.push({id:'s-unknown',programId:'p1',focus:'Restricted',status:'agendada'});
d.guidance.push({id:'g-unknown',programId:'p1',text:'private'});
assert(!S.clientView(d,'c1').actions.some(x=>x.id==='a-unknown'));
assert(!S.clientView(d,'c1').sessions.some(x=>x.id==='s-unknown'));
assert(!S.clientView(d,'c1').guidance.some(x=>x.id==='g-unknown'));
assert(!S.clientView(d,'c2').instruments.some(x=>x.id==='i-seed-1'));
const instrument=d.instruments[0];
assert.equal(S.submitInstrument(d,'c2',instrument.id,['q','r','s']),false,'other client cannot submit');
assert.equal(S.submitInstrument(d,'c1',instrument.id,['','','']),false,'reject blank response');
assert.equal(S.submitInstrument(d,'c1',instrument.id,['Uma reunião imaginária','Fiquei em dúvida','Tentar perguntar primeiro']),true);
assert.equal(instrument.status,'respondido');
assert.equal(S.submitInstrument(d,'c1',instrument.id,['resubmit','resubmit','resubmit']),false,'no resubmission');
instrument.feedback='Orientação profissional não liberada';
assert.equal(S.clientView(d,'c1').instruments[0].feedback,'');
instrument.feedbackVisibility='compartilhado';
assert.equal(S.clientView(d,'c1').instruments[0].feedback,instrument.feedback);
instrument.visibility='privado';assert.equal(S.clientView(d,'c1').instruments.length,0);
// Upgrade from V5: all undefined visibility must default to private
const old=JSON.parse(JSON.stringify(d));old.version=5;delete old.instruments;
old.actions[0].visibility=undefined;old.sessions[0].visibility=undefined;old.guidance[0].visibility=undefined;
const migrated=S.upgrade(old);assert.equal(migrated.version,7);
assert.equal(migrated.actions[0].visibility,'privado');assert.equal(migrated.sessions[0].visibility,'privado');
assert.equal(migrated.guidance[0].visibility,'privado');assert(Array.isArray(migrated.instruments));
// UUIDs persist across fresh contexts; no counter reset collisions
const ids=new Set();for(let i=0;i<500;i++){let x=S.freshId('c');assert(!ids.has(x));ids.add(x)}
S.save(d);assert.equal(S.load().instruments[0].status,'respondido');
console.log('QA V7 OK: default deny, cross-client scoping, guided response/review, migration, UUID, persistence.');
