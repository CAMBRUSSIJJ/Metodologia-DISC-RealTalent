/* V11.6 — modelos de ferramentas criados pelo profissional, DEMONSTRAÇÃO LOCAL.
   São roteiros educativos reutilizáveis; não constituem instrumentos validados. */
(function(root){
'use strict';
const KEY='rt-v116-custom-tools-demo',MAX=60;
const id=()=>root.crypto?.randomUUID?.()||'tool-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const trim=(s,n)=>String(s??'').trim().slice(0,n);
function list(){
 try{const values=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(values)?
 values.filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string').slice(0,MAX).map(x=>({
  id:trim(x.id,120),title:trim(x.title,110),category:trim(x.category,60)||'Reflexão guiada',
  purpose:trim(x.purpose,260),instructions:trim(x.instructions,1800),
  updatedAt:x.updatedAt||x.createdAt||'',createdAt:x.createdAt||''
 })):[];}catch{return [];}
}
function upsert(input,toolId=''){
 const all=list(),title=trim(input?.title,110),instructions=trim(input?.instructions,1800);
 if(title.length<4||instructions.length<8)throw Error('Informe um nome e orientações para a ferramenta.');
 const existing=all.find(x=>x.id===toolId),time=new Date().toISOString();
 if(!existing&&all.length>=MAX)throw Error('Limite demonstrativo de 60 ferramentas.');
 const item={id:existing?.id||id(),title,category:trim(input.category,60)||'Reflexão guiada',
  purpose:trim(input.purpose,260),instructions,createdAt:existing?.createdAt||time,updatedAt:time};
 localStorage.setItem(KEY,JSON.stringify(existing?all.map(x=>x.id===item.id?item:x):[item,...all]));
 return item;
}
function remove(toolId){
 const all=list();if(!all.some(x=>x.id===toolId))return false;
 localStorage.setItem(KEY,JSON.stringify(all.filter(x=>x.id!==toolId)));return true;
}
root.RTCustomTools=Object.freeze({list,upsert,remove});
})(window);
