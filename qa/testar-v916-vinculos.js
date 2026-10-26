/* QA V9.16 — contratos dos objetivos, com dados fictícios. */
'use strict';
const {readFileSync}=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>readFileSync(path.join(__dirname,'..',p),'utf8');
const mem=new Map(),localStorage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k),key:i=>[...mem.keys()][i]||null,get length(){return mem.size}};
const context={window:{},localStorage,Date,console};vm.runInNewContext(read('core/demo-store.js'),context);
new Function(read('profissional/app.js'));
const store=context.window.RTDemoStore,d=store.seed();
assert.equal(store.updateGoal(d,'goal-p1','Objetivo fictício de comunicação revisado'),true);
assert.equal(d.goals.find(g=>g.id==='goal-p1').title,'Objetivo fictício de comunicação revisado');
assert.equal(store.updateGoal(d,'goal-p1','x'),false);
assert.equal(store.updateGoal(d,'goal-p1','<img src=x onerror=alert(1)>'),true);
assert.equal(d.actions.find(a=>a.id==='a1').goalId,'goal-p1','Editar título não altera vínculo');
assert.equal(store.linkActionGoal(d,'a1','goal-p2'),false,'Bloquear vínculo entre processos');
d.programs.find(p=>p.id==='p1').status='finalizado';
assert.equal(store.updateGoal(d,'goal-p1','Processo encerrado'),false);
console.log('V9.16 QA estrutural OK — sintaxe, edição, IDs estáveis e isolamento entre processos.');
