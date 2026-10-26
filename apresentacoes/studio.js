/* RealTalent V11.0 — Estúdio de Apresentações. Protótipo LOCAL e somente dados fictícios.
   Fonte de conteúdo: Biblioteca original. Arquivos demonstrativos armazenados apenas no navegador. */
'use strict';
const $=id=>document.getElementById(id);
const STORE='rt-presentation-studio-v11-demo';
const FILEDB='rt-presentation-files-v11-demo';
const MAX_DECKS=60, MAX_SLIDES=100, MAX_FILE=16*1024*1024;
const urlParams=new URLSearchParams(location.search);
const demoStore=()=>window.RTDemoStore||null;
const shareableSlideKinds=new Set(['cover','text','question','library']);
const kindNames={cover:'Capa',text:'Texto e ideias',question:'Pergunta interativa',tool:'Ferramenta',library:'Biblioteca',document:'Documento'};
const themes=['ocean','light','dark'];
const categories=['Visão geral','Conhecimento','Ferramentas','Sessões','Workshop'];
const libraryUrl='../biblioteca/data/indice_pesquisa.json';
const state={decks:[],current:null,selected:0,presenting:false,presentIndex:0,started:0,interval:null,library:[],fileUrls:new Map(),choices:new Map(),toastTimer:null,sessionId:urlParams.get('session')||''};
const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'demo-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const make=(tag,cls='',text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
function clear(node){node.replaceChildren()}
function note(text){$('toast').textContent=text;$('toast').classList.add('shown');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>$('toast').classList.remove('shown'),3400)}
function safeText(value,max=2200){return String(value??'').slice(0,max)}
function slide(kind='text'){
  return {id:uid(),kind:kindNames[kind]?kind:'text',theme:'ocean',title:'',subtitle:'',body:'',notes:'',tool:'wheel',resourceId:'',fileId:'',fileName:'',fileType:''};
}
function createDeck(name='Sem título',items){
  return {id:uid(),title:safeText(name,100),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
    slides:Array.isArray(items)&&items.length?items.map(o=>({...slide(o.kind),...o,id:uid()})):[{...slide('cover'),title:'Nova apresentação',subtitle:'Uma conversa com propósito'}]};
}
function load(){
  try{const d=JSON.parse(localStorage.getItem(STORE)||'[]');state.decks=Array.isArray(d)?d.filter(x=>x&&typeof x.id==='string'&&Array.isArray(x.slides))
    .slice(0,MAX_DECKS).map(d=>({...d,title:safeText(d.title,100),slides:d.slides.slice(0,MAX_SLIDES).map(s=>({...slide(s.kind),...s,id:String(s.id||uid())}))})):[];}
  catch{state.decks=[];}
}
function save(){
  try{localStorage.setItem(STORE,JSON.stringify(state.decks));$('saved').textContent='Salvo localmente';return true}
  catch{$('saved').textContent='Erro ao salvar';note('Armazenamento cheio. Exporte ou remova apresentações antigas.');return false}
}
function deck(){return state.decks.find(x=>x.id===state.current)||null}
function active(){return deck()?.slides[state.selected]||null}
function update(mutator,refresh='stage'){
  const d=deck(),s=active();if(!d||!s)return;
  mutator(s);d.updatedAt=new Date().toISOString();save();
  if(refresh==='all')renderEditor();else if(refresh==='slides'){renderSlides();renderStage();}else renderStage();
}
function openDeck(id){
  const d=state.decks.find(d=>d.id===id);if(!d)return;
  state.current=id;state.selected=0;state.choices.clear();
  $('home').hidden=true;$('editor').hidden=false;renderEditor();measure();
}
function goHome(){
  exitPresentation();state.current=null;$('editor').hidden=true;$('home').hidden=false;renderHome();measure();
}
function addDeck(name,slides){
  if(state.decks.length>=MAX_DECKS)return note('Limite de apresentações nesta demonstração.');
  const d=createDeck(name,slides);state.decks.unshift(d);save();openDeck(d.id);
}
const templateSession=[
  {kind:'cover',title:'Conversa de desenvolvimento',subtitle:'Roteiro demonstrativo · abertura e propósito'},
  {kind:'text',title:'Acordos da conversa',body:'O que esperamos compreender nesta sessão?\nQual resultado será útil ao final?\nComo preservar autonomia e confidencialidade?'},
  {kind:'question',title:'Uma pergunta para refletir',subtitle:'Considere apenas um caso fictício',body:'O que já está funcionando?\nO que pode ser experimentado?\nO que merece aprofundamento?'},
  {kind:'tool',title:'Roda de reflexão',subtitle:'Áreas escolhidas apenas como apoio visual',tool:'wheel'},
  {kind:'text',title:'Próximos passos',body:'Qual ação pequena pode ser experimentada?\nComo acompanhar sem transformar isso em diagnóstico?'}
];
const templateWorkshop=[
  {kind:'cover',title:'Workshop de comunicação',subtitle:'Aprendizado contextual e diálogo'},
  {kind:'text',title:'Princípios de comunicação',body:'Observar situações concretas\nEscutar antes de concluir\nConsiderar outras interpretações'},
  {kind:'question',title:'Como agir diante de um feedback?',body:'Pedir exemplos concretos\nResponder imediatamente\nRefletir antes da conversa\nPropor um próximo passo'},
  {kind:'tool',title:'Transformar ideias em ação',subtitle:'5W2H como ferramenta de organização',tool:'5w2h'}
];
function renderHome(){
  const list=$('deck-list');clear(list);$('deck-count').textContent=state.decks.length+' apresentação(ões)';
  if(!state.decks.length){list.append(make('div','empty-library','Nenhuma apresentação ainda. Comece do zero ou escolha um modelo.'));return;}
  for(const d of state.decks){
    const card=make('article','deck-card'),open=make('button','deck-art');
    open.type='button';open.setAttribute('aria-label','Editar '+d.title);
    open.append(make('small','REALTALENT · APRESENTAÇÃO'),make('h3','',d.title||'Sem título'));
    open.addEventListener('click',()=>openDeck(d.id));
    const foot=make('div','deck-card-footer');
    foot.append(make('small','',d.slides.length+' slide(s)'));
    foot.append(button('Abrir',()=>openDeck(d.id),'secondary'));
    card.append(open,foot);list.append(card);
  }
}
function button(label,callback,cls='subtle'){
  const b=make('button',cls,label);b.type='button';b.addEventListener('click',callback);return b;
}
function renderEditor(){
  const d=deck();if(!d)return;
  $('deck-title').value=d.title;$('slide-total').textContent=d.slides.length+'/'+MAX_SLIDES;
  renderSlides();renderInspector();renderStage();renderSessionControls();
}

function sessionLink(d){
  return d?.presentationLinks?.find(x=>x.sessionId===state.sessionId&&x.deckId===state.current)||null;
}
function getSessionData(){
  const store=demoStore();
  if(!store)return {store:null,d:null,s:null,p:null,link:null};
  const d=store.load(),s=d.sessions.find(x=>x.id===state.sessionId)||null;
  return {store,d,s,p:d.programs.find(p=>p.id===s?.programId)||null,link:sessionLink(d)};
}
function syncSessionChoices(){
  const {d}=getSessionData(),select=$('presentation-session');
  if(!select||!d)return;
  select.replaceChildren(new Option('Selecionar sessão',''));
  for(const s of d.sessions){
    const p=d.programs.find(p=>p.id===s.programId),c=d.clients.find(c=>c.id===p?.clientId);
    if(!p||!c)continue;
    select.add(new Option(c.name+' · '+s.date+' · '+(s.clientTopic||'Sessão'),s.id));
  }
  if(d.sessions.some(s=>s.id===state.sessionId))select.value=state.sessionId;
  else state.sessionId='';
}
function renderSessionControls(){
  if(!deck())return;
  syncSessionChoices();
  const {d,s,p,link}=getSessionData();
  $('session-workflow').hidden=!link;
  $('unlink-session').hidden=!link;
  $('link-session').hidden=!!link;
  $('link-session').disabled=!s||p?.status==='finalizado';
  $('link-status').textContent=!s?'Selecione uma sessão fictícia para relacionar a apresentação.':
    !link?'Sessão selecionada · vínculo ainda não criado.':
    'Apresentação vinculada · '+(link.visibility==='compartilhado'?'material compartilhado':'somente profissional');
  if(!link)return;
  const goals=d.goals.filter(g=>g.programId===p?.id),sel=$('presentation-goal');
  const old=sel.value;sel.replaceChildren();
  for(const g of goals)sel.add(new Option(g.title,g.id));
  if(goals.some(g=>g.id===old))sel.value=old;
  const choices=$('publish-slides'),selected=[...choices.querySelectorAll('input:checked')].map(x=>x.value);
  choices.replaceChildren();
  deck().slides.forEach((slide,index)=>{
    if(!shareableSlideKinds.has(slide.kind))return;
    const label=make('label','publish-choice'),input=make('input');
    input.type='checkbox';input.value=slide.id;input.checked=selected.includes(slide.id);
    label.append(input,make('span','',(index+1)+'. '+(slide.title||'Slide sem título')));
    choices.append(label);
  });
  if(!choices.children.length)choices.append(make('p','muted','Adicione slides de texto, capa, pergunta ou Biblioteca.'));
  const shared=link.visibility==='compartilhado';
  $('withdraw-slides').hidden=!shared;
  $('publish-status').textContent=shared?'Compartilhados '+link.slides.length+' slide(s). Alterações no editor exigem nova publicação.':
    'Ainda não disponibilizado ao participante. Selecione slides e publique explicitamente.';
  $('publish-slides-btn').disabled=!s||s.visibility!=='compartilhado'||p?.status==='finalizado';
  if(s&&s.visibility!=='compartilhado')$('publish-status').textContent='Compartilhamento bloqueado: disponibilize primeiro a sessão no espaço profissional.';
}
function commitDemo(action,id,fn){
  const {d,store}=getSessionData();
  if(!d||!store)return false;
  const result=fn(d,store);
  if(!result)return false;
  store.log(d,'profissional',action,id);
  store.save(d);
  renderSessionControls();
  return result;
}
function linkToSession(){
  const d=deck(),{s,p}=getSessionData();
  if(!d||!s||p?.status==='finalizado')return note('Selecione uma sessão de processo ativo.');
  if(!commitDemo('presentation-link',d.id,(db,store)=>store.linkPresentationToSession(db,s.id,d.id,d.title)))return note('Não foi possível vincular a apresentação.');
  note('Apresentação associada à sessão, privada por padrão.');
}
function publishSlides(){
  const {link}=getSessionData();if(!link)return note('Vincule esta apresentação a uma sessão.');
  const selected=new Set([...$('publish-slides').querySelectorAll('input:checked')].map(x=>x.value));
  const items=deck().slides.filter(s=>selected.has(s.id)&&shareableSlideKinds.has(s.kind));
  if(!items.length||items.length>12)return note('Selecione de 1 a 12 slides educativos.');
  if(!confirm('Compartilhar '+items.length+' slide(s) com o participante fictício? Anotações e documentos não serão incluídos.'))return;
  if(!commitDemo('presentation-publish',link.id,(db,store)=>store.publishPresentationSlides(db,link.id,items)))return note('Não foi possível publicar. A sessão deve estar compartilhada e o processo ativo.');
  note('Slides publicados na Minha Jornada demonstrativa.');
}
function withdrawSlides(){
  const {link}=getSessionData();if(!link)return;
  if(!commitDemo('presentation-withdraw',link.id,(db,store)=>store.withdrawPresentation(db,link.id)))return note('Não foi possível retirar o material.');
  note('Material recolhido da Minha Jornada.');
}
function unlinkSession(){
  const {link}=getSessionData();if(!link||!confirm('Desvincular a apresentação e retirar os materiais desta sessão?'))return;
  if(!commitDemo('presentation-unlink',link.id,(db,store)=>store.unlinkPresentation(db,link.id)))return note('Erro ao desvincular.');
  note('Apresentação desvinculada do atendimento.');
}
function createCommitment(event){
  event.preventDefault();
  const {s,p,link}=getSessionData();if(!s||!p||!link)return;
  const form=event.currentTarget,values=new FormData(form);
  const action=commitDemo('presentation-agreement',s.id,(db,store)=>
    store.createSessionAgreement(db,s.id,{goalId:String(values.get('goal')||''),title:String(values.get('title')||''),
      due:String(values.get('due')||''),visibility:String(values.get('visibility')||'privado')}));
  if(!action)return note('Preencha um objetivo válido, ação concreta e prazo.');
  $('commitment-status').textContent='Compromisso registrado no Plano de Ação · '+(action.visibility==='compartilhado'?'compartilhado':'privado');
  form.querySelector('[name=title]').value='';note('Compromisso associado à sessão e ao objetivo.');
}

function renderSlides(){
  const d=deck(),list=$('slides-list');if(!d)return;clear(list);
  d.slides.forEach((slide,index)=>{
    const b=make('button','slide-list-item');b.type='button';b.setAttribute('aria-current',String(index===state.selected));
    b.setAttribute('aria-label','Slide '+(index+1)+': '+(slide.title||kindNames[slide.kind]));
    b.append(make('span','slide-list-number',String(index+1).padStart(2,'0')),make('span','slide-mini '+slide.theme,slide.title||kindNames[slide.kind]));
    b.addEventListener('click',()=>{state.selected=index;renderEditor();});
    list.append(b);
  });
  $('slide-total').textContent=d.slides.length+'/'+MAX_SLIDES;
  $('move-up').disabled=state.selected===0;$('move-down').disabled=state.selected===d.slides.length-1;
  $('remove-slide').disabled=d.slides.length<=1;
}
function renderInspector(){
  const s=active();if(!s)return;
  $('slide-title').value=s.title;$('slide-subtitle').value=s.subtitle;
  $('slide-body').value=s.body;$('slide-tool').value=s.tool;
  $('slide-theme').value=themes.includes(s.theme)?s.theme:'ocean';
  $('slide-notes').value=s.notes;
  $('subtitle-wrap').hidden=s.kind==='document';
  $('body-wrap').hidden=['document','tool'].includes(s.kind);
  $('body-wrap').querySelector('label');
  $('tool-wrap').hidden=s.kind!=='tool';
  $('library-wrap').hidden=s.kind!=='library';
  $('document-wrap').hidden=s.kind!=='document';
  $('selected-resource').textContent=s.resourceId?'Selecionado: '+s.title+' · '+s.resourceId:'Nenhum conteúdo selecionado';
  $('selected-file').textContent=s.fileName||'Nenhum arquivo importado';
  $('inspector-count').textContent=(state.selected+1)+' / '+deck().slides.length;
  $('slide-type-label').textContent=kindNames[s.kind];
}
function renderStage(){const s=active();if(s)renderSlide($('stage'),s,false);}
function textBlock(tag,value,cls){return make(tag,cls,value)}
function renderSlide(node,s,isPresent){
  clear(node);const stage=make('div','slide-surface '+s.theme+' '+s.kind);
  const label=s.kind==='library'?'BIBLIOTECA DISC/ACER':s.kind==='document'?'ARQUIVO DEMONSTRATIVO':s.kind==='tool'?'FERRAMENTA INTERATIVA':s.kind==='question'?'PERGUNTA PARA CONVERSA':'REALTALENT · DESENVOLVIMENTO';
  stage.append(textBlock('span',label,'slide-eyebrow'));
  if(s.title)stage.append(textBlock('h2',s.title));
  if(s.subtitle&&s.kind!=='document')stage.append(textBlock('p',s.subtitle));
  if(['cover','text','library'].includes(s.kind)){
    stage.append(make('span','slide-rule'));
    if(s.body)stage.append(textBlock('p',s.body));
    if(s.kind==='library')stage.append(textBlock('small','Biblioteca RealTalent · '+(s.resourceId||'Sem material selecionado'),'slide-library-foot'));
  }else if(s.kind==='question'){
    const opts=s.body.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,6);
    const list=make('div','option-list');
    for(const [idx,answer] of opts.entries()){
      const btn=make('button','option-btn',answer);btn.type='button';
      const choiceKey=s.id;btn.setAttribute('aria-pressed',String(state.choices.get(choiceKey)===idx));
      btn.addEventListener('click',()=>{
        state.choices.set(choiceKey,idx);
        for(const [i,b] of [...list.querySelectorAll('button')].entries())b.setAttribute('aria-pressed',String(i===idx));
      });list.append(btn);
    }
    if(!opts.length)list.append(make('p','','Adicione alternativas, uma por linha, no campo Conteúdo.'));
    stage.append(list);
  }else if(s.kind==='tool'){
    const grid=make('div','tool-board '+(s.tool==='5w2h'?'five':'wheel'));
    if(s.tool==='5w2h'){
      const prompts=[['O quê?','What'],['Por quê?','Why'],['Onde?','Where'],['Quando?','When'],['Quem?','Who'],['Como?','How'],['Quanto?','How much']];
      for(const [pt,en] of prompts){const item=make('div','five-item');item.append(make('strong','',pt+' · '+en));
        const field=make('textarea');field.rows=1;field.placeholder='Exemplo fictício';field.setAttribute('aria-label',pt);
        item.append(field);grid.append(item);}
    }else{
      const areas=['Comunicação','Organização','Colaboração','Aprendizagem','Autonomia','Criatividade','Bem-estar','Planejamento'];
      areas.forEach((area,i)=>{const row=make('div','tool-item'),name=make('label','',area),input=make('input'),out=make('output','',String(5));
        const id='wheel-'+(isPresent?'present-':'edit-')+s.id+'-'+i;name.htmlFor=id;input.id=id;
        input.type='range';input.min='0';input.max='10';input.value='5';input.setAttribute('aria-label',area);
        input.addEventListener('input',()=>out.textContent=input.value);row.append(name,input,out);grid.append(row);});
    }
    stage.append(grid);
  }else if(s.kind==='document'){
    const doc=make('div','slide-document');stage.append(doc);
    if(!s.fileId)doc.append(make('p','slide-file-missing','Importe um PDF ou imagem demonstrativa no painel de propriedades.'));
    else queueMicrotask(()=>{void showFile(doc,s)});
  }
  node.append(stage);
}
async function showFile(node,s){
  const current=s.fileId;
  try{
    let url=state.fileUrls.get(current);
    if(!url){const blob=await getFile(current);if(!blob)throw new Error('Arquivo não encontrado');
      url=URL.createObjectURL(blob);state.fileUrls.set(current,url);}
    if(!node.isConnected||s.fileId!==current)return;
    const f=s.fileType==='application/pdf'?make('iframe'):make('img');
    if(f.tagName==='IFRAME'){f.title='PDF demonstrativo '+s.fileName;f.referrerPolicy='no-referrer';f.loading='lazy';}
    else f.alt='Imagem demonstrativa: '+(s.title||s.fileName);
    f.src=url;node.replaceChildren(f);
  }catch{if(node.isConnected)node.replaceChildren(make('p','slide-file-missing','Arquivo indisponível neste navegador. Importe novamente.'));}
}
function selectSlide(index){state.selected=Math.max(0,Math.min(deck().slides.length-1,index));renderEditor();}
function addSlide(kind){
  const d=deck();if(!d)return;
  if(d.slides.length>=MAX_SLIDES)return note('Limite de 100 slides nesta demonstração.');
  const s=slide(kind);s.title=({cover:'Nova seção',text:'Uma ideia importante',question:'Pergunta para refletir',tool:'Roda de reflexão',library:'Conteúdo da Biblioteca',document:'Documento de apoio'})[kind]||'Novo slide';
  if(kind==='question')s.body='Exemplo de alternativa A\nExemplo de alternativa B\nExemplo de alternativa C';
  d.slides.splice(state.selected+1,0,s);save();selectSlide(state.selected+1);
  if(kind==='library')void openLibrary();
  if(kind==='document')$('upload-file').focus();
}
function moveSlide(direction){
  const d=deck(),i=state.selected,j=i+direction;if(!d||j<0||j>=d.slides.length)return;
  [d.slides[i],d.slides[j]]=[d.slides[j],d.slides[i]];save();selectSlide(j);
}
function duplicateSlide(){
  const d=deck();if(!d||d.slides.length>=MAX_SLIDES)return note('Limite de slides atingido.');
  const copied={...active(),id:uid(),title:active().title+' (cópia)'};
  d.slides.splice(state.selected+1,0,copied);save();selectSlide(state.selected+1);
}
function removeSlide(){
  if(deck().slides.length<=1)return note('Uma apresentação precisa de pelo menos um slide.');
  if(!confirm('Excluir este slide da apresentação?'))return;
  deck().slides.splice(state.selected,1);save();selectSlide(Math.max(0,state.selected-1));
}
function duplicateDeck(){
  const d=deck();if(!d||state.decks.length>=MAX_DECKS)return;
  const copy=createDeck(d.title+' (cópia)',d.slides);
  state.decks.unshift(copy);save();openDeck(copy.id);
}
function removeDeck(){
  const d=deck();if(!d||!confirm('Excluir definitivamente esta apresentação local?'))return;
  state.decks=state.decks.filter(x=>x.id!==d.id);save();goHome();note('Apresentação removida.');
}
function timer(){
  if(!state.presenting)return;
  const sec=Math.max(0,Math.floor((Date.now()-state.started)/1000));
  $('presenter-time').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
}
function present(){
  const d=deck();if(!d?.slides.length)return;
  state.presenting=true;state.presentIndex=state.selected;state.started=Date.now();state.choices.clear();
  $('presenter').hidden=false;document.body.style.overflow='hidden';
  clearInterval(state.interval);state.interval=setInterval(timer,1000);timer();renderPresent();$('presenter').focus();measure();
}
function renderPresent(){
  if(!state.presenting)return;
  const d=deck();if(!d)return exitPresentation();
  const i=state.presentIndex,s=d.slides[i];
  renderSlide($('presentation-stage'),s,true);
  $('presenter-count').textContent='Slide '+(i+1)+' de '+d.slides.length;
  $('previous').disabled=i===0;$('next').disabled=i===d.slides.length-1;
  const bar=make('span');bar.style.width=(((i+1)/d.slides.length)*100)+'%';
  $('presenter-progress').replaceChildren(bar);
}
function shift(n){
  if(!state.presenting)return;const d=deck();state.presentIndex=Math.max(0,Math.min(d.slides.length-1,state.presentIndex+n));
  renderPresent();
}
function exitPresentation(){
  if(!state.presenting)return;state.presenting=false;clearInterval(state.interval);state.interval=null;
  if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});
  $('presenter').hidden=true;document.body.style.overflow='';renderStage();$('present').focus();measure();
}
async function fullscreen(){
  if(document.fullscreenElement){await document.exitFullscreen();return}
  try{await $('presenter').requestFullscreen()}catch{note('O navegador bloqueou a tela cheia. O modo apresentação continua disponível.')}
}
async function loadLibrary(){
  try{const response=await fetch(libraryUrl,{cache:'force-cache'});if(!response.ok)throw new Error('Biblioteca indisponível');
    const data=await response.json();state.library=Array.isArray(data)?data.filter(r=>r&&r.id&&r.title).slice(0,500):[];
  }catch{state.library=[];}
}
async function openLibrary(){
  if(!state.library.length)await loadLibrary();
  $('library-search').value='';renderLibrary();$('library-dialog').showModal();$('library-search').focus();
}
function renderLibrary(){
  const q=$('library-search').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  const results=$('library-results');clear(results);
  const found=state.library.filter(r=>([r.title,r.subtitle,r.kind,r.group,r.keywords].join(' ')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q)).slice(0,35);
  if(!found.length)return results.append(make('p','muted','Nenhum conteúdo encontrado ou Biblioteca indisponível.'));
  for(const r of found){
    const b=make('button','library-result');b.type='button';
    b.append(make('strong','',r.title),make('small','',r.kind+' · '+(r.subtitle||r.group||'')));
    b.addEventListener('click',()=>{
      const slideNow=active();if(!slideNow)return;
      update(s=>{s.kind='library';s.resourceId=safeText(r.id,150);s.title=safeText(r.title,130);
        s.subtitle=safeText(r.subtitle||'',280);
        s.body=safeText([r.body,...(Array.isArray(r.points)?r.points.slice(0,4).map(p=>'• '+p):[])].filter(Boolean).join('\n'),1500);},'all');
      $('library-dialog').close();note('Conteúdo incluído como slide editável.');
    });results.append(b);
  }
}
function fileDatabase(){
  return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return reject(new Error('IndexedDB indisponível'));
    const request=indexedDB.open(FILEDB,1);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('assets'))request.result.createObjectStore('assets')};
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
}
async function putFile(id,blob){
  const db=await fileDatabase();
  return new Promise((resolve,reject)=>{const tx=db.transaction('assets','readwrite');
    tx.objectStore('assets').put(blob,id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)};});
}
async function getFile(id){
  const db=await fileDatabase();
  return new Promise((resolve,reject)=>{const tx=db.transaction('assets','readonly');const req=tx.objectStore('assets').get(id);
    req.onsuccess=()=>{db.close();resolve(req.result||null)};req.onerror=()=>{db.close();reject(req.error)};});
}
async function importFile(event){
  const f=event.target.files?.[0],s=active();event.target.value='';
  if(!f||!s||s.kind!=='document')return;
  if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(f.type))return note('Somente PDF, JPEG, PNG ou WebP são suportados.');
  if(f.size>MAX_FILE)return note('O arquivo precisa ter no máximo 16 MB.');
  const id=uid();
  try{await putFile(id,f);state.fileUrls.set(id,URL.createObjectURL(f));update(s=>{s.fileId=id;s.fileName=safeText(f.name,180);s.fileType=f.type;if(!s.title||s.title==='Documento de apoio')s.title=safeText(f.name.replace(/\.[^.]+$/,''),130);},'all');
    note('Arquivo importado no navegador demonstrativo. Não há sincronização.');}
  catch{note('Não foi possível salvar o arquivo localmente. Verifique o espaço disponível.');}
}
function measure(){
  try{if(window.parent===window)return;
    const height=Math.ceil(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight));
    window.parent.postMessage({type:'rt:module-height',module:'presentations',height:Math.min(16000,Math.max(600,height))},location.origin);
  }catch{}
}
function attach(){
  $('new-deck').addEventListener('click',()=>addDeck());
  document.querySelectorAll('[data-template]').forEach(b=>b.addEventListener('click',()=>addDeck(b.dataset.template==='session'?'Sessão de desenvolvimento':'Workshop de comunicação',b.dataset.template==='session'?templateSession:templateWorkshop)));
  $('editor-back').addEventListener('click',goHome);
  $('presentation-session').addEventListener('change',e=>{state.sessionId=e.target.value;renderSessionControls();});
  $('link-session').addEventListener('click',linkToSession);
  $('unlink-session').addEventListener('click',unlinkSession);
  $('publish-slides-btn').addEventListener('click',publishSlides);
  $('withdraw-slides').addEventListener('click',withdrawSlides);
  $('presentation-action-form').addEventListener('submit',createCommitment);
  $('presenter-action').addEventListener('click',()=>{exitPresentation();$('session-panel').scrollIntoView({block:'center'});$('presentation-action-form [name=title]').focus();});
  $('deck-title').addEventListener('input',e=>{const d=deck();if(!d)return;d.title=safeText(e.target.value,100);d.updatedAt=new Date().toISOString();save();});
  $('duplicate-deck').addEventListener('click',duplicateDeck);$('delete-deck').addEventListener('click',removeDeck);
  $('add-slide').addEventListener('click',() => addSlide($('slide-kind').value));
  $('move-up').addEventListener('click',()=>moveSlide(-1));$('move-down').addEventListener('click',()=>moveSlide(1));
  $('duplicate-slide').addEventListener('click',duplicateSlide);$('remove-slide').addEventListener('click',removeSlide);
  for(const [id,key] of [['slide-title','title'],['slide-subtitle','subtitle'],['slide-body','body'],['slide-notes','notes']]){
    $(id).addEventListener('input',e=>update(s=>{s[key]=safeText(e.target.value,key==='notes'?2000:key==='body'?2200:280)},key==='title'?'slides':'stage'));
  }
  $('slide-tool').addEventListener('change',e=>update(s=>s.tool=e.target.value,'all'));
  $('slide-theme').addEventListener('change',e=>update(s=>s.theme=e.target.value,'slides'));
  $('pick-library').addEventListener('click',()=>void openLibrary());
  $('close-library').addEventListener('click',()=>$('library-dialog').close());
  $('library-search').addEventListener('input',renderLibrary);
  $('upload-file').addEventListener('change',e=>void importFile(e));
  $('present').addEventListener('click',present);
  $('previous').addEventListener('click',()=>shift(-1));$('next').addEventListener('click',()=>shift(1));
  $('toggle-fullscreen').addEventListener('click',()=>void fullscreen());
  $('exit-presenter').addEventListener('click',exitPresentation);
  document.addEventListener('keydown',e=>{
    if(!state.presenting)return;
    if(e.key==='Escape'){exitPresentation();return}
    if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
    if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();shift(1)}
    if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();shift(-1)}
    if(e.key==='Home'){e.preventDefault();state.presentIndex=0;renderPresent()}
    if(e.key==='End'){e.preventDefault();state.presentIndex=deck().slides.length-1;renderPresent()}
  });
  window.addEventListener('resize',measure);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>measure()).observe($('main'));
}
load();attach();renderHome();void loadLibrary();measure();
if(urlParams.get('deck')&&state.decks.some(d=>d.id===urlParams.get('deck')))openDeck(urlParams.get('deck'));
else if(state.sessionId){const assigned=demoStore()?.load()?.presentationLinks?.find(x=>x.sessionId===state.sessionId);if(assigned&&state.decks.some(d=>d.id===assigned.deckId))openDeck(assigned.deckId);}
