/* RealTalent V11.3 — arquivos de apresentação, somente demonstração local.
   Nenhum dado é enviado ao servidor. Não usar materiais de clientes reais. */
(function(global){
'use strict';
const KEY='rt-presentation-library-v113';
const DB='rt-presentation-library-files-v113';
const SETTINGS='rt-presentation-library-v115-preferences';
const CATEGORIES=['Sem categoria','DISC/ACER','Desenvolvimento','Ferramentas','Treinamentos','Workshops','Outros'];
const ROOT='root';
function safeName(value,max=80){return String(value??'').trim().replace(/[<>\x00-\x1f]/g,'').slice(0,max);}
function validTags(tags){
 const seen=new Set();
 return (Array.isArray(tags)?tags:[]).map(t=>safeName(t,28)).filter(t=>{
  const key=t.toLocaleLowerCase('pt-BR');if(!t||seen.has(key)||seen.size>=12)return false;seen.add(key);return true;
 });
}
function settings(){
 let raw={};try{raw=JSON.parse(localStorage.getItem(SETTINGS)||'{}')||{};}catch{}
 const folders=Array.isArray(raw.folders)?raw.folders.filter(f=>f&&typeof f.id==='string'&&typeof f.name==='string')
  .map(f=>({id:f.id.slice(0,90),name:safeName(f.name,60)})).filter(f=>f.name&&f.id!==ROOT).slice(0,40):[];
 const ids=new Set([ROOT,...folders.map(f=>f.id)]);
 const customCategories=Array.isArray(raw.categories)?raw.categories.map(x=>safeName(x,46)).filter(Boolean).slice(0,30):[];
 const categories=[...new Set([...CATEGORIES,...customCategories])];
 const views=Array.isArray(raw.views)?raw.views.filter(v=>v&&typeof v.id==='string'&&typeof v.name==='string')
  .slice(0,16).map(v=>({id:v.id.slice(0,90),name:safeName(v.name,50),filters:{
    folder:ids.has(v.filters?.folder)?v.filters.folder:'all',
    category:categories.includes(v.filters?.category)?v.filters.category:'all',
    type:['all','pdf','image'].includes(v.filters?.type)?v.filters.type:'all',
    favorite:Boolean(v.filters?.favorite),query:safeName(v.filters?.query,120),
    tag:safeName(v.filters?.tag,28),
    sort:['recent','name','size','opened'].includes(v.filters?.sort)?v.filters.sort:'recent'
  }})):[];
 return {folders,categories,views,mode:raw.mode==='list'?'list':'grid'};
}
function saveSettings(next){
 const clean={folders:next.folders,categories:next.categories.filter(x=>!CATEGORIES.includes(x)),
  views:next.views,mode:next.mode==='list'?'list':'grid'};
 localStorage.setItem(SETTINGS,JSON.stringify(clean));return settings();
}
function createFolder(name){
 const next=settings(),clean=safeName(name,60);
 if(!clean)throw new Error('Informe o nome da pasta.');
 if(next.folders.length>=40)throw new Error('Limite de 40 pastas.');
 if(next.folders.some(f=>f.name.toLocaleLowerCase('pt-BR')===clean.toLocaleLowerCase('pt-BR')))throw new Error('Já existe uma pasta com esse nome.');
 const folder={id:id(),name:clean};next.folders.push(folder);saveSettings(next);return folder;
}
function renameFolder(folderId,name){
 const next=settings(),folder=next.folders.find(f=>f.id===folderId),clean=safeName(name,60);
 if(!folder||!clean)throw new Error('Pasta ou nome inválido.');
 if(next.folders.some(f=>f.id!==folderId&&f.name.toLocaleLowerCase('pt-BR')===clean.toLocaleLowerCase('pt-BR')))throw new Error('Já existe outra pasta com esse nome.');
 folder.name=clean;saveSettings(next);return folder;
}
function removeFolder(folderId){
 const next=settings(),index=next.folders.findIndex(f=>f.id===folderId);
 if(index<0)throw new Error('Pasta não encontrada.');
 const files=metadata();let moved=0;
 for(const file of files)if(file.folderId===folderId){file.folderId=ROOT;moved++;}
 // Se persistência falhar, conservar a pasta e os arquivos.
 persist(files);next.folders.splice(index,1);
 next.views=next.views.map(v=>v.filters.folder===folderId?{...v,filters:{...v.filters,folder:'all'}}:v);
 saveSettings(next);return moved;
}
function addCategory(name){
 const next=settings(),clean=safeName(name,46);
 if(!clean)throw new Error('Informe a categoria.');
 if(next.categories.some(c=>c.toLocaleLowerCase('pt-BR')===clean.toLocaleLowerCase('pt-BR')))return next.categories.find(c=>c.toLocaleLowerCase('pt-BR')===clean.toLocaleLowerCase('pt-BR'));
 if(next.categories.length>=37)throw new Error('Limite de categorias atingido.');
 next.categories.push(clean);saveSettings(next);return clean;
}
function saveView(name,filters){
 const next=settings(),clean=safeName(name,50);
 if(!clean)throw new Error('Informe o nome da visão.');
 if(next.views.length>=16)throw new Error('Limite de 16 visões salvas.');
 const view={id:id(),name:clean,filters:{folder:filters.folder||'all',category:filters.category||'all',
  type:filters.type||'all',favorite:!!filters.favorite,query:safeName(filters.query,120),
  tag:safeName(filters.tag,28),sort:filters.sort||'recent'}};
 next.views.push(view);saveSettings(next);return view;
}
function deleteView(viewId){
 const next=settings();next.views=next.views.filter(x=>x.id!==viewId);saveSettings(next);
}
function setMode(mode){const next=settings();next.mode=mode==='list'?'list':'grid';saveSettings(next);}

const MAX_FILES=60, MAX_BYTES=25*1024*1024;
const types=new Map([['application/pdf','PDF'],['image/jpeg','Imagem'],['image/png','Imagem'],['image/webp','Imagem']]);
const extension={'pdf':'application/pdf','jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png','webp':'image/webp'};
const id=()=>global.crypto?.randomUUID?.()||('doc-'+Date.now()+'-'+Math.random().toString(36).slice(2));
function metadata(){
 try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');
  if(!Array.isArray(value))return [];
  const cfg=settings(),folders=new Set([ROOT,...cfg.folders.map(f=>f.id)]);
  return value.filter(x=>x&&typeof x.id==='string'&&types.has(x.mime)).slice(0,MAX_FILES).map(x=>({
   ...x,folderId:folders.has(x.folderId)?x.folderId:ROOT,
   category:cfg.categories.includes(x.category)?x.category:'Sem categoria',
   tags:validTags(x.tags),updatedAt:x.updatedAt||x.createdAt
  }));
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
async function importFiles(fileList,options={}){
 const result=[],errors=[];
 for(const file of Array.from(fileList||[])){
  try{
   const mime=validate(file),items=metadata();
   if(!await validSignature(file,mime))throw new Error('Conteúdo incompatível com o formato indicado. Verifique ou exporte novamente o arquivo.');
   if(items.length>=MAX_FILES)throw new Error('Limite de 60 documentos neste navegador.');
   const entry={id:id(),title:String(file.name).replace(/\.[^.]+$/,'').slice(0,120),
    fileName:String(file.name).slice(0,160),mime,size:file.size,createdAt:new Date().toISOString(),
    lastOpened:null,favorite:false,folderId:settings().folders.some(x=>x.id===options.folderId)?options.folderId:ROOT,
    category:settings().categories.includes(options.category)?options.category:'Sem categoria',
    tags:validTags(options.tags),updatedAt:new Date().toISOString()};
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
 if(Object.hasOwn(values,'folderId')){
  const folders=new Set([ROOT,...settings().folders.map(f=>f.id)]);
  if(!folders.has(values.folderId))throw new Error('Pasta inválida.');
  item.folderId=values.folderId;
 }
 if(Object.hasOwn(values,'category')){
  if(!settings().categories.includes(values.category))throw new Error('Categoria inválida.');
  item.category=values.category;
 }
 if(Object.hasOwn(values,'tags'))item.tags=validTags(values.tags);
 item.updatedAt=new Date().toISOString();
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
global.RTPresentationLibrary=Object.freeze({metadata,readFile,importFiles,change,remove,presenterURL,MAX_BYTES,
 settings,createFolder,renameFolder,removeFolder,addCategory,saveView,deleteView,setMode,ROOT,CATEGORIES});
})(window);
