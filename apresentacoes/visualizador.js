/* RealTalent V11.4 — Apresentador Profissional 2.0.
   Materiais fictícios no navegador. PDF.js processa arquivo local, sem upload.
   PDF.js é carregado de vendor/pdfjs quando instalado ou via CDN versionado. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search),library=window.RTPresentationLibrary;
const VERSION='4.10.38';
const CDN='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/'+VERSION+'/';
const state={
 kind:'',entry:null,pdf:null,pdfTask:null,pdfLib:null,blobUrl:null,article:[],page:1,total:0,
 zoom:100,fit:'page',tool:'none',drawing:false,currentStroke:null,
 inkPages:new Map(),redoPages:new Map(),started:Date.now(),renderSerial:0,
 renderTask:null,thumbObserver:null,thumbLoading:new Set(),thumbLoaded:new Set(),
 nativeFallback:false
};
let inkContext=null,toastTimer=null,resizeTimer=null,clockTimer=null,idleTimer=null;
const failSafeText=v=>String(v??'').slice(0,150);
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;}
function toast(message){
 $('toast').textContent=String(message);$('toast').classList.add('show');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4400);
}
function error(message){
 $('loading')?.remove();$('page-surface').hidden=true;$('error').hidden=false;
 $('error-text').textContent=message;$('prev').disabled=true;$('next').disabled=true;
 $('thumbnail-toggle').disabled=true;
}
function setTitle(title){const safe=failSafeText(title||'Material sem título');$('doc-title').textContent=safe;document.title=safe+' · RealTalent';}
function slidesFromArticle(record){
 const slides=[{title:record.title||'Biblioteca DISC/ACER',subtitle:record.subtitle||''}];
 if(record.body)slides.push({title:record.title,body:record.body});
 for(const detail of Array.isArray(record.details)?record.details.slice(0,30):[]){
  const text=Array.isArray(detail.text)?detail.text.map(String).join('\n• '):String(detail.text||'');
  if(text.trim())slides.push({title:String(detail.head||'Conteúdo'),body:text});
 }
 if(Array.isArray(record.points)&&record.points.length)slides.push({title:'Como aplicar',points:record.points.slice(0,12)});
 if(record.alert)slides.push({title:'Cuidados de interpretação',body:record.alert});
 return slides;
}
async function loadPdfLib(){
 // Use a locally installed, version-matched pair when present.
 const localMain=new URL('../vendor/pdfjs/pdf.mjs',location.href);
 const localWorker=new URL('../vendor/pdfjs/pdf.worker.mjs',location.href);
 try{
  const checks=await Promise.all([fetch(localMain,{method:'HEAD'}),fetch(localWorker,{method:'HEAD'})]);
  if(checks.every(x=>x.ok)){
   const lib=await import(localMain.href);lib.GlobalWorkerOptions.workerSrc=localWorker.href;
   return lib;
  }
 }catch{/* Local vendor not installed. */}
 // The fallback is pinned; the original PDF bytes remain on this device.
 const lib=await import(CDN+'pdf.min.mjs');
 lib.GlobalWorkerOptions.workerSrc=CDN+'pdf.worker.min.mjs';
 return lib;
}
async function initializePdf(blob){
 try{
  state.pdfLib=await loadPdfLib();
  const bytes=new Uint8Array(await blob.arrayBuffer());
  state.pdfTask=state.pdfLib.getDocument({data:bytes,useSystemFonts:true});
  state.pdf=await state.pdfTask.promise;state.total=state.pdf.numPages;
  if(!state.total)throw new Error('Documento sem páginas.');
 }catch(exc){
  // A connection failure should not block reading a demonstrative PDF.
  state.nativeFallback=true;state.total=0;state.blobUrl=URL.createObjectURL(blob);
  toast('PDF.js indisponível: visualização básica ativa. Instale os módulos locais para navegar e anotar por página.');
 }
}
function viewBounds(){
 const wrap=$('canvas-wrap');
 return {w:Math.max(320,wrap.clientWidth-24),h:Math.max(240,wrap.clientHeight-24)};
}
function measureScale(w,h){
 const size=viewBounds();
 const base=state.fit==='width'?size.w/w:Math.min(size.w/w,size.h/h);
 return Math.min(5,Math.max(.15,base*state.zoom/100));
}
function setSurface(w,h){
 const surface=$('page-surface');
 surface.hidden=false;
 surface.style.width=Math.max(1,Math.round(w))+'px';surface.style.height=Math.max(1,Math.round(h))+'px';
 resizeInk();
}
function updateCounter(){
 const text=state.nativeFallback?'PDF · modo básico':state.total?
   'Página '+state.page+' de '+state.total:'—';
 $('page-info').textContent=state.kind==='image'?'Imagem 1 de 1':text;
 $('prev').disabled=state.nativeFallback||state.page<=1;
 $('next').disabled=state.nativeFallback||state.page>=state.total;
 document.querySelectorAll('.thumb-item').forEach(node=>node.setAttribute('aria-current',node.dataset.page===String(state.page)?'page':'false'));
 $('zoom-value').textContent=(state.fit==='page'?'Ajustado':state.fit==='width'?'Largura':'Zoom')+' · '+state.zoom+'%';
 for(const id of ['fit-page','fit-width']){
  $(id).setAttribute('aria-pressed',String(id===(state.fit==='page'?'fit-page':'fit-width')));
 }
 const undo=pageInk();
 $('undo-ink').disabled=!undo.length;
 $('redo-ink').disabled=!(state.redoPages.get(state.page)||[]).length;
}
function pageInk(){if(!state.inkPages.has(state.page))state.inkPages.set(state.page,[]);return state.inkPages.get(state.page);}
function resizeInk(){
 const canvas=$('ink'),b=$('page-surface').getBoundingClientRect();
 const dpr=Math.min(devicePixelRatio||1,2);
 if(!b.width||!b.height)return;
 canvas.width=Math.max(1,Math.round(b.width*dpr));canvas.height=Math.max(1,Math.round(b.height*dpr));
 inkContext=canvas.getContext('2d');inkContext.setTransform(dpr,0,0,dpr,0,0);
 paintInk();
}
function strokeColor(s){return s.tool==='marker'?'#ffe05a':'#ef3554';}
function drawStroke(s){
 if(!inkContext||!s?.points?.length)return;
 const b=$('ink').getBoundingClientRect(),w=b.width,h=b.height;
 if(!w||!h)return;
 inkContext.save();
 inkContext.lineWidth=Math.max(2,Math.min(w,h)*(s.tool==='marker'?.027:.005));
 inkContext.lineCap='round';inkContext.lineJoin='round';inkContext.strokeStyle=strokeColor(s);
 inkContext.globalAlpha=s.tool==='marker'?.3:1;
 inkContext.beginPath();
 s.points.forEach(([x,y],i)=>i?inkContext.lineTo(x*w,y*h):inkContext.moveTo(x*w,y*h));
 if(s.points.length===1){const [x,y]=s.points[0];inkContext.lineTo(x*w+.1,y*h+.1);}
 inkContext.stroke();inkContext.restore();
}
function paintInk(){
 if(!inkContext)return;
 const b=$('ink').getBoundingClientRect();inkContext.clearRect(0,0,b.width,b.height);
 for(const s of pageInk())drawStroke(s);
 if(state.currentStroke)drawStroke(state.currentStroke);
}
function cancelRendering(){
 state.renderSerial++;
 try{state.renderTask?.cancel();}catch{}
 state.renderTask=null;
}
async function renderPdf(serial){
 let page;
 try{
  page=await state.pdf.getPage(state.page);
  if(serial!==state.renderSerial)return;
  const native=page.getViewport({scale:1});
  const scale=measureScale(native.width,native.height);
  const viewport=page.getViewport({scale});
  setSurface(viewport.width,viewport.height);
  const canvas=el('canvas','pdf-page');
  canvas.setAttribute('aria-label','Página '+state.page+' do PDF');
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.max(1,Math.round(viewport.width*dpr));
  canvas.height=Math.max(1,Math.round(viewport.height*dpr));
  canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
  $('document').replaceChildren(canvas);
  const ctx=canvas.getContext('2d',{alpha:false});
  state.renderTask=page.render({canvasContext:ctx,viewport,transform:dpr!==1?[dpr,0,0,dpr,0,0]:undefined});
  await state.renderTask.promise;
 }catch(exc){
  if(exc?.name==='RenderingCancelledException')return;
  if(serial!==state.renderSerial)return;
  $('document').replaceChildren(el('p','doc-error','Falha ao renderizar esta página. Tente novamente ou abra o arquivo original.'));
 }finally{if(page?.cleanup)page.cleanup();}
}
function renderImage(){
 const root=$('document'),img=el('img');img.alt=state.entry.title;img.src=state.blobUrl;
 const i=state.entry.imgW||1200,j=state.entry.imgH||800,scale=measureScale(i,j);
 setSurface(i*scale,j*scale);
 root.replaceChildren(img);
}
function renderArticle(){
 const slide=state.article[state.page-1];if(!slide)return;
 const root=el('section','article-slide');
 root.append(el('span','eyebrow','BIBLIOTECA · DISC/ACER'),el('h2','',slide.title||'Conteúdo'));
 if(slide.subtitle)root.append(el('p','',slide.subtitle));
 if(slide.body)root.append(el('p','',slide.body));
 if(slide.points){const ul=el('ul');slide.points.forEach(text=>ul.append(el('li','',text)));root.append(ul);}
 const scale=measureScale(1050,680);
 setSurface(1050*scale,680*scale);
 $('document').replaceChildren(root);
}
function renderNative(){
 const root=$('document'),frame=el('iframe');frame.title='PDF · visualizador básico';
 frame.src=state.blobUrl;frame.referrerPolicy='no-referrer';frame.loading='eager';
 const b=viewBounds();setSurface(b.w,b.h);root.replaceChildren(frame);
}
async function showPage(){
 cancelRendering();const serial=state.renderSerial;
 updateCounter();
 if(state.nativeFallback){renderNative();return;}
 if(state.kind==='pdf')await renderPdf(serial);
 else if(state.kind==='image')renderImage();
 else renderArticle();
 // Always redraw saved annotations after navigating or zooming.
 resizeInk();updateCounter();
}
async function navigate(n){
 if(!state.total||state.nativeFallback)return;
 const next=Math.max(1,Math.min(state.total,n));if(next===state.page)return;
 state.page=next;state.currentStroke=null;await showPage();
 const target=document.querySelector('.thumb-item[data-page="'+state.page+'"]');
 if(target&&!$('thumbnails').hidden)target.scrollIntoView({block:'nearest'});
}
function zoom(delta){
 state.zoom=Math.max(50,Math.min(250,state.zoom+delta));
 void showPage();
}
function changeFit(mode){state.fit=mode;state.zoom=100;void showPage();}
function point(ev){
 const b=$('ink').getBoundingClientRect();
 return [Math.max(0,Math.min(1,(ev.clientX-b.left)/b.width)),Math.max(0,Math.min(1,(ev.clientY-b.top)/b.height))];
}
function erase(point){
 const list=pageInk(),radius=.03;
 let best=-1,bestDist=Infinity;
 for(let i=0;i<list.length;i++)for(const p of list[i].points){
  const d=Math.hypot((p[0]-point[0]),(p[1]-point[1]));if(d<bestDist){best=i;bestDist=d;}
 }
 if(best>=0&&bestDist<radius){list.splice(best,1);state.redoPages.set(state.page,[]);paintInk();updateCounter();}
}
function pointerDown(ev){
 if(state.tool==='none'||state.tool==='laser'||ev.button!==0)return;
 ev.preventDefault();
 const canvas=$('ink');canvas.setPointerCapture(ev.pointerId);
 state.drawing=true;
 const pos=point(ev);
 if(state.tool==='eraser'){erase(pos);return;}
 state.currentStroke={tool:state.tool,points:[pos]};paintInk();
}
function pointerMove(ev){
 if(state.tool==='laser'){
  const b=$('ink').getBoundingClientRect(),laser=$('laser');
  laser.style.left=(ev.clientX-b.left)+'px';laser.style.top=(ev.clientY-b.top)+'px';
  laser.hidden=false;return;
 }
 if(!state.drawing)return;
 if(state.tool==='eraser'){erase(point(ev));return;}
 if(!state.currentStroke)return;
 const next=point(ev),pts=state.currentStroke.points;
 if(Math.hypot(next[0]-pts[pts.length-1][0],next[1]-pts[pts.length-1][1])<.001)return;
 if(pts.length<1800)pts.push(next);
 paintInk();
}
function pointerUp(){
 if(!state.drawing)return;
 state.drawing=false;
 if(state.currentStroke){pageInk().push(state.currentStroke);state.currentStroke=null;state.redoPages.set(state.page,[]);paintInk();updateCounter();}
}
function setTool(tool){
 if(!['none','laser','pen','marker','eraser'].includes(tool))return;
 pointerUp();state.tool=tool;
 $('ink').style.pointerEvents=tool==='none'?'none':'auto';
 $('laser').hidden=true;
 document.querySelectorAll('[data-tool]').forEach(button=>{
  const active=button.dataset.tool===tool;
  button.setAttribute('aria-pressed',String(active));button.classList.toggle('selected',active);
 });
}
function undo(){
 const list=pageInk();if(!list.length)return;
 if(!state.redoPages.has(state.page))state.redoPages.set(state.page,[]);
 state.redoPages.get(state.page).push(list.pop());
 paintInk();updateCounter();
}
function redo(){
 const list=state.redoPages.get(state.page)||[];if(!list.length)return;
 pageInk().push(list.pop());paintInk();updateCounter();
}
function clearInk(){
 if(!pageInk().length)return;
 if(!confirm('Apagar as marcações desta página?'))return;
 state.inkPages.set(state.page,[]);state.redoPages.set(state.page,[]);paintInk();updateCounter();
}
function exportInk(){
 const pages=[...state.inkPages].filter(([_,strokes])=>strokes.length).map(([page,strokes])=>({page,strokes}));
 if(!pages.length)return toast('Nenhuma marcação para exportar.');
 const data={format:'realtalent-v11.4-marcacoes',title:$('doc-title').textContent,
  exportedAt:new Date().toISOString(),pageCount:state.total,pages};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=el('a');a.href=url;a.download='realtalent-marcacoes-'+Date.now()+'.json';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2500);
 toast('Marcações exportadas separadamente. O documento original não foi alterado.');
}
function thumbnail(text,index){
 const btn=el('button','thumb-item');btn.type='button';btn.dataset.page=String(index);
 btn.setAttribute('aria-label','Ir para página '+index);
 if(state.kind==='pdf'){const canvas=el('canvas');canvas.width=142;canvas.height=175;canvas.dataset.thumb=String(index);btn.append(canvas);}
 else btn.append(el('div','thumb-text',text||'Página '+index));
 btn.append(el('span','',String(index).padStart(2,'0')));
 btn.addEventListener('click',()=>void navigate(index));
 return btn;
}
async function thumbnailPdf(canvas,index){
 if(state.thumbLoaded.has(index)||state.thumbLoading.has(index)||!state.pdf)return;
 state.thumbLoading.add(index);
 try{
  const page=await state.pdf.getPage(index),viewport=page.getViewport({scale:1});
  const target=page.getViewport({scale:140/viewport.width});
  const dpr=Math.min(devicePixelRatio||1,1.6);
  canvas.width=Math.round(target.width*dpr);canvas.height=Math.round(target.height*dpr);
  canvas.style.aspectRatio=target.width+'/'+target.height;
  const ctx=canvas.getContext('2d',{alpha:false});
  await page.render({canvasContext:ctx,viewport:target,transform:[dpr,0,0,dpr,0,0]}).promise;
  state.thumbLoaded.add(index);
 }catch{canvas.title='Prévia indisponível';}finally{state.thumbLoading.delete(index);}
}
function createThumbnails(){
 const list=$('thumbnail-list');list.replaceChildren();
 state.thumbObserver?.disconnect();state.thumbLoaded.clear();state.thumbLoading.clear();
 if(!state.total||state.nativeFallback)return;
 for(let i=1;i<=state.total;i++){
  const slide=state.article[i-1];
  const title=state.kind==='article'?slide?.title:state.kind==='image'?state.entry.title:'';
  const button=thumbnail(title,i);list.append(button);
 }
 updateCounter();
 if(state.kind==='pdf'&&'IntersectionObserver' in window){
  state.thumbObserver=new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting){
    const canvas=entry.target,idx=Number(canvas.dataset.thumb);
    state.thumbObserver.unobserve(canvas);void thumbnailPdf(canvas,idx);
   }
  },{root:$('thumbnails'),rootMargin:'250px'});
  list.querySelectorAll('canvas[data-thumb]').forEach(canvas=>state.thumbObserver.observe(canvas));
 }
}
function toggleThumbnails(force){
 const panel=$('thumbnails'),open=force===undefined?panel.hidden:!!force;
 panel.hidden=!open;$('thumbnail-toggle').setAttribute('aria-pressed',String(open));
 if(open&&state.kind==='pdf'){
  const nodes=panel.querySelectorAll('canvas[data-thumb]');
  if(!state.thumbObserver)Array.from(nodes).slice(0,15).forEach(canvas=>void thumbnailPdf(canvas,Number(canvas.dataset.thumb)));
 }
}
function togglePanel(id){
 const panel=$(id),open=panel.hidden;
 $('notes').hidden=true;$('resources').hidden=true;panel.hidden=!open;
 $('notes-toggle').setAttribute('aria-pressed',String(!$('notes').hidden));
 $('resources-toggle').setAttribute('aria-pressed',String(!$('resources').hidden));
}
function setFocus(on){
 $('viewer').classList.toggle('focus-mode',on);$('focus').setAttribute('aria-pressed',String(on));
 $('focus').textContent=on?'Mostrar controles':'Modo foco';
 if(on){
  $('notes').hidden=true;$('resources').hidden=true;toggleThumbnails(false);setTool('none');
  $('notes-toggle').setAttribute('aria-pressed','false');$('resources-toggle').setAttribute('aria-pressed','false');
  $('presentation-content').focus();
 }
 setTimeout(()=>void showPage(),90);
}
async function fullscreen(){
 try{if(document.fullscreenElement)await document.exitFullscreen();else await $('viewer').requestFullscreen();}
 catch{toast('Navegador bloqueou a tela cheia. Continue no modo normal.');}
}
function clock(){
 const sec=Math.floor((Date.now()-state.started)/1000);
 $('clock').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
}
function onResize(){
 clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>void showPage(),160);
}
async function load(){
 const fileId=params.get('file'),recordId=params.get('record'),session=params.get('session');
 if(session&&/^[a-zA-Z0-9_-]{1,120}$/.test(session))$('session-label').hidden=false;
 if(!!fileId===!!recordId)return error('Abra um documento na Biblioteca para iniciar a apresentação.');
 try{
  if(fileId){
   const meta=library.metadata().find(x=>x.id===fileId);
   if(!meta)throw Error('Arquivo não encontrado neste navegador. Importe-o novamente.');
   const blob=await library.readFile(meta.id);
   if(!blob||!blob.size||blob.size>library.MAX_BYTES||blob.type!==meta.mime)throw Error('Arquivo indisponível ou incompatível.');
   state.entry={...meta};setTitle(meta.title);
   if(meta.mime==='application/pdf'){
    state.kind='pdf';await initializePdf(blob);
   }else{
    state.kind='image';state.total=1;state.blobUrl=URL.createObjectURL(blob);
    const img=new Image();img.src=state.blobUrl;
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Imagem ilegível.'));});
    state.entry.imgW=img.naturalWidth;state.entry.imgH=img.naturalHeight;
   }
   library.change(meta.id,{lastOpened:true});
  }else{
   const response=await fetch('../biblioteca/data/indice_pesquisa.json',{cache:'force-cache'});
   if(!response.ok)throw Error('A Biblioteca não está disponível.');
   const records=await response.json(),record=records.find(x=>x.id===recordId);
   if(!record)throw Error('Conteúdo não encontrado.');
   state.kind='article';state.article=slidesFromArticle(record);state.total=state.article.length;setTitle(record.title);
  }
  $('loading')?.remove();
  createThumbnails();await showPage();setTool('none');
 }catch(exc){error(exc.message||'Falha ao abrir o material.');}
}
$('prev').addEventListener('click',()=>void navigate(state.page-1));
$('next').addEventListener('click',()=>void navigate(state.page+1));
$('thumbnail-toggle').addEventListener('click',()=>toggleThumbnails());
$('close-thumbnails').addEventListener('click',()=>toggleThumbnails(false));
$('zoom-in').addEventListener('click',()=>zoom(10));
$('zoom-out').addEventListener('click',()=>zoom(-10));
$('fit-page').addEventListener('click',()=>changeFit('page'));
$('fit-width').addEventListener('click',()=>changeFit('width'));
$('undo-ink').addEventListener('click',undo);
$('redo-ink').addEventListener('click',redo);
$('clear-ink').addEventListener('click',clearInk);
$('export-ink').addEventListener('click',exportInk);
$('fullscreen').addEventListener('click',()=>void fullscreen());
$('focus').addEventListener('click',()=>setFocus(!$('viewer').classList.contains('focus-mode')));
$('focus-exit').addEventListener('click',()=>setFocus(false));
$('reset-focus').addEventListener('click',()=>setFocus(false));
$('notes-toggle').addEventListener('click',()=>togglePanel('notes'));
$('resources-toggle').addEventListener('click',()=>togglePanel('resources'));
$('close-notes').addEventListener('click',()=>togglePanel('notes'));
$('close-resources').addEventListener('click',()=>togglePanel('resources'));
$('clear-notes').addEventListener('click',()=>{$('notes-text').value='';});
document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
$('ink').addEventListener('pointerdown',pointerDown);
$('ink').addEventListener('pointermove',pointerMove);
$('ink').addEventListener('pointerup',pointerUp);
$('ink').addEventListener('pointercancel',pointerUp);
$('ink').addEventListener('pointerleave',()=>{$('laser').hidden=true;});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){
  if($('viewer').classList.contains('focus-mode')){setFocus(false);event.preventDefault();}
  else if(!$('notes').hidden||!$('resources').hidden){$('notes').hidden=true;$('resources').hidden=true;}
  return;
 }
 if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 if(['ArrowRight','PageDown',' '].includes(event.key)){event.preventDefault();void navigate(state.page+1);}
 else if(['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();void navigate(state.page-1);}
 else if(event.key==='Home'){event.preventDefault();void navigate(1);}
 else if(event.key==='End'){event.preventDefault();void navigate(state.total);}
 else if(event.key.toLowerCase()==='f'&&!event.ctrlKey&&!event.metaKey)setFocus(!$('viewer').classList.contains('focus-mode'));
 else if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();}
});
window.addEventListener('resize',onResize);
document.addEventListener('fullscreenchange',onResize);
window.addEventListener('pagehide',()=>{
 state.thumbObserver?.disconnect();try{state.renderTask?.cancel();}catch{}
 try{state.pdfTask?.destroy();}catch{}
 if(state.blobUrl)URL.revokeObjectURL(state.blobUrl);
 clearInterval(clockTimer);
});
clockTimer=setInterval(clock,1000);clock();void load();
})();