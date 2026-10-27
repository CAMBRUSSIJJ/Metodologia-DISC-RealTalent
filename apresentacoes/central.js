/* RealTalent V11.3 — painel de acesso aos materiais da Biblioteca. */
(function(){
'use strict';
const store=window.RTPresentationLibrary;
const $=id=>document.getElementById(id);
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;}
function item(entry){
 const card=el('article','item'),tag=el('span','format',entry.mime==='application/pdf'?'PDF':'IMAGEM');
 card.append(tag,el('h3','',entry.title),el('small','',entry.fileName));
 const row=el('div','actions'),btn=el('a','btn primary','▶ Apresentar');
 btn.href=store.presenterURL({file:entry.id});btn.target='_blank';btn.rel='noopener noreferrer';
 btn.addEventListener('click',()=>store.change(entry.id,{lastOpened:true}));
 row.append(btn);card.append(row);return card;
}
function fill(id,data,empty){
 const root=$(id);root.replaceChildren();
 if(!data.length){root.append(el('div','empty',empty));return;}
 data.forEach(x=>root.append(item(x)));
}
function render(){
 const all=store?.metadata()||[];
 fill('favorites',all.filter(x=>x.favorite),'Selecione a estrela de um material na Biblioteca para encontrá-lo aqui.');
 fill('recent',all.filter(x=>x.lastOpened).sort((a,b)=>String(b.lastOpened).localeCompare(String(a.lastOpened))).slice(0,12),
  'Os materiais apresentados pela Biblioteca ou por esta aba aparecerão aqui.');
 measure();
}
function measure(){
 if(window.parent!==window)window.parent.postMessage({type:'rt:module-height',module:'presentations',height:Math.max(620,document.body.scrollHeight+30)},location.origin);
}
window.addEventListener('storage',render);window.addEventListener('resize',measure);
render();})();
