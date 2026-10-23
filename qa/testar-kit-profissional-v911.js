/* QA estrutural V9.11; dados inteiramente fictícios. Execução: node qa/testar-kit-profissional-v911.js */
(function qaV911(){
 'use strict';
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
 const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
 const storageMap=new Map(),localStorage={
   getItem:key=>storageMap.has(key)?storageMap.get(key):null,
   setItem:(key,value)=>storageMap.set(key,String(value)),
   removeItem:key=>storageMap.delete(key),
   get length(){return storageMap.size;},
   key:index=>[...storageMap.keys()][index]??null
 };
 const sandbox={window:{},localStorage,Date,URLSearchParams,console};
 vm.runInNewContext(read('core/demo-store.js'),sandbox,{filename:'demo-store.js'});
 vm.runInNewContext(read('assets/rt-v911-toolkit.js'),sandbox,{filename:'rt-v911-toolkit.js'});
 new Function(read('profissional/app.js'));
 const store=sandbox.window.RTDemoStore,kit=sandbox.window.RTProfessionalKit;
 const db=store.seed();
 assert.equal(store.VERSION,11,'Backward-compatible demo schema');
 assert.equal(store.updateSessionPreparation(db,'s1',{
   goal:'<img src=x onerror=alert(1)> Objetivo',
   reality:'Situação atual',options:'Possibilidades',wayForward:'Acordos'
 }),true);
 assert.equal(store.updateSessionPreparation(db,'nonexistent',{goal:'Teste'}),false);
 assert.equal(store.updateSessionPreparation(db,'s1',null),false);
 assert.equal(store.save(db).sessions.find(s=>s.id==='s1').preparation.options,'Possibilidades');
 assert.equal(store.load().sessions.find(s=>s.id==='s1').preparation.wayForward,'Acordos');
 const v=store.clientView(db,'c1');
 assert.ok(v.sessions.find(s=>s.id==='s1'));
 assert.ok(!Object.hasOwn(v.sessions.find(s=>s.id==='s1'),'preparation'));
 assert.ok(!Object.hasOwn(v.sessions.find(s=>s.id==='s1'),'preparationUpdatedAt'));
 assert.equal(store.clientView(db,'c2').sessions.some(s=>s.id==='s1'),false);
 const long='X'.repeat(800);
 assert.equal(store.updateSessionPreparation(db,'s3',{goal:long}),true);
 assert.equal(store.save(db).sessions.find(s=>s.id==='s3').preparation.goal.length,650);
 const migrated=store.seed();migrated.version=10;
 assert.equal(store.upgrade(migrated).version,11);
 db.actions.push({id:'qa-wrong-scope',programId:'p2',title:'AÇÃO_DE_OUTRO_CLIENTE',due:'2026-10-01',status:'pendente',visibility:'privado'});
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ui={esc,dateFmt:s=>s,wsUrl:(id,tab,pid,extra)=>'#cliente='+id+'&tab='+tab+'&program='+pid+'&'+extra,today:()=>new Date().toISOString().slice(0,10)};
 const html=kit.render(db,'s1',ui);
 assert.match(html,/Roteiro GROW/);
 assert.match(html,/Compromissos para retomar/);
 assert.match(html,/name="sessionId" value="s1"/);
 assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
 assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
 assert.ok(!html.includes('AÇÃO_DE_OUTRO_CLIENTE'));
 assert.ok(html.includes('#cliente=c1'));
 assert.ok(kit.render(db,'s2',ui).includes('Cliente demonstrativo 02'));
 const empty=store.seed();empty.sessions=[];
 assert.match(kit.render(empty,'',ui),/Agende uma sessão/);
 const proHtml=read('profissional/index.html');
 assert.ok(proHtml.includes('rt-v911-toolkit.js')&&proHtml.includes('rt-v911-toolkit.css'));
 assert.ok(read('profissional/app.js').includes("RTDemoStore.updateSessionPreparation(db,sessionId,input)"));
 console.log('V9.11 QA OK — persistência GROW, privacidade, isolamento, migração, escapes, render, navegação e sintaxe.');
})();
