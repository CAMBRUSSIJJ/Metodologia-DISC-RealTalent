/* QA RealTalent V9.13 — Banco de perguntas e Temporizador, apenas dados fictícios.
 * Executar: node qa/testar-perguntas-temporizador-v913.js */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(dir,p),'utf8');
const local=new Map(),memory=new Map();
const localStorage={getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,String(v)),removeItem:k=>local.delete(k),
 get length(){return local.size},key:i=>[...local.keys()][i]??null};
const sessionStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
const sandbox={window:{sessionStorage},localStorage,Date,URLSearchParams,console};
vm.runInNewContext(read('core/demo-store.js'),sandbox,{filename:'demo-store.js'});
vm.runInNewContext(read('assets/rt-v913-session-assist.js'),sandbox,{filename:'rt-v913-session-assist.js'});
new Function(read('profissional/app.js'));
const store=sandbox.window.RTDemoStore,app=sandbox.window.RTSessionAssist,db=store.seed();
assert.equal(store.VERSION,11,'Maintain backward schema');
assert.equal(app.questions.length,30,'Thirty curated questions');
assert.equal(new Set(app.questions.map(q=>q.id)).size,30,'Unique question IDs');
const ids=[app.questions[0].id,app.questions[7].id,app.questions[20].id];
assert.equal(store.setSessionQuestionIds(db,'s1',ids),true,'Save session selection');
assert.equal(store.setSessionQuestionIds(db,'s-unknown',ids),false,'Unknown session rejected');
assert.equal(store.setSessionQuestionIds(db,'s1',[ids[0],ids[0]]),false,'Duplicate blocked');
assert.equal(store.setSessionQuestionIds(db,'s1',Array(13).fill(1).map((x,i)=>'cq-'+i)),false,'Selection cap');
assert.equal(store.setSessionQuestionIds(db,'s1',['<script>alert(1)</script>']),false,'Invalid ids');
store.save(db);
const loaded=store.load(),selected=loaded.sessions.find(x=>x.id==='s1');
assert.deepEqual(Array.from(selected.coachingQuestionIds),ids,'Selection persists');
assert.equal(store.clientView(loaded,'c1').sessions.some(s=>Object.hasOwn(s,'coachingQuestionIds')),false,'Selection must remain private');
assert.equal(store.clientView(loaded,'c1').sessions.some(s=>Object.hasOwn(s,'timerPlan')),false,'Plan must remain private');
assert.equal(store.clientView(loaded,'c2').sessions.some(s=>s.id==='s1'),false,'Client isolation');
const legacy=store.seed();legacy.sessions.forEach(s=>{delete s.timerPlan;delete s.coachingQuestionIds});
const migr=store.upgrade(legacy);
assert.equal(migr.sessions[0].timerPlan.length,4,'V9.12 session migration');
assert.equal(migr.sessions[0].coachingQuestionIds.length,0,'Default no selected questions');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ctx={esc,dateFmt:v=>v,today:()=>'2026-10-23',wsUrl:(id,tab,pid,extra)=>'#cliente='+id+'&tab='+tab+'&program='+pid+'&'+extra};
const html=app.renderQuestions(loaded,'s1','objetivo',ctx);
assert.match(html,/Banco de Perguntas de Coaching/);
assert.match(html,/Adicionar à sessão/);
assert.match(html,/Roteiro selecionado para a sessão/);
assert.ok(!html.includes('Cliente demonstrativo 02 · Desenvolvimento'),'No unrelated process content');
assert.match(app.renderQuestions(loaded,'s1','selecionadas',ctx),/cq-01/);
assert.equal(app.renderQuestions({...loaded,programs:[],sessions:[]},'', 'todas',ctx).includes('Cadastre uma sessão'),true);
const timer=app.renderTimer(loaded,'s1',ctx);
assert.match(timer,/Temporizador de Sessão/);
assert.match(timer,/Configurar etapas/);
assert.match(timer,/05:00/);
assert.ok(!app.timerCommand(selected,'pause',1000),'Cannot pause stopped clock');
assert.equal(app.timerCommand(selected,'start',1000),true,'Start clock');
assert.equal(app.snapshot(selected,61_000).remainingMs,240_000,'Elapsed time accounts for 60 seconds'); // catches deadline calculation
assert.equal(app.timerCommand(selected,'pause',61_000),true);
assert.equal(app.snapshot(selected,121_000).remainingMs,240_000,'Paused time remains frozen');
assert.equal(app.timerCommand(selected,'start',121_000),true,'Resume');
assert.equal(app.snapshot(selected,360_999).remainingMs,1,'Resuming preserves remaining');
assert.equal(app.snapshot(selected,400_000).remainingMs,0,'Timer expires at zero');
assert.equal(app.timerCommand(selected,'start',400_000),false,'Zero clock cannot restart');
assert.equal(app.timerCommand(selected,'next',400_000),true,'Manual next');
assert.equal(app.snapshot(selected,400_000).index,1,'Moved to exploration');
assert.equal(app.snapshot(selected,400_000).remainingMs,25*60*1000,'Next stage duration');
assert.equal(app.timerCommand(selected,'previous',400_000),true,'Manual previous');
assert.equal(app.timerCommand(selected,'reset',400_000),true,'Reset');
assert.equal(app.snapshot(selected,400_000).remainingMs,5*60*1000);
assert.equal(store.setSessionTimerPlan(loaded,'s1',[
 {id:'abertura',label:'Acolhimento',minutes:10},
 {id:'exploracao',label:'Conversa',minutes:30},
 {id:'pratica',label:'Exercício',minutes:20},
 {id:'fechamento',label:'Acordos',minutes:10}
]),true,'Custom plan');
assert.equal(store.setSessionTimerPlan(loaded,'s1',[
 {id:'abertura',label:'Acolhimento',minutes:95},
 {id:'exploracao',label:'Conversa',minutes:30},
 {id:'pratica',label:'Exercício',minutes:20},
 {id:'fechamento',label:'Acordos',minutes:10}
]),false,'Invalid 95 minute stage');
assert.equal(store.setSessionTimerPlan(loaded,'s1',[{id:'abertura',label:'Only one',minutes:2}]),false,'Four stages needed');
assert.equal(app.snapshot(selected,500_000).remainingMs,600_000,'Plan change resets stale runtime');
assert.equal(store.setSessionQuestionIds(loaded,'s2',[app.questions[1].id]),true);
assert.ok(!store.clientView(loaded,'c2').sessions.some(s=>Object.hasOwn(s,'coachingQuestionIds')));
assert.ok(!loaded.sessions.find(s=>s.id==='s1').coachingQuestionIds.includes(app.questions[1].id),'Sessions isolated');
const payload=app.renderQuestions(loaded,'s1','todas',ctx);
assert.ok(!payload.includes('<img onerror=alert(1)>'),'Questions from curated immutable library');
assert.ok(read('profissional/index.html').includes('rt-v913-session-assist.js'));
assert.ok(read('profissional/index.html').includes('rt-v913-session-assist.css'));
assert.ok(read('profissional/app.js').includes('RTDemoStore.setSessionQuestionIds(db,s.id,next)'));
console.log('V9.13 QA OK — perguntas, migração, privacidade, seleção, tempo real, pausa, avanço e configuração.');
