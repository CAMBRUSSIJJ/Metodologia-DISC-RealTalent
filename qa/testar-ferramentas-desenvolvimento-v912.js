/* QA V9.12 — testes estruturais com dados sintéticos, sem rede nem acesso a clientes reais.
   Executar: node qa/testar-ferramentas-desenvolvimento-v912.js */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const data=new Map(),storage={
 getItem:key=>data.get(key)??null,
 setItem:(key,value)=>data.set(key,String(value)),
 removeItem:key=>data.delete(key),
 get length(){return data.size},
 key:i=>[...data.keys()][i]??null
};
const box={window:{},localStorage:storage,Date,console};
vm.runInNewContext(read('core/demo-store.js'),box,{filename:'core/demo-store.js'});
vm.runInNewContext(read('assets/rt-v912-development.js'),box,{filename:'assets/rt-v912-development.js'});
new Function(read('profissional/app.js'));
const store=box.window.RTDemoStore,tools=box.window.RTDevelopmentToolkit,d=store.seed();
assert.equal(store.VERSION,11,'Migração mantém compatibilidade com V9.10/V9.11.');
const prior=store.seed();delete prior.wheelAssessments;
assert.equal(store.upgrade(prior).wheelAssessments.length,0,'Migração preserva dados anteriores.');
const areas=tools.defaultAreas.map((name,i)=>({name,score:i}));
assert.equal(store.createWheelSnapshot(d,'unknown',{date:'2026-10-23',areas}),null);
assert.equal(store.createWheelSnapshot(d,'p1',{date:'2026-02-30',areas}),null);
assert.equal(store.createWheelSnapshot(d,'p1',{date:'2026-10-23',areas:[...areas,{name:areas[0].name,score:1}]}),null,'Rejeitar dimensões duplicadas.');
assert.equal(store.createWheelSnapshot(d,'p1',{date:'2026-10-23',areas:areas.map(x=>({...x,score:11}))}),null,'Rejeitar notas fora de 0–10.');
const s1=store.createWheelSnapshot(d,'p1',{date:'2026-10-10',areas,note:'Registro fictício inicial'});
const s2=store.createWheelSnapshot(d,'p1',{date:'2026-10-23',areas:areas.map(x=>({...x,score:10-x.score}))});
assert.ok(s1&&s2);
const input={goalId:'goal-p1',what:'Praticar uma conversa fictícia',why:'Desenvolver comunicação',where:'Reunião demonstrativa',when:'2026-11-10',who:'Pessoa fictícia',how:'Preparar e praticar perguntas',howMuch:'Sem custo'};
const act=store.upsertFiveWTwoH(d,'p1',input);
assert.ok(act&&act.visibility==='privado'&&act.status==='pendente');
assert.equal(store.upsertFiveWTwoH(d,'p1',{...input,goalId:'goal-p2'}),null);
assert.equal(store.upsertFiveWTwoH(d,'p2',{...input,goalId:'goal-p2'},act.id),null);
assert.equal(store.upsertFiveWTwoH(d,'p1',{...input,when:'2026-02-30'}),null);
assert.equal(store.upsertFiveWTwoH(d,'p1',{...input,what:'Praticar outra conversa'},act.id).id,act.id);
assert.equal(d.actions.filter(x=>x.id===act.id).length,1,'Atualizar sem criar segunda ação');
const another=store.upsertFiveWTwoH(d,'p2',{...input,goalId:'goal-p2',what:'SEGREDO_DO_PROCESSO_P2'});
assert.ok(another);
store.save(d);
const loaded=store.load();
assert.equal(loaded.wheelAssessments.length,2);
assert.equal(loaded.actions.find(x=>x.id===act.id).fiveWTwoH.why,'Desenvolver comunicação');
assert.equal(store.clientView(loaded,'c1').actions.some(x=>x.id===act.id),false,'Nova ação é privada');
assert.equal(Object.hasOwn(store.clientView(loaded,'c1'),'wheelAssessments'),false);
loaded.actions.find(x=>x.id===act.id).visibility='compartilhado';
const shared=store.clientView(loaded,'c1').actions.find(x=>x.id===act.id);
assert.ok(shared);
assert.equal(Object.hasOwn(shared,'fiveWTwoH'),false,'Dados internos não podem vazar para a Minha Jornada');
assert.equal(store.clientView(loaded,'c2').actions.some(x=>x.id===act.id),false);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ctx={esc,dateFmt:s=>s,wsUrl:(id,tab,pid)=>'#cliente='+id+'&tab='+tab+'&program='+pid,today:()=> '2026-10-23'};
const wheelHTML=tools.renderWheel(loaded,'p1',ctx);
const matrixHTML=tools.renderFive(loaded,'p1',act.id,ctx);
assert.match(wheelHTML,/Roda da Vida/);
assert.match(wheelHTML,/name="score-0"/);
assert.match(wheelHTML,/Histórico deste processo/);
assert.match(matrixHTML,/Matriz 5W2H/);
assert.match(matrixHTML,/Praticar outra conversa/);
assert.ok(!matrixHTML.includes('SEGREDO_DO_PROCESSO_P2'),'Não misturar ações de outros processos');
loaded.wheelAssessments.push({id:'test-xss',programId:'p1',date:'2026-10-24',areas,note:'<img src=x onerror=alert(1)>',createdAt:'2026-10-24T10:00:00Z'});
const injected=tools.renderWheel(loaded,'p1',ctx);
assert.ok(injected.includes('&lt;img src=x onerror=alert(1)&gt;'));
assert.equal(store.deleteWheelSnapshot(loaded,s2.id,'p2'),false);
assert.equal(store.deleteWheelSnapshot(loaded,s2.id,'p1'),true);
assert.match(tools.renderWheel({...loaded,programs:[],clients:[]},'',ctx),/crie um processo/);
const html=read('profissional/index.html');
for(const asset of ['rt-v912-development.js','rt-v912-development.css'])assert.ok(html.includes(asset));
console.log('QA V9.12 OK — sintaxe, migração, contexto, snapshots, 5W2H, isolamento, privacidade, escaping, exclusão e navegação.');
