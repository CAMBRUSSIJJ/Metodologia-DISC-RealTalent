/* V11.6 — modelos de ferramentas criados pelo profissional, DEMONSTRAÇÃO LOCAL.
   São roteiros educativos reutilizáveis; não constituem instrumentos validados. */
(function(root){
'use strict';
const KEY='rt-v116-custom-tools-demo',MAX=60;
const id=()=>root.crypto?.randomUUID?.()||'tool-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const trim=(s,n)=>String(s??'').trim().slice(0,n);
/* V11.7 — campos personalizáveis, contrato único entre editor, atribuição e respostas. */
const TYPES=['curta','paragrafo','unica','multipla','escala'];
function normalizeSections(input,strict=false){
 if(!Array.isArray(input)||!input.length){if(strict)throw Error('Crie pelo menos uma seção.');return [];}
 if(input.length>8)throw Error('Máximo de oito seções por ferramenta.');
 let count=0;
 const ids=new Set();
 return input.map((section,index)=>{
  const title=trim(section?.title,90),questions=Array.isArray(section?.questions)?section.questions:[];
  if((strict&&!title)||!questions.length||questions.length>12)throw Error('Cada seção precisa de título e de uma a doze perguntas.');
  count+=questions.length;if(count>40)throw Error('Máximo de quarenta perguntas por ferramenta.');
  const normalized=questions.map((q,position)=>{
   const label=trim(q?.label,180),type=TYPES.includes(q?.type)?q.type:'paragrafo',
    questionId=trim(q?.id,120)||id();
   if(!label||ids.has(questionId))throw Error('As perguntas precisam de texto e identificadores únicos.');
   ids.add(questionId);
   const choices=(type==='unica'||type==='multipla')?
    String(Array.isArray(q?.options)?q.options.join('\\n'):q?.options||'').split(/\\r?\\n/).map(x=>trim(x,90)).filter(Boolean):[];
   if((type==='unica'||type==='multipla')&&(choices.length<2||choices.length>8||new Set(choices).size!==choices.length))
    throw Error('Perguntas de escolha precisam de 2 a 8 opções diferentes.');
   return {id:questionId,label,type,required:q?.required!==false,options:choices};
  });
  return {id:trim(section?.id,120)||id(),title:title||'Seção '+(index+1),
   description:trim(section?.description,280),questions:normalized};
 });
}
function list(){
 try{const values=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(values)?
 values.filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string').slice(0,MAX).map(x=>({
  id:trim(x.id,120),title:trim(x.title,110),category:trim(x.category,60)||'Reflexão guiada',
  purpose:trim(x.purpose,260),instructions:trim(x.instructions,1800),
  sections:(()=>{try{return normalizeSections(x.sections||[]);}catch{return [];}})(),updatedAt:x.updatedAt||x.createdAt||'',createdAt:x.createdAt||''
 })):[];}catch{return [];}
}
function upsert(input,toolId=''){
 const all=list(),title=trim(input?.title,110),instructions=trim(input?.instructions,1800);
 if(title.length<4||instructions.length<8)throw Error('Informe um nome e orientações para a ferramenta.');
 const existing=all.find(x=>x.id===toolId),time=new Date().toISOString();
 if(!existing&&all.length>=MAX)throw Error('Limite demonstrativo de 60 ferramentas.');
 const sections=normalizeSections(input?.sections===undefined?(existing?.sections||[]):input.sections,Array.isArray(input?.sections)&&input.sections.length>0);
 const item={id:existing?.id||id(),title,category:trim(input.category,60)||'Reflexão guiada',
  purpose:trim(input.purpose,260),instructions,sections,createdAt:existing?.createdAt||time,updatedAt:time};
 localStorage.setItem(KEY,JSON.stringify(existing?all.map(x=>x.id===item.id?item:x):[item,...all]));
 return item;
}
function remove(toolId){
 const all=list();if(!all.some(x=>x.id===toolId))return false;
 localStorage.setItem(KEY,JSON.stringify(all.filter(x=>x.id!==toolId)));return true;
}
root.RTCustomTools=Object.freeze({list,upsert,remove,normalizeSections,TYPES});
})(window);
