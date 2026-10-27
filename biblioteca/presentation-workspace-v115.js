/* RealTalent V11.5 — espaço de materiais profissionais, preview local.
   A Biblioteca é a origem. O apresentador não cria cópias nem edita arquivos.
   Somente documentos fictícios: IndexedDB/localStorage não equivalem a segurança clínica. */
(function(window){
'use strict';
const store=window.RTPresentationLibrary;
const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const btn=(label,callback,cls='')=>{const n=el('button',cls,label);n.type='button';n.addEventListener('click',callback);return n;};
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const formatSize=bytes=>bytes<1024*1024?Math.max(1,Math.round(bytes/1024))+' KB':(bytes/1048576).toFixed(1)+' MB';
const ui={folder:'all',category:'all',type:'all',favorite:false,query:'',tag:'',sort:'recent',
 mode:'grid',activeView:'',initialized:false,root:null,content:null,observer:null,urls:new Set(),
 pdfLib:null,pdfAttempt:null,previewURL:null,callbacks:null};
function config(){return store.settings();}
function notify(msg){ui.callbacks?.notify?.(msg);}
function defaults(){return {folder:'all',category:'all',type:'all',favorite:false,query:'',tag:'',sort:'recent'};}
function snapshot(){return {folder:ui.folder,category:ui.category,type:ui.type,favorite:ui.favorite,query:ui.query,tag:ui.tag,sort:ui.sort};}
function apply(filters){Object.assign(ui,defaults(),filters);redraw();}
function select(options,value,label,change){
 const n=el('select');n.setAttribute('aria-label',label);
 options.forEach(([id,name])=>{const o=el('option','',name);o.value=id;n.append(o);});
 n.value=value;n.addEventListener('change',ev=>change(ev.target.value));return n;
}
function clean(){
 ui.observer?.disconnect();ui.observer=null;
 for(const url of ui.urls)URL.revokeObjectURL(url);ui.urls.clear();
 if(ui.previewURL){URL.revokeObjectURL(ui.previewURL);ui.previewURL=null;}
}
function positionModal(d){
 // A Biblioteca é apresentada em um iframe cujo tamanho cresce com o conteúdo.
 // Posicionar o modal onde o profissional está olhando, não no centro do iframe inteiro.
 try{
  const frame=window.frameElement;if(!frame||window.parent===window)return;
  const rect=frame.getBoundingClientRect();
  const visibleHeight=Math.max(360,window.parent.innerHeight||720);
  d.style.position='absolute';
  d.style.margin='0 auto';
  d.style.top=Math.max(18,(-rect.top)+Math.min(54,visibleHeight*.07))+'px';
  d.style.maxHeight=Math.max(300,visibleHeight-90)+'px';
 }catch{/* Mantém posicionamento padrão em outros contextos. */}
}
function dialog(title,explain,fields,onSave){
 const d=el('dialog','rt-v115-dialog'),form=el('form');form.method='dialog';
 form.append(el('h2','',title),el('p','rt-v115-dialog-copy',explain));
 for(const field of fields){
  const label=el('label','rt-v115-field',field.label);
  let input;if(field.options)input=select(field.options,field.value,field.label,()=>{});
  else{input=el('input');input.type='text';input.value=field.value||'';input.maxLength=field.max||120;}
  input.name=field.name;input.required=!!field.required;label.append(input);form.append(label);
 }
 const errors=el('p','rt-v115-error');errors.setAttribute('role','alert');form.append(errors);
 const actions=el('div','rt-v115-dialog-actions');
 actions.append(btn('Cancelar',()=>d.close(),'btn small'));
 const save=el('button','btn primary','Salvar');save.type='submit';actions.append(save);form.append(actions);
 form.addEventListener('submit',ev=>{
  ev.preventDefault();
  const values=Object.fromEntries(new FormData(form));
  try{onSave(values);d.close();redraw();}catch(exc){errors.textContent=exc.message||'Não foi possível salvar.';}
 });
 d.append(form);ui.root.append(d);
 d.addEventListener('close',()=>{d.remove();});
 positionModal(d);d.showModal();
 const first=form.querySelector('input,select');first?.focus();
}
function createFolder(){
 dialog('Nova pasta','Organize os materiais em pastas sem criar cópias dos arquivos.',
  [{name:'name',label:'Nome da pasta',required:true,max:60}],v=>{
   const folder=store.createFolder(v.name);ui.folder=folder.id;ui.activeView='';notify('Pasta criada.');
  });
}
function manageFolder(folder){
 const options=[['rename','Renomear pasta'],['delete','Excluir pasta (arquivos vão para Sem pasta)']];
 dialog('Gerenciar pasta','Ao excluir a pasta, os arquivos permanecem na Biblioteca.',
  [{name:'action',label:'Ação',options,value:'rename'},{name:'name',label:'Nome da pasta',value:folder.name,max:60}],
  v=>{
   if(v.action==='delete'){
    if(!window.confirm('Excluir a pasta '+folder.name+'? Os materiais serão movidos para Sem pasta.'))return;
    const count=store.removeFolder(folder.id);ui.folder='all';notify(count+' arquivo(s) mantido(s) em Sem pasta.');
   }else{store.renameFolder(folder.id,v.name);notify('Nome atualizado.');}
  });
}
function fileDetails(file){
 const cfg=config(),folders=[['root','Sem pasta'],...cfg.folders.map(f=>[f.id,f.name])];
 dialog('Organizar material','Atualize os metadados sem alterar o conteúdo original.',
 [
  {name:'title',label:'Nome do material',value:file.title,max:120,required:true},
  {name:'folder',label:'Pasta',options:folders,value:file.folderId},
  {name:'category',label:'Categoria',options:cfg.categories.map(x=>[x,x]),value:file.category},
  {name:'tags',label:'Etiquetas (separadas por vírgula)',value:(file.tags||[]).join(', '),max:280}
 ],v=>{
  store.change(file.id,{title:v.title,folderId:v.folder,category:v.category,
    tags:v.tags.split(',').map(x=>x.trim()).filter(Boolean)});
  notify('Material organizado.');});
}
function newCategory(){
 dialog('Nova categoria','A categoria ficará disponível para todos os materiais.',
 [{name:'name',label:'Nome da categoria',required:true,max:46}],v=>{store.addCategory(v.name);notify('Categoria criada.');});
}
function saveCurrentView(){
 dialog('Salvar visão','Guarde os filtros atuais para encontrá-los novamente.',
 [{name:'name',label:'Nome da visão',required:true,max:50}],v=>{
  const saved=store.saveView(v.name,snapshot());ui.activeView=saved.id;notify('Visão salva.');});
}
function deleteCurrentView(){
 if(!ui.activeView)return;
 const match=config().views.find(v=>v.id===ui.activeView);if(!match)return;
 if(!window.confirm('Excluir a visão '+match.name+'? Os arquivos não serão alterados.'))return;
 store.deleteView(match.id);ui.activeView='';redraw();notify('Visão removida.');
}
async function importFiles(fileList){
 const files=Array.from(fileList||[]);if(!files.length)return;
 const drop=ui.root?.querySelector('.rt-v115-drop');
 if(drop){drop.classList.remove('is-dragging');drop.setAttribute('aria-busy','true');}
 try{
  const folderId=config().folders.some(f=>f.id===ui.folder)?ui.folder:store.ROOT;
  const result=await store.importFiles(files,{folderId});
  if(result.items.length)notify(result.items.length+' material(is) importado(s) na Biblioteca.');
  if(result.errors.length)window.alert('Arquivos não importados:\n'+result.errors.join('\n').slice(0,3000));
 }catch(e){notify('Falha na importação: '+e.message);}
 finally{if(drop)drop.removeAttribute('aria-busy');redraw();}
}
function dropZone(){
 const n=el('div','rt-v115-drop rt-v113-upload');n.setAttribute('role','group');n.setAttribute('aria-label','Importação de documentos');
 const intro=el('div');
 intro.append(el('strong','','Adicionar materiais prontos'),el('p','','Arraste arquivos para cá ou selecione no computador. PDF e imagens de até 25 MB.'));
 const actions=el('div','rt-v115-upload-actions');
 const label=el('label','rt-v113-upload-btn','+ Importar materiais');
 const input=el('input');input.type='file';input.multiple=true;
 input.accept='.pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp';
 input.setAttribute('aria-label','Importar arquivos para apresentar');
 input.addEventListener('change',ev=>{const files=[...ev.target.files];ev.target.value='';void importFiles(files);});
 label.append(input);actions.append(label,btn('Nova pasta',createFolder,'btn small'));
 n.append(intro,actions);
 const drag=ev=>{if(!Array.from(ev.dataTransfer?.types||[]).includes('Files'))return;ev.preventDefault();n.classList.add('is-dragging');};
 n.addEventListener('dragenter',drag);n.addEventListener('dragover',drag);
 n.addEventListener('dragleave',ev=>{if(!n.contains(ev.relatedTarget))n.classList.remove('is-dragging');});
 n.addEventListener('drop',ev=>{ev.preventDefault();n.classList.remove('is-dragging');void importFiles(ev.dataTransfer?.files);});
 return n;
}
function sidebar(){
 const aside=el('aside','rt-v115-sidebar');
 aside.append(el('h2','','Pastas'));
 const folderList=el('nav','rt-v115-folder-list');folderList.setAttribute('aria-label','Pastas');
 const cfg=config(),items=[['all','Todos os arquivos'],['root','Sem pasta'],...cfg.folders.map(f=>[f.id,f.name])];
 const total=store.metadata(),counts={all:total.length,root:total.filter(x=>x.folderId==='root').length};
 cfg.folders.forEach(f=>counts[f.id]=total.filter(x=>x.folderId===f.id).length);
 for(const [id,name] of items){
  const row=el('div','rt-v115-folder-row');
  const pick=btn(name,()=>{ui.folder=id;ui.activeView='';redraw();},'rt-v115-folder'+(ui.folder===id?' active':''));
  pick.setAttribute('aria-current',ui.folder===id?'true':'false');pick.prepend(el('span','folder-glyph',id==='all'?'▤':'▰'));
  pick.append(el('small','',counts[id]||'0'));row.append(pick);
  const match=cfg.folders.find(f=>f.id===id);
  if(match){const edit=btn('···',()=>manageFolder(match),'rt-v115-folder-action');edit.setAttribute('aria-label','Gerenciar '+name);row.append(edit);}
  folderList.append(row);
 }
 aside.append(folderList,btn('+ Nova pasta',createFolder,'rt-v115-add-folder'));
 aside.append(el('h2','rt-v115-side-subhead','Visões salvas'));
 const list=el('div','rt-v115-view-list');
 if(!cfg.views.length)list.append(el('p','rt-v115-muted','Salve combinações de filtros para acesso rápido.'));
 for(const v of cfg.views){
  const b=btn(v.name,()=>{ui.activeView=v.id;Object.assign(ui,defaults(),v.filters);redraw();},'rt-v115-view'+(ui.activeView===v.id?' active':''));
  b.prepend(el('span','','⌑'));list.append(b);
 }
 aside.append(list);
 return aside;
}
function matches(file){
 if(ui.folder!=='all'&&file.folderId!==ui.folder)return false;
 if(ui.category!=='all'&&file.category!==ui.category)return false;
 if(ui.type!=='all'&&(ui.type==='pdf'?(file.mime!=='application/pdf'):(file.mime==='application/pdf')))return false;
 if(ui.favorite&&!file.favorite)return false;
 if(ui.tag&&!((file.tags||[]).some(x=>norm(x)===norm(ui.tag))))return false;
 const q=norm(ui.query.trim());
 if(q&&!norm([file.title,file.fileName,file.category,...(file.tags||[])].join(' ')).includes(q))return false;
 return true;
}
function sorted(items){
 const list=items.filter(matches);
 return list.sort((a,b)=>ui.sort==='name'?a.title.localeCompare(b.title,'pt-BR'):
  ui.sort==='size'?b.size-a.size:
  ui.sort==='opened'?String(b.lastOpened||'').localeCompare(String(a.lastOpened||'')):
   String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
}
function addFilterField(panel,label,node){
 const box=el('label','rt-v115-filter');box.append(el('span','',label),node);panel.append(box);
}
function renderFilterBar(parent){
 const cfg=config(),filters=el('div','rt-v115-filterbar');
 const search=el('input','rt-v113-search');search.type='search';search.placeholder='Buscar por nome, categoria ou etiqueta';
 search.setAttribute('aria-label','Pesquisar materiais');search.value=ui.query;
 search.addEventListener('input',e=>{ui.query=e.target.value;ui.activeView='';updateCards();});
 addFilterField(filters,'Pesquisar',search);
 addFilterField(filters,'Categoria',select([['all','Todas as categorias'],...cfg.categories.map(c=>[c,c])],ui.category,'Categoria',v=>{ui.category=v;ui.activeView='';updateCards();}));
 addFilterField(filters,'Tipo',select([['all','Todos os formatos'],['pdf','PDF'],['image','Imagens']],ui.type,'Tipo',v=>{ui.type=v;ui.activeView='';updateCards();}));
 const tags=[...new Set(store.metadata().flatMap(x=>x.tags||[]))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 addFilterField(filters,'Etiqueta',select([['','Todas as etiquetas'],...tags.map(t=>[t,t])],ui.tag,'Etiqueta',v=>{ui.tag=v;ui.activeView='';updateCards();}));
 addFilterField(filters,'Ordenar',select([['recent','Mais recentes'],['name','Nome (A–Z)'],['opened','Última apresentação'],['size','Maior arquivo']],ui.sort,'Ordenar',v=>{ui.sort=v;ui.activeView='';updateCards();}));
 parent.append(filters);
 const actions=el('div','rt-v115-toolbar-bottom');
 const favorite=btn('☆ Favoritos',()=>{ui.favorite=!ui.favorite;ui.activeView='';redraw();},'btn small'+(ui.favorite?' rt-v115-pressed':''));
 favorite.setAttribute('aria-pressed',String(ui.favorite));actions.append(favorite);
 const grid=btn('▦ Grade',()=>setMode('grid'),'btn small'+(ui.mode==='grid'?' rt-v115-pressed':''));
 const list=btn('☰ Lista',()=>setMode('list'),'btn small'+(ui.mode==='list'?' rt-v115-pressed':''));
 grid.setAttribute('aria-pressed',String(ui.mode==='grid'));
 list.setAttribute('aria-pressed',String(ui.mode==='list'));
 actions.append(grid,list,btn('Salvar visão',saveCurrentView,'btn small'));
 if(ui.activeView)actions.append(btn('Excluir visão',deleteCurrentView,'btn small'));
 actions.append(btn('+ Categoria',newCategory,'btn small'));
 const count=el('span','rt-v115-result-count');count.id='rt-v115-result-count';actions.append(count);
 parent.append(actions);
}
function setMode(mode){ui.mode=mode;store.setMode(mode);redraw();}
async function loadPdfLib(){
 if(ui.pdfLib)return ui.pdfLib;
 if(ui.pdfAttempt)return ui.pdfAttempt;
 ui.pdfAttempt=(async()=>{
  const base=new URL('../vendor/pdfjs/',location.href);
  try{
   const marker=await fetch(new URL('version.txt',base),{cache:'no-store'});
   if(marker.ok&&(await marker.text()).trim()==='4.10.38'){
    const lib=await import(new URL('pdf.mjs',base).href);
    lib.GlobalWorkerOptions.workerSrc=new URL('pdf.worker.mjs',base).href;
    return lib;
   }
  }catch{}
  const url='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/';
  const lib=await import(url+'pdf.min.mjs');lib.GlobalWorkerOptions.workerSrc=url+'pdf.worker.min.mjs';
  return lib;
 })();
 try{ui.pdfLib=await ui.pdfAttempt;return ui.pdfLib;}finally{ui.pdfAttempt=null;}
}
async function thumbnail(node,file){
 if(!node.isConnected)return;
 try{
  const blob=await store.readFile(file.id);if(!blob||!node.isConnected)return;
  if(file.mime!=='application/pdf'){
   const url=URL.createObjectURL(blob);ui.urls.add(url);
   const img=el('img');img.src=url;img.alt='Prévia de '+file.title;
   img.loading='lazy';node.replaceChildren(img);return;
  }
  const lib=await loadPdfLib();if(!node.isConnected)return;
  const task=lib.getDocument({data:new Uint8Array(await blob.arrayBuffer())});let documentPdf;
  try{
   documentPdf=await task.promise;const page=await documentPdf.getPage(1);
   const base=page.getViewport({scale:1}),scale=Math.min(1,195/base.width);
   const viewport=page.getViewport({scale});
   const canvas=el('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
   await page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport}).promise;
   if(node.isConnected)node.replaceChildren(canvas);
  }finally{await task.destroy().catch(()=>{});}
 }catch{if(node.isConnected)node.replaceChildren(el('span','rt-v115-preview-fallback',file.mime==='application/pdf'?'PDF':'IMG'));}
}
function lazyPreview(node,file){
 node.dataset.previewId=file.id;
 if(ui.observer)ui.observer.observe(node);else void thumbnail(node,file);
}
function showPreview(file){
 const d=el('dialog','rt-v115-preview-dialog');
 const head=el('div','rt-v115-preview-head');head.append(el('strong','',file.title));
 head.append(btn('✕ Fechar',()=>d.close(),'btn small'));
 const stage=el('div','rt-v115-preview-stage', 'Carregando arquivo...');
 const bottom=el('div','rt-v115-preview-actions');
 bottom.append(btn('▶ Apresentar',()=>{d.close();ui.callbacks.present({file:file.id});},'btn primary'));
 d.append(head,stage,bottom);ui.root.append(d);positionModal(d);
 if(window.frameElement&&window.parent!==window){try{d.style.height=Math.max(360,window.parent.innerHeight-95)+'px';}catch{}}
 d.showModal();
 let url=null;
 d.addEventListener('close',()=>{if(url){ui.urls.delete(url);URL.revokeObjectURL(url);}d.remove();});
 void (async()=>{
  try{
   const blob=await store.readFile(file.id);if(!blob||!d.isConnected)return;
   url=URL.createObjectURL(blob);ui.urls.add(url);
   if(file.mime==='application/pdf'){
    const frame=el('iframe');frame.title='Prévia de '+file.title;frame.referrerPolicy='no-referrer';frame.src=url;stage.replaceChildren(frame);
   }else{
    const img=el('img');img.src=url;img.alt='Prévia de '+file.title;stage.replaceChildren(img);
   }
  }catch{if(d.isConnected)stage.textContent='Não foi possível abrir a prévia.';}
 })();
}
function card(file){
 const card=el('article','rt-v115-card rt-v113-file');
 const preview=el('button','rt-v115-thumb');preview.type='button';preview.setAttribute('aria-label','Pré-visualizar '+file.title);
 const art=el('div','rt-v115-thumbnail',file.mime==='application/pdf'?'PDF':'IMG');preview.append(art);
 preview.addEventListener('click',()=>showPreview(file));lazyPreview(art,file);
 const body=el('div','rt-v113-file-info rt-v115-card-content');
 body.append(el('h3','',file.title));
 const folder=config().folders.find(f=>f.id===file.folderId);
 const meta=el('p','rt-v115-meta',file.category+' · '+(folder?.name||'Sem pasta')+' · '+formatSize(file.size));body.append(meta);
 if(file.tags?.length){const tags=el('div','rt-v115-tags');for(const tag of file.tags.slice(0,4))tags.append(el('span','',tag));body.append(tags);}
 const actions=el('div','rt-v113-card-actions');
 actions.append(btn('▶ Apresentar',()=>ui.callbacks.present({file:file.id}),'btn primary'));
 const favorite=btn(file.favorite?'★':'☆',()=>{store.change(file.id,{favorite:!file.favorite});redraw();},'btn small');
 favorite.setAttribute('aria-label',file.favorite?'Remover dos favoritos':'Adicionar aos favoritos');
 favorite.setAttribute('aria-pressed',String(!!file.favorite));actions.append(favorite);
 actions.append(btn('Prévia',()=>showPreview(file),'btn small'));
 actions.append(btn('Organizar',()=>fileDetails(file),'btn small'));
 actions.append(btn('Excluir',async()=>{
  if(!window.confirm('Excluir definitivamente '+file.title+' deste navegador?'))return;
  try{await store.remove(file.id);notify('Arquivo excluído.');redraw();}
  catch(e){notify('Falha ao excluir: '+e.message);}
 },'btn small'));
 body.append(actions);card.append(preview,body);return card;
}
function updateCards(){
 const root=ui.content;if(!root)return;
 // Rebuild thumbnails only inside the result area, preserving input focus.
 ui.observer?.disconnect();ui.observer=null;
 for(const url of ui.urls)URL.revokeObjectURL(url);ui.urls.clear();
 const files=sorted(store.metadata());
 const count=ui.root.querySelector('#rt-v115-result-count');
 if(count)count.textContent=files.length+' de '+store.metadata().length+' materiais';
 root.replaceChildren();
 root.className='rt-v115-results rt-v113-list '+(ui.mode==='grid'?'rt-v115-grid':'rt-v115-list');
 if(!files.length){
  const empty=el('div','rt-v113-empty rt-v115-empty');
  empty.append(el('h3','','Nenhum material encontrado'),el('p','','Importe arquivos ou ajuste os filtros para encontrar o que precisa.'));
  root.append(empty);return;
 }
 if('IntersectionObserver' in window){
  ui.observer=new IntersectionObserver(records=>{
   for(const record of records)if(record.isIntersecting){
    const node=record.target;ui.observer?.unobserve(node);
    const file=files.find(x=>x.id===node.dataset.previewId);if(file)void thumbnail(node,file);
   }
  },{root:null,rootMargin:'250px'});
 }
 files.forEach(file=>root.append(card(file)));
}
function redraw(){
 if(!ui.root||!ui.root.isConnected)return;
 clean();
 const root=ui.root;root.replaceChildren();
 root.className='rt-v115-workspace';
 const bar=el('div','rt-v115-header');
 bar.append(el('div','rt-v115-intro'));
 bar.firstChild.append(el('p','rt-v115-eyebrow','BIBLIOTECA · GESTÃO DE MATERIAIS'),el('h1','','Meus arquivos'),
  el('p','','Organize materiais prontos e apresente sem recriar slides.'));
 root.append(bar,dropZone());
 const layout=el('div','rt-v115-layout'),aside=sidebar(),main=el('section','rt-v115-main');
 main.setAttribute('aria-label','Materiais da Biblioteca');
 renderFilterBar(main);
 const results=el('div');ui.content=results;main.append(results);
 layout.append(aside,main);root.append(layout);
 const note=el('p','rt-v113-tip rt-v115-safety','Demonstração: materiais permanecem neste navegador. Não importe documentos de clientes reais. PowerPoint deve ser exportado para PDF.');
 root.append(note);
 updateCards();
}
function mount(root,callbacks){
 clean();ui.root=root;ui.callbacks=callbacks;
 if(!ui.initialized){ui.mode=config().mode;ui.initialized=true;}
 redraw();
}
window.RTPresentationWorkspace=Object.freeze({mount});
})(window);
