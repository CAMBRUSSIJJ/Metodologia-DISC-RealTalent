/* RealTalent V11.3 — apresentador de materiais importados e conteúdo didático.
   Visualizador demonstrativo: arquivos apenas neste navegador, sem autenticação. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const library=window.RTPresentationLibrary;
const state={kind:'',entry:null,blobUrl:null,page:1,total:null,slides:[],zoom:100,tool:'none',painting:false,last:null,
 started:Date.now(),lastFocus:null};
let context=null,timer=null;
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>el.classList.remove('show'),3600);}
function create(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;}
function fail(message){$('loading')?.remove();$('error').hidden=false;$('error-text').textContent=message;$('prev').disabled=true;$('next').disabled=true;}
function setTitle(title){const safe=String(title||'Material sem título').slice(0,130);$('doc-title').textContent=safe;document.title=safe+' · Apresentador RealTalent';}
function makeSlides(record){
 const slides=[{type:'cover',title:record.title||'Biblioteca DISC/ACER',sub:record.subtitle||'',body:''}];
 if(record.body)slides.push({title:record.title,body:record.body,type:'text'});
 for(const detail of Array.isArray(record.details)?record.details.slice(0,24):[]){
  const value=Array.isArray(detail.text)?detail.text.map(x=>String(x)).join('\n• '):String(detail.text||'');
  if(value.trim())slides.push({title:String(detail.head||'Conteúdo'),body:value,type:'text'});
 }
 if(Array.isArray(record.points)&&record.points.length)slides.push({title:'Como aplicar',points:record.points.slice(0,12),type:'points'});
 if(record.alert)slides.push({title:'Cuidados de interpretação',body:record.alert,type:'text'});
 return slides;
}
function renderArticle(){
 const slide=state.slides[state.page-1];if(!slide)return;
 const root=create('section','article-slide');
 root.append(create('span','eyebrow','BIBLIOTECA · DISC/ACER'));
 root.append(create('h2','',slide.title||'Conteúdo'));
 if(slide.sub)root.append(create('p','',slide.sub));
 if(slide.body)root.append(create('p','',slide.body));
 if(slide.points){const ul=create('ul');slide.points.forEach(p=>ul.append(create('li','',p)));root.append(ul);}
 $('document').replaceChildren(root);
 root.style.setProperty('--doc-scale',state.zoom/100);
}
function renderFile(){
 if(!state.blobUrl)return;
 const root=$('document');root.replaceChildren();
 if(state.kind==='pdf'){
  const frame=document.createElement('iframe');
  frame.title='PDF original: '+state.entry.title;
  frame.setAttribute('referrerpolicy','no-referrer');
  frame.src=state.blobUrl+'#page='+state.page+'&zoom='+state.zoom;
  root.append(frame);
 }else{
  const img=document.createElement('img');img.alt=state.entry.title;
  img.src=state.blobUrl;img.style.setProperty('--doc-scale',state.zoom/100);
  root.append(img);
 }
}
function resetMarks(){
 const canvas=$('ink'),ctx=canvas.getContext('2d');
 ctx.clearRect(0,0,canvas.width,canvas.height);
 $('laser').hidden=true;
}
function updatePage(){
 if(state.kind==='article')renderArticle();else renderFile();
 $('page-info').textContent=state.kind==='pdf'?'Página '+state.page+' · PDF':
   state.kind==='image'?'Imagem 1 de 1':'Página '+state.page+' de '+state.total;
 $('prev').disabled=state.page===1;
 $('next').disabled=state.total!==null&&state.page>=state.total;
 resetMarks();
}
function shift(step){
 const next=Math.max(1,state.total===null?state.page+step:Math.min(state.total,state.page+step));
 if(next===state.page)return;
 state.page=next;updatePage();
}
function setZoom(delta){
 state.zoom=Math.max(60,Math.min(200,state.zoom+delta));
 $('zoom-value').textContent=state.zoom+'%';
 if(state.kind==='pdf'||state.kind==='article'||state.kind==='image')updatePage();
}
function canvasSize(){
 const canvas=$('ink'),rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
 if(!rect.width||!rect.height)return;
 const previous=document.createElement('canvas');previous.width=canvas.width;previous.height=canvas.height;
 if(canvas.width&&canvas.height)previous.getContext('2d').drawImage(canvas,0,0);
 canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));
 context=canvas.getContext('2d');context.setTransform(dpr,0,0,dpr,0,0);
 if(previous.width)context.drawImage(previous,0,0,previous.width/dpr,previous.height/dpr);
}
function point(ev){
 const b=$('ink').getBoundingClientRect();return {x:ev.clientX-b.left,y:ev.clientY-b.top};
}
function setTool(tool){
 if(!['none','laser','pen','marker','eraser'].includes(tool))return;
 state.tool=tool;state.painting=false;
 const canvas=$('ink'),ink=tool!=='none';
 canvas.hidden=!ink;canvas.style.pointerEvents=ink?'auto':'none';
 $('laser').hidden=true;
 document.querySelectorAll('[data-tool]').forEach(button=>{
  const active=button.dataset.tool===tool;
  button.setAttribute('aria-pressed',String(active));button.classList.toggle('selected',active);
 });
 if(ink)requestAnimationFrame(canvasSize);
 if(tool==='laser')toast('Mova o cursor sobre o material para apontar.');
}
function strokeStart(ev){
 if(state.tool==='none')return;
 if(state.tool==='laser'){const p=point(ev);$('laser').style.left=p.x+'px';$('laser').style.top=p.y+'px';$('laser').hidden=false;return;}
 if(ev.button!==0)return;
 ev.preventDefault();$('ink').setPointerCapture(ev.pointerId);
 state.painting=true;state.last=point(ev);
 if(!context)canvasSize();
 context.beginPath();context.moveTo(state.last.x,state.last.y);
}
function strokeMove(ev){
 if(state.tool==='laser'){const p=point(ev);$('laser').style.left=p.x+'px';$('laser').style.top=p.y+'px';$('laser').hidden=false;return;}
 if(!state.painting||!context)return;
 const now=point(ev);context.save();
 if(state.tool==='eraser'){context.globalCompositeOperation='destination-out';context.lineWidth=30;context.strokeStyle='#000';}
 else if(state.tool==='marker'){context.globalAlpha=.38;context.lineWidth=17;context.strokeStyle='#ffe05a';}
 else {context.lineWidth=3;context.strokeStyle='#f43f5e';}
 context.lineCap='round';context.lineJoin='round';context.beginPath();context.moveTo(state.last.x,state.last.y);context.lineTo(now.x,now.y);context.stroke();context.restore();state.last=now;
}
function strokeEnd(){state.painting=false;state.last=null;}
async function fullscreen(){
 try{if(document.fullscreenElement)await document.exitFullscreen();else await $('viewer').requestFullscreen();}
 catch{toast('A tela cheia foi bloqueada pelo navegador. Você pode continuar apresentando.');}
}
function togglePanel(id){
 const p=$(id),wasHidden=p.hidden;
 $('notes').hidden=true;$('resources').hidden=true;
 p.hidden=!wasHidden;
 $('notes-toggle').setAttribute('aria-pressed',String(!$('notes').hidden));
 $('resources-toggle').setAttribute('aria-pressed',String(!$('resources').hidden));
}
function focus(enabled){
 $('viewer').classList.toggle('focus-mode',enabled);
 $('focus').setAttribute('aria-pressed',String(enabled));
 if(enabled){$('notes').hidden=true;$('resources').hidden=true;setTool('none');$('presentation-content').focus();}
 $('focus').textContent=enabled?'Mostrar controles':'Modo foco';
}
function clock(){const seconds=Math.floor((Date.now()-state.started)/1000);$('clock').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
async function load(){
 const fileId=params.get('file'),recordId=params.get('record');
 const session=params.get('session');if(session&&/^[a-zA-Z0-9_-]{1,120}$/.test(session)){$('session-label').hidden=false;}
 if(!!fileId===!!recordId){fail('Abra um arquivo ou conteúdo pela Biblioteca para iniciar uma apresentação.');return;}
 try{
  if(fileId){
   const entry=library.metadata().find(item=>item.id===fileId);
   if(!entry)throw new Error('Arquivo não está salvo neste navegador. Importe-o novamente na Biblioteca.');
   const blob=await library.readFile(entry.id);
   if(!blob)throw new Error('O conteúdo do arquivo não está disponível. Importe-o novamente.');
   if(blob.size>library.MAX_BYTES||blob.type!==entry.mime)throw new Error('Arquivo incompatível. Importe novamente pela Biblioteca.');
   state.kind=entry.mime==='application/pdf'?'pdf':'image';state.entry=entry;state.total=state.kind==='image'?1:null;
   state.blobUrl=URL.createObjectURL(blob);library.change(entry.id,{lastOpened:true});setTitle(entry.title);
   if(state.kind==='pdf')toast('O PDF mantém o visualizador nativo do navegador. Use suas opções para navegar e ajustar o zoom com precisão.');
  }else{
   const response=await fetch('../biblioteca/data/indice_pesquisa.json',{cache:'force-cache'});
   if(!response.ok)throw new Error('Não foi possível carregar o conteúdo da Biblioteca.');
   const items=await response.json();const record=items.find(x=>x.id===recordId);
   if(!record)throw new Error('Conteúdo não encontrado na Biblioteca.');
   state.kind='article';state.slides=makeSlides(record);state.total=state.slides.length;setTitle(record.title);
  }
  $('loading')?.remove();updatePage();setTool('none');
 }catch(error){fail(error.message||'Não foi possível abrir o documento.');}
}
$('prev').addEventListener('click',()=>shift(-1));$('next').addEventListener('click',()=>shift(1));
$('zoom-in').addEventListener('click',()=>setZoom(10));$('zoom-out').addEventListener('click',()=>setZoom(-10));
$('fullscreen').addEventListener('click',()=>void fullscreen());
$('focus').addEventListener('click',()=>focus(!$('viewer').classList.contains('focus-mode')));
$('reset-focus').addEventListener('click',()=>focus(false));
$('notes-toggle').addEventListener('click',()=>togglePanel('notes'));
$('resources-toggle').addEventListener('click',()=>togglePanel('resources'));
$('close-notes').addEventListener('click',()=>togglePanel('notes'));
$('close-resources').addEventListener('click',()=>togglePanel('resources'));
$('clear-notes').addEventListener('click',()=>{$('notes-text').value='';});
$('clear-ink').addEventListener('click',()=>{resetMarks();toast('Marcações temporárias apagadas desta página.');});
document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
$('ink').addEventListener('pointerdown',strokeStart);
$('ink').addEventListener('pointermove',strokeMove);
$('ink').addEventListener('pointerup',strokeEnd);
$('ink').addEventListener('pointercancel',strokeEnd);
$('ink').addEventListener('pointerleave',()=>{if(state.tool==='laser')$('laser').hidden=true;});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){if($('viewer').classList.contains('focus-mode')){focus(false);event.preventDefault();}else if(!$('notes').hidden||!$('resources').hidden){$('notes').hidden=true;$('resources').hidden=true;}return;}
 if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 if(['ArrowRight','PageDown'].includes(event.key)&&state.kind!=='pdf'){event.preventDefault();shift(1);}
 else if(['ArrowLeft','PageUp'].includes(event.key)&&state.kind!=='pdf'){event.preventDefault();shift(-1);}
 else if(event.key.toLowerCase()==='f'&&!event.ctrlKey){focus(!$('viewer').classList.contains('focus-mode'));}
});
window.addEventListener('resize',()=>{if(state.tool!=='none')requestAnimationFrame(canvasSize);});
window.addEventListener('pagehide',()=>{if(state.blobUrl)URL.revokeObjectURL(state.blobUrl);});
setInterval(clock,1000);clock();void load();
})();