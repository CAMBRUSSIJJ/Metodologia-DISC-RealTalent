/* RealTalent V11.7 — construtor de formulários educativos, local, sem scripts externos.
   Seções e perguntas pertencem à definição. Atribuições usam cópia imutável. */
(function(root){
'use strict';
const T=root.RTCustomTools;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>root.crypto?.randomUUID?.()||'q-'+Math.random().toString(36).slice(2);
const types=[['curta','Resposta curta'],['paragrafo','Texto longo'],['unica','Escolha única'],['multipla','Múltiplas escolhas'],['escala','Escala de 1 a 5']];
let active='',draft=null,preview=false;
const question=()=>({id:uid(),label:'',type:'paragrafo',required:true,options:['Opção 1','Opção 2']});
const section=()=>({id:uid(),title:'Nova seção',description:'',questions:[question()]});
function blank(){return {title:'',purpose:'',category:'Reflexão guiada',instructions:'',sections:[section()]};}
function start(toolId=''){
 if(draft&&active===toolId)return;
 active=toolId;preview=false;
 const found=T.list().find(x=>x.id===toolId);
 draft=found?JSON.parse(JSON.stringify(found)):blank();
 if(!draft.sections?.length)draft.sections=[section()];
}
const attr=(value='')=>esc(value);
function selectType(q,si,qi){
 return '<select data-qp="type" data-section="'+si+'" data-question="'+qi+'" aria-label="Tipo da pergunta">'+
 types.map(([id,label])=>'<option value="'+id+'"'+(q.type===id?' selected':'')+'>'+label+'</option>').join('')+'</select>';
}
function editQuestion(q,si,qi){
 const choices=['unica','multipla'].includes(q.type);
 return '<article class="rt-v117-question" data-question-card="'+si+'-'+qi+'">'+
 '<div class="rt-v117-question-top"><span>PERGUNTA '+(qi+1)+'</span><div class="rt-v117-icon-actions">'+
 action('q-up','↑','Subir pergunta',si,qi)+action('q-down','↓','Descer pergunta',si,qi)+action('q-remove','Excluir','Excluir pergunta',si,qi)+'</div></div>'+
 '<div class="rt-v117-question-fields"><label>Enunciado<input data-qp="label" data-section="'+si+'" data-question="'+qi+'" value="'+attr(q.label)+'" maxlength="180" placeholder="Digite a pergunta que deseja apresentar" required></label>'+
 '<label>Tipo de resposta'+selectType(q,si,qi)+'</label></div>'+
 (choices?'<label class="rt-v117-options">Opções (uma por linha)<textarea data-qp="options" data-section="'+si+'" data-question="'+qi+'" rows="4" maxlength="730" placeholder="Opção A&#10;Opção B">'+attr(q.options.join('\n'))+'</textarea></label>':'')+
 '<label class="rt-v117-check"><input type="checkbox" data-qp="required" data-section="'+si+'" data-question="'+qi+'"'+(q.required?' checked':'')+'> Resposta obrigatória</label></article>';
}
function action(kind,text,label,si=-1,qi=-1){
 return '<button type="button" data-v117-action="'+kind+'" data-section="'+si+'" data-question="'+qi+'" aria-label="'+label+'" class="rt-v117-icon-btn">'+text+'</button>';
}
function editSection(sec,si){
 return '<section class="rt-v117-section" data-section-card="'+si+'"><div class="rt-v117-section-head"><div><span>SEÇÃO '+(si+1)+'</span><h2>Organização das perguntas</h2></div><div class="rt-v117-icon-actions">'+
  action('s-up','↑','Subir seção',si)+action('s-down','↓','Descer seção',si)+action('s-remove','Excluir seção','Excluir seção',si)+'</div></div>'+
  '<div class="rt-v117-section-fields"><label>Título da seção<input data-sp="title" data-section="'+si+'" maxlength="90" required value="'+attr(sec.title)+'" placeholder="Ex.: Reflexão inicial"></label>'+
  '<label>Descrição (opcional)<input data-sp="description" data-section="'+si+'" maxlength="280" value="'+attr(sec.description)+'" placeholder="Orientação curta para esta etapa"></label></div>'+
  '<div class="rt-v117-question-list">'+sec.questions.map((q,qi)=>editQuestion(q,si,qi)).join('')+'</div>'+
  '<button type="button" data-v117-action="q-add" data-section="'+si+'" class="rt-v117-add-question">+ Adicionar pergunta</button></section>';
}
function previewForm(){
 return '<div class="rt-v117-preview">'+draft.sections.map((sec,si)=>'<section><small>ETAPA '+(si+1)+'</small><h2>'+esc(sec.title)+'</h2>'+
 (sec.description?'<p>'+esc(sec.description)+'</p>':'')+sec.questions.map(q=>{
 const label=esc(q.label||'Pergunta sem enunciado')+(q.required?' <span aria-label="Obrigatória">*</span>':'');
 if(q.type==='curta')return '<label>'+label+'<input disabled placeholder="Resposta curta"></label>';
 if(q.type==='paragrafo')return '<label>'+label+'<textarea disabled rows="3" placeholder="Resposta em texto"></textarea></label>';
 if(q.type==='escala')return '<fieldset><legend>'+label+'</legend>'+[1,2,3,4,5].map(i=>'<label class="rt-v117-preview-choice"><input type="radio" disabled>'+i+'</label>').join('')+'</fieldset>';
 return '<fieldset><legend>'+label+'</legend>'+q.options.map(o=>'<label class="rt-v117-preview-choice"><input disabled type="'+(q.type==='multipla'?'checkbox':'radio')+'"> '+esc(o)+'</label>').join('')+'</fieldset>';
 }).join('')+'</section>').join('')+'<p>Prévia ilustrativa — nenhuma resposta é salva nesta tela.</p></div>';
}
function render(toolId=''){
 start(toolId);
 const count=draft.sections.reduce((sum,s)=>sum+s.questions.length,0);
 return '<div class="rt-v117-shell"><header class="rt-v117-header"><div><a href="#ferramentas?tab=minhas">← Minhas ferramentas</a><span class="rt-v117-kicker">CONSTRUTOR DE FERRAMENTAS</span><h1>'+(active?'Editar formulário':'Nova ferramenta personalizada')+'</h1><p>Monte etapas e perguntas para uma atividade educativa. O formulário só será enviado quando atribuído dentro de um cliente.</p></div>'+
 '<div class="rt-v117-header-actions"><button type="button" data-v117-action="preview" class="btn-secondary">'+(preview?'Voltar à edição':'Pré-visualizar')+'</button><button type="submit" form="rt-v117-builder-form" class="btn-primary">Salvar ferramenta</button></div></header>'+
 '<form id="rt-v117-builder-form" autocomplete="off"><section class="rt-v117-overview"><div class="rt-v117-overview-head"><h2>Informações da ferramenta</h2><span>'+draft.sections.length+' seção(ões) · '+count+' pergunta(s)</span></div>'+
 '<div class="rt-v117-basic"><label>Nome da ferramenta<input name="title" maxlength="110" required value="'+attr(draft.title)+'" placeholder="Ex.: Roteiro de desenvolvimento de liderança"></label>'+
 '<label>Categoria<select name="category">'+['Reflexão guiada','Coaching','Desenvolvimento','Comunicação','Outros'].map(x=>'<option value="'+x+'"'+(x===draft.category?' selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
 '<label>Objetivo (opcional)<input name="purpose" maxlength="260" value="'+attr(draft.purpose)+'" placeholder="Finalidade da atividade"></label>'+
 '<label>Instruções gerais<input name="instructions" maxlength="1800" value="'+attr(draft.instructions)+'" placeholder="Breve instrução ao participante"></label></div></section>'+
 (preview?previewForm():'<div class="rt-v117-section-stack">'+draft.sections.map(editSection).join('')+
 '<button type="button" data-v117-action="s-add" class="rt-v117-add-section">+ Adicionar seção</button></div>')+
 '<footer class="rt-v117-footer"><span>Uso educacional, sem geração de laudos ou pontuação psicológica.</span><button type="submit" class="btn-primary">Salvar ferramenta</button></footer></form></div>';
}
function capture(){
 const form=document.getElementById('rt-v117-builder-form');if(!form||!draft)return;
 for(const name of ['title','purpose','category','instructions'])draft[name]=form.elements[name]?.value??draft[name];
 form.querySelectorAll('[data-sp]').forEach(el=>{
  const sec=draft.sections[Number(el.dataset.section)];if(sec)sec[el.dataset.sp]=el.value;
 });
 form.querySelectorAll('[data-qp]').forEach(el=>{
  const q=draft.sections[Number(el.dataset.section)]?.questions[Number(el.dataset.question)];if(!q)return;
  if(el.dataset.qp==='required')q.required=el.checked;
  else if(el.dataset.qp==='options')q.options=el.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  else q[el.dataset.qp]=el.value;
 });
}
function refresh(){root.dispatchEvent(new Event('hashchange'));}
function swapIndex(list,a,b){if(b<0||b>=list.length)return;[list[a],list[b]]=[list[b],list[a]];}
document.addEventListener('click',event=>{
 const target=event.target.closest('[data-v117-action]');if(!target)return;
 const form=target.closest('#rt-v117-builder-form')||document.getElementById('rt-v117-builder-form');
 if(!form)return;
 event.preventDefault();capture();
 const act=target.dataset.v117Action,si=Number(target.dataset.section),qi=Number(target.dataset.question);
 const sec=draft.sections[si];
 if(act==='preview'){preview=!preview;refresh();return;}
 if(act==='s-add'){if(draft.sections.length>=8){alert('Máximo de oito seções.');return;}draft.sections.push(section());}
 if(act==='s-remove'){if(draft.sections.length<=1){alert('Mantenha ao menos uma seção.');return;}if(!confirm('Excluir esta seção e suas perguntas?'))return;draft.sections.splice(si,1);}
 if(act==='s-up')swapIndex(draft.sections,si,si-1);
 if(act==='s-down')swapIndex(draft.sections,si,si+1);
 if(act==='q-add'){if(!sec)return;if(sec.questions.length>=12||draft.sections.reduce((n,x)=>n+x.questions.length,0)>=40){alert('Limite de perguntas atingido.');return;}sec.questions.push(question());}
 if(act==='q-remove'){if(!sec)return;if(sec.questions.length<=1){alert('Mantenha uma pergunta por seção.');return;}sec.questions.splice(qi,1);}
 if(act==='q-up'&&sec)swapIndex(sec.questions,qi,qi-1);
 if(act==='q-down'&&sec)swapIndex(sec.questions,qi,qi+1);
 refresh();
});
document.addEventListener('change',event=>{
 if(!event.target.matches('#rt-v117-builder-form [data-qp="type"]'))return;
 const q=draft?.sections[Number(event.target.dataset.section)]?.questions[Number(event.target.dataset.question)];
 if(q){capture();q.type=event.target.value;refresh();}
});
document.addEventListener('submit',event=>{
 if(event.target.id!=='rt-v117-builder-form')return;event.preventDefault();capture();
 try{
  if(!draft.title||draft.title.trim().length<4)throw Error('Dê um nome à ferramenta (mínimo de quatro caracteres).');
  // Títulos e campos vazios são detectados antes da persistência.
  const sections=T.normalizeSections(draft.sections,true);
  T.upsert({...draft,sections,instructions:draft.instructions?.trim()||'Responda às perguntas de reflexão.'},active);
  draft=null;active='';preview=false;root.location.hash='#ferramentas?tab=minhas';
 }catch(e){alert(e.message||'Não foi possível salvar a ferramenta.');}
});
root.RTToolBuilder=Object.freeze({render});
})(window);
