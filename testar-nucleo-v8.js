/* V8 test: logic-only demonstration; never a security test. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const mem=new Map();
const localStorage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)};
const ctx={window:{},localStorage,Date,Math,crypto:require('node:crypto').webcrypto};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname+'/core/demo-store.js','utf8'),ctx,{filename:'demo-store.js'});
const S=ctx.window.RTDemoStore;
let db=S.load();
assert.equal(S.VERSION,9);
assert.equal(db.version,9);
assert(Array.isArray(db.discLinks));
assert.equal(db.discLinks.length,0);
const idSet=new Set();for(let i=0;i<300;i++){const id=S.freshId('test');assert(!idSet.has(id));idSet.add(id)}
// Deny-by-default: internal content is never exposed by clientView.
db.actions.push({id:'private-test',programId:'p1',title:'internal item',status:'pendente'});
db.sessions.push({id:'private-session',programId:'p1',focus:'private topic',status:'agendada'});
assert(!S.clientView(db,'c1').actions.some(a=>a.id==='private-test'));
assert(!S.clientView(db,'c1').sessions.some(s=>s.id==='private-session'));
assert(!S.clientView(db,'c2').instruments.some(i=>i.id==='i-seed-1'));
// Guided reflections under the correct client only.
const inst=db.instruments[0];
assert.equal(S.submitInstrument(db,'c2',inst.id,['a','b','c']),false);
assert.equal(S.submitInstrument(db,'c1',inst.id,['a','b','c']),true);
inst.feedback='private feedback';
assert.equal(S.clientView(db,'c1').instruments[0].feedback,'');
inst.feedbackVisibility='compartilhado';
assert.equal(S.clientView(db,'c1').instruments[0].feedback,'private feedback');
// Map instrument results ONLY after manual association; no name/email is persisted into linked scores.
const payload={programId:'p1',ts:Date.now(),scores:{D:4,I:7,S:6,C:5}};
assert.equal(S.addDiscLink(db,payload),true);
assert.equal(db.discLinks.length,1);
assert.equal(db.discLinks[0].visibility,'privado');
assert.equal(db.discLinks[0].clientId,'c1');
assert.deepEqual(Object.keys(db.discLinks[0].scores).sort(),['C','D','I','S']);
assert(!('name' in db.discLinks[0]));
assert.equal(S.addDiscLink(db,payload),false,'duplicates blocked');
assert.equal(S.addDiscLink(db,{...payload,programId:'not-found'}),false);
assert.equal(S.addDiscLink(db,{...payload,ts:Date.now()+1,scores:{D:'bad',I:3,S:4,C:5}}),false);
assert(!('discLinks' in S.clientView(db,'c1')));
// Restore V7/V5 local prototypes and deny unknown sharing.
for(const version of [5,7]){
 const old=JSON.parse(JSON.stringify(db));old.version=version;delete old.discLinks;
 if(version===5)delete old.instruments;
 old.actions[0].visibility=undefined;old.guidance[0].visibility=undefined;
 const upgraded=S.upgrade(old);
 assert.equal(upgraded.version,9);assert.equal(upgraded.discLinks.length,0);
 assert.equal(upgraded.actions[0].visibility,'privado');assert.equal(upgraded.guidance[0].visibility,'privado');
}
S.save(db);
assert.equal(S.load().discLinks.length,1);
console.log('V8 CORE OK — schema, V5/V7 upgrade, UUID, default deny, scoped reflections, private result association');
