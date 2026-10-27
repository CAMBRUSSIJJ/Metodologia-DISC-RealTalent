/* RealTalent V11.3 — arquivos de apresentação, somente demonstração local.
   Nenhum dado é enviado ao servidor. Não usar materiais de clientes reais. */
(function(global){
'use strict';
const KEY='rt-presentation-library-v113';
const DB='rt-presentation-library-files-v113';
const MAX_FILES=60, MAX_BYTES=25*1024*1024;
const types=new Map([['application/pdf','PDF'],['image/jpeg','Imagem'],['image/png','Imagem'],['image/webp','Imagem']]);
const extension={'pdf':'application/pdf','jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png','webp':'image/webp'};
const id=()=>global.crypto?.randomUUID?.()||('doc-'+Date.now()+'-'+Math.random().toString(36).slice(2));
function metadata(){
 try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');
  return Array.isArray(value)?value.filter(x=>x&&typeof x.id==='string'&&types.has(x.mime)).slice(0,MAX_FILES):[];
 }catch{return [];}
}
function persist(items){localStorage.setItem(KEY,JSON.stringify(items.slice(0,MAX_FILES)));}
function dbOpen(){
 return new Promise((resolve,reject)=>{
  if(!global.indexedDB)return reject(new Error('Este navegador não permite armazenamento de arquivos.'));
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('assets'))req.result.createObjectStore('assets');};
  req.onerror=()=>reject(req.error||new Error('IndexedDB indisponível'));
  req.onsuccess=()=>resolve(req.result);
 });
}
async function storeFile(fileId,blob){
 const db=await dbOpen();
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction('assets','readwrite');
  tx.objectStore('assets').put(blob,fileId);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Falha de gravação'));
 });}finally{db.close();}
}
async function readFile(fileId){
 const db=await dbOpen();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction('assets','readonly'),req=tx.objectStore('assets').get(fileId);
  req.onsuccess=()=>resolve(req.result||null);
  req.onerror=()=>reject(req.error||new Error('Falha de leitura'));
 });}finally{db.close();}
}
async function deleteFile(fileId){
 const db=await dbOpen();
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction('assets','readwrite');
  tx.objectStore('assets').delete(fileId);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Falha ao apagar'));
 });}finally{db.close();}
}
function validate(file){
 const mime=extension[String(file.name||'').split('.').pop().toLowerCase()];
 if(!mime||!types.has(mime)||(file.type&&file.type!==mime))throw new Error('Formato não aceito. Importe PDF, JPEG, PNG ou WebP. Converta PPTX em PDF antes de apresentar.');
 if(file.size<1||file.size>MAX_BYTES)throw new Error('Cada documento deve ter entre 1 byte e 25 MB.');
 return mime;
}
async function validSignature(file,mime){
 const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
 const text=String.fromCharCode(...bytes);
 if(mime==='application/pdf')return text.startsWith('%PDF-');
 if(mime==='image/png')return bytes[0]===137&&text.slice(1,4)==='PNG';
 if(mime==='image/jpeg')return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(mime==='image/webp')return text.startsWith('RIFF')&&text.slice(8,12)==='WEBP';
 return false;
}
async function importFiles(fileList){
 const result=[],errors=[];
 for(const file of Array.from(fileList||[])){
  try{
   const mime=validate(file),items=metadata();
   if(!await validSignature(file,mime))throw new Error('Conteúdo incompatível com o formato indicado. Verifique ou exporte novamente o arquivo.');
   if(items.length>=MAX_FILES)throw new Error('Limite de 60 documentos neste navegador.');
   const entry={id:id(),title:String(file.name).replace(/\.[^.]+$/,'').slice(0,120),
    fileName:String(file.name).slice(0,160),mime,size:file.size,createdAt:new Date().toISOString(),
    lastOpened:null,favorite:false};
   await storeFile(entry.id,new Blob([file],{type:mime}));
   try{persist([entry,...items]);}
   catch(e){await deleteFile(entry.id).catch(()=>{});throw e;}
   result.push(entry);
  }catch(error){errors.push(file.name+': '+error.message);}
 }
 return {items:result,errors};
}
function change(fileId,values){
 const all=metadata(),item=all.find(x=>x.id===fileId);if(!item)return false;
 if(Object.hasOwn(values,'title'))item.title=String(values.title||item.title).trim().slice(0,120)||item.title;
 if(Object.hasOwn(values,'favorite'))item.favorite=!!values.favorite;
 if(Object.hasOwn(values,'lastOpened'))item.lastOpened=new Date().toISOString();
 persist(all);return true;
}
async function remove(fileId){
 const all=metadata();if(!all.some(x=>x.id===fileId))return false;
 await deleteFile(fileId);persist(all.filter(x=>x.id!==fileId));return true;
}
function presenterURL(options){
 const base=new URL('../apresentacoes/visualizador.html',global.location.href);
 if(options.file)base.searchParams.set('file',options.file);
 if(options.record)base.searchParams.set('record',options.record);
 if(options.session)base.searchParams.set('session',options.session);
 return base.href;
}
global.RTPresentationLibrary=Object.freeze({metadata,readFile,importFiles,change,remove,presenterURL,MAX_BYTES});
})(window);
