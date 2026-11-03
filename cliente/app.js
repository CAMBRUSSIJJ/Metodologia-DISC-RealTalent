/* RealTalent Minha Jornada V5 – demonstração local SEM autenticação. NÃO usar dados reais. */
'use strict';
const S=window.RTDemoStore;
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateFmt=s=>s?new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}):'Não definido';
const days=(s)=>!s?'':new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit'});
const mon=(s)=>!s?'':new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{month:'short'}).replace('.','').toUpperCase();
const headers={disc:['Minhas atividades','Mapeamento DISC/ACER'],instrumentos:['Minhas atividades','Reflexões guiadas'],jornada:['Início','Seu próximo passo'],atividades:['Minhas atividades','Atividades e instrumentos'],encontros:['Meus encontros','Agenda compartilhada'],desenvolvimento:['Meu desenvolvimento','Objetivos e jornada'],materiais:['Materiais','Conteúdos compartilhados'],reflexoes:['Minhas reflexões','Registros pessoais'],perfil:['Meu perfil','Identidade demonstrativa']};
let db=S.load();
const qp=new URLSearchParams(location.search);
let selected=qp.get('demo')||sessionStorage.getItem('rt-v5-client-demo')||'c1';
if(!db.clients.some(c=>c.id===selected))selected=db.clients[0]?.id||'';
const view=()=>S.clientView(db,selected);
const prog=v=>v.programs.find(p=>p.id===v.actions[0]?.programId);
const program=v=>v.programs.find(p=>p.status==='em andamento')||v.programs[0];
const rt99Goal=(v,pid,gid)=>v.goals.find(g=>g.id===gid&&g.programId===pid)||v.goals.find(g=>g.programId===pid);

const actionsOf=(v,id)=>v.actions.filter(a=>a.programId===id);
const complete=v=>v.actions.filter(a=>a.status==='concluido').length;
const percent=v=>v.actions.length?Math.round(100*complete(v)/v.actions.length):0;
const firstAction=v=>v.actions.filter(a=>a.status!=='concluido').sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'))[0];
const sessionMoment=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s?.date||'')||!/^([01]\d|2[0-3]):[0-5]\d$/.test(s?.time||''))return NaN;return new Date(s.date+'T'+s.time+':00').getTime();};
const upcoming=v=>v.sessions.filter(s=>s.status==='agendada'&&Number.isFinite(sessionMoment(s))&&sessionMoment(s)>Date.now()).sort((a,b)=>sessionMoment(a)-sessionMoment(b));
const awaitingConfirmation=v=>v.sessions.filter(s=>s.status==='agendada'&&Number.isFinite(sessionMoment(s))&&sessionMoment(s)<=Date.now()).sort((a,b)=>sessionMoment(b)-sessionMoment(a));
const btn=(label,act,id='',cls='btn')=>`<button type="button" data-act="${act}" data-id="${esc(id)}" class="${cls}">${label}</button>`;
const empty=(a,b)=>`<div class="empty"><b>${a}</b>${b}</div>`;
const heading=(ey,title,subtitle,buttons='')=>`<header class="page-head ${buttons?'w-actions':''}"><div><span class="eyebrow">${ey}</span><h1>${title}</h1><p>${subtitle}</p></div>${buttons?`<div>${buttons}</div>`:''}</header>`;
const sessionsList=(v,max=20)=>upcoming(v).slice(0,max).map(s=>`<div class="row"><div class="date-box"><strong>${days(s.date)}</strong>${mon(s.date)}</div><div class="row-main"><b>${esc(s.focus)}</b><p>${dateFmt(s.date)} · ${esc(s.time)} · encontro demonstrativo</p></div><span class="chip">Agendado</span></div>`).join('')||empty('Nenhum encontro agendado','O profissional adicionará os encontros ao processo.');
const guidanceList=v=>v.guidance.slice().reverse().map(g=>`<div class="row"><div class="row-symbol">✧</div><div class="row-main"><b>Orientação do profissional</b><p>${esc(g.text)}</p><span class="muted">Compartilhada em ${dateFmt(g.created)}</span></div></div>`).join('')||empty('Nenhuma orientação compartilhada','Quando houver uma orientação liberada pelo profissional, ela aparecerá aqui.');
function actionRow(a){return `<div class="row"><div class="row-symbol">${a.status==='concluido'?'✓':'◎'}</div><div class="row-main"><b>${esc(a.title)}</b><p>${esc(a.resource||'Atividade de desenvolvimento')} · Prazo ${dateFmt(a.due)}</p></div><span class="chip ${a.status==='concluido'?'done':'pending'}">${a.status==='concluido'?'Concluída':'Pendente'}</span>${btn(a.status==='concluido'?'Reabrir':'Concluir','toggle',a.id,'btn small')}</div>`;}

function customFields(i){
 return i.sections.map((section,index)=>'<section class="rt-v117-client-section"><span>ETAPA '+(index+1)+'</span><h3>'+esc(section.title)+'</h3>'+
 (section.description?'<p>'+esc(section.description)+'</p>':'')+section.questions.map(q=>{
 const label=esc(q.label)+(q.required?' <small>Obrigatória</small>':'');const name='q_'+esc(q.id);
 if(q.type==='curta')return '<label class="field">'+label+'<input name="'+name+'" maxlength="240"'+(q.required?' required':'')+'></label>';
 if(q.type==='paragrafo')return '<label class="field">'+label+'<textarea name="'+name+'" rows="3" maxlength="1400"'+(q.required?' required':'')+'></textarea></label>';
 if(q.type==='escala')return '<fieldset class="rt-v117-choice"><legend>'+label+'</legend>'+[1,2,3,4,5].map(n=>'<label><input type="radio" name="'+name+'" value="'+n+'"'+(q.required?' required':'')+'> '+n+'</label>').join('')+'</fieldset>';
 return '<fieldset class="rt-v117-choice"><legend>'+label+'</legend>'+q.options.map(opt=>'<label><input type="'+(q.type==='multipla'?'checkbox':'radio')+'" name="'+name+'" value="'+esc(opt)+'"'+(q.required&&q.type==='unica'?' required':'')+'> '+esc(opt)+'</label>').join('')+'</fieldset>';
 }).join('')+'</section>').join('');
}
const prompts=['Descreva uma situação de comunicação vivida ou imaginada.','Como você costuma reagir nessa situação?','Que atitude gostaria de experimentar em uma próxima ocasião?'];
function instrumentRow(i){return `<div class="rt-assignment"><div><strong>${esc(i.title)}</strong><p>${esc(i.instructions)}</p><span class="chip">${i.status==='atribuido'?'Pendente':i.feedback?'Devolutiva disponível':'Enviada ao profissional'}</span>${i.responses?`<p class="muted">Suas respostas foram registradas nesta demonstração.</p>`:''}${i.feedback?`<div class="rt-feedback"><b>Orientação compartilhada:</b><p>${esc(i.feedback)}</p></div>`:''}</div>${i.status==='atribuido'?btn('Responder atividade','respond-instrument',i.id,'btn solid'):''}</div>`;}
function instrumentos(v){return heading('REFLEXÃO GUIADA','Minhas atividades guiadas','Exercícios educativos propostos pelo profissional. Não são testes psicológicos nem geram pontuação DISC/ACER.')+`<div class="columns"><div class="stack"><section class="card"><div class="card-heading"><h2>Atividades atribuídas</h2><span class="chip">${v.instruments.length}</span></div>${v.instruments.map(instrumentRow).join('')||empty('Nenhum exercício atribuído','Seu profissional poderá compartilhar uma prática guiada.')}</section></div><div class="stack"><section class="card"><h2>Antes de começar</h2><p>As respostas servem de apoio à reflexão conjunta. Use apenas exemplos fictícios nesta versão local; não insira informações pessoais ou de saúde.</p></section></div></div>`;}
// V9.8: ordem explícita de prioridade. Nenhum score clínico ou interpretação automática.
const rt98Today=()=>new Date().toLocaleDateString('sv-SE');
const rt98DiscTasks=v=>(v.discAssignments||[]).filter(t=>t.status==='atribuido'||t.status==='respondido');
function nextStep(v){
 const pendingActions=v.actions.filter(a=>a.status!=='concluido').sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
 const late=pendingActions.find(a=>a.due&&a.due<rt98Today());
 if(late)return {kind:'Prazo a revisar',title:late.title,detail:'Prazo combinado: '+dateFmt(late.due),cta:'Ver compromisso',action:'goto',id:'atividades',icon:'!'};
 const started=rt98DiscTasks(v).find(t=>t.status==='atribuido'&&t.startedAt);
 if(started)return {kind:'Em andamento',title:'Continuar seu DISC/ACER',detail:'Seu questionário está salvo neste navegador demonstrativo.',cta:'Continuar questionário',action:'disc-start',id:started.id,icon:'◈'};
 const disc=rt98DiscTasks(v).find(t=>t.status==='atribuido');
 if(disc)return {kind:'Para fazer',title:'Responder DISC/ACER',detail:'Mapeamento atribuído pelo profissional. Você pode pausar e retomar.',cta:'Iniciar questionário',action:'disc-start',id:disc.id,icon:'◈'};
 const guide=v.instruments.find(i=>i.status==='atribuido');
 if(guide)return {kind:'Para fazer',title:guide.title,detail:guide.instructions,cta:'Responder atividade',action:'respond-instrument',id:guide.id,icon:'✧'};
 const action=pendingActions[0];
 if(action)return {kind:'Próximo compromisso',title:action.title,detail:action.due?'Prazo combinado: '+dateFmt(action.due):'Atividade prevista no plano',cta:'Ver compromisso',action:'goto',id:'atividades',icon:'✓'};
 return {kind:'Seu espaço',title:'Sua jornada está em dia',detail:'Você pode registrar uma reflexão ou consultar os encontros.',cta:'Registrar reflexão',action:'new-reflection',id:'',icon:'✧'};
}
function jornada(v){
 const p=program(v),next=upcoming(v)[0],late=awaitingConfirmation(v)[0],n=nextStep(v);
 return heading('MINHA JORNADA','Olá, '+esc(v.client.name)+'!','Veja o que precisa da sua atenção e acompanhe os objetivos combinados.')+
 `<div class="rt98-landing"><section class="rt98-primary" aria-labelledby="rt98-next-heading"><div class="rt98-primary-overline"><span class="rt98-kind">${esc(n.kind)}</span><span class="rt98-primary-icon" aria-hidden="true">${n.icon}</span></div><p class="rt98-kicker">Seu próximo passo</p><h2 id="rt98-next-heading">${esc(n.title)}</h2><p class="rt98-next-detail">${esc(n.detail)}</p>${btn(esc(n.cta)+' →',n.action,n.id,'btn solid rt98-main-cta')}</section>
 <div class="rt98-secondary"><section class="rt98-mini"><div class="rt98-mini-top"><h2>Meu objetivo atual</h2>${btn('Ver desenvolvimento →','goto','desenvolvimento','btn small')}</div><p class="rt98-strong">${esc(p?.goal||v.client.focus)}</p><p class="rt98-caption">${p?'Etapa atual: '+esc(p.stage):'Aguardando o primeiro processo'}</p></section>
 <section class="rt98-mini"><div class="rt98-mini-top"><h2>Meu próximo encontro</h2>${btn('Ver encontros →','goto','encontros','btn small')}</div>${next?`<p class="rt98-strong">${dateFmt(next.date)} · ${esc(next.time)}</p><p class="rt98-caption">${esc(next.focus)}</p>`:late?`<p class="rt98-strong">Encontro aguardando confirmação</p><p class="rt98-caption">${dateFmt(late.date)} · ${esc(late.time)}. O profissional confirmará a situação.</p>`:`<p class="rt98-caption">Nenhum encontro futuro compartilhado.</p>`}</section></div>
 <section class="rt99-home-objectives" aria-label="Objetivos e compromissos"><div><h2>Meu desenvolvimento, passo a passo</h2><p>Os compromissos estão relacionados aos objetivos combinados com o profissional.</p></div>${(v.goals||[]).filter(g=>g.programId===p?.id).slice(0,2).map(g=>`<div class="rt99-home-goal"><strong>${esc(g.title)}</strong><span>${v.actions.filter(a=>a.goalId===g.id&&a.status==='pendente').length} compromisso(s) para acompanhar</span></div>`).join('')}${btn('Ver minha jornada →','goto','desenvolvimento','btn small')}</section><section class="rt98-lower" aria-label="Outros recursos"><div><h2>Seus compromissos</h2><p>${v.actions.filter(a=>a.status==='pendente').length} por fazer · ${v.actions.filter(a=>a.status==='concluido').length} concluído(s). Não é uma medida de evolução psicológica.</p>${btn('Abrir minhas atividades →','goto','atividades','btn small')}</div><div><h2>Minhas reflexões</h2><p>Um espaço para registrar o que percebeu. Você controla o compartilhamento na demonstração.</p>${btn('Registrar reflexão +','new-reflection','','btn small')} ${btn('Ver registros','goto','reflexoes','btn small')}</div></section></div>`;
}
let rt98ActivityFilter='fazer';
function rt98Activities(v){
 const result=[];
 for(const d of rt98DiscTasks(v)){
   const finished=d.status==='respondido',ongoing=!finished&&!!d.startedAt;
   result.push({kind:'DISC/ACER',name:'Mapeamento DISC/ACER',detail:'Questionário de autoconhecimento · 20 perguntas e duas etapas de adjetivos',state:finished?'concluidas':ongoing?'andamento':'fazer',due:d.assignedAt,html:finished?d.feedback?`<div class="rt98-feedback"><strong>Devolutiva compartilhada</strong><p>${esc(d.feedback)}</p></div>`:'' : '',cta:finished?'':btn(ongoing?'Continuar DISC/ACER':'Começar DISC/ACER','disc-start',d.id,'btn solid')});
 }
 for(const i of v.instruments){
   const done=Boolean(i.responses)||i.status==='respondido'||i.status==='devolvido';const goal=rt99Goal(v,i.programId,i.goalId);result.push({kind:i.kind==='formulario-personalizado'?'Formulário personalizado':'Reflexão guiada',name:i.title,detail:(goal?'Objetivo: '+goal.title+' · ':'')+i.instructions,state:done?'concluidas':'fazer',due:i.assignedAt,html:done&&i.feedback?`<div class="rt98-feedback"><strong>Orientação compartilhada</strong><p>${esc(i.feedback)}</p></div>`:'',cta:done?'':btn('Responder atividade','respond-instrument',i.id,'btn solid')});
 }
 for(const a of v.actions){
   const done=a.status==='concluido';result.push({kind:'Compromisso',name:a.title,detail:(rt99Goal(v,a.programId,a.goalId)?.title||'Objetivo do processo')+' · '+(a.due?'Prazo: '+dateFmt(a.due):'Sem prazo'),state:done?'concluidas':'fazer',due:a.due,html:a.experience?`<div class="rt99-experience-note"><strong>${a.experience.outcome==='tentada'?'Tentou e encontrou dificuldades':'Conseguiu realizar'}</strong>${a.experience.note?`<p>${esc(a.experience.note)}</p>`:''}</div>`:'',cta:done?'':btn('Registrar minha experiência','report-action',a.id,'btn solid')});
 }
 return result;
}
function atividades(v){
 const items=rt98Activities(v),counts={fazer:items.filter(t=>t.state==='fazer').length,andamento:items.filter(t=>t.state==='andamento').length,concluidas:items.filter(t=>t.state==='concluidas').length};
 const filters=[['fazer','Para fazer'],['andamento','Em andamento'],['concluidas','Concluídas']];
 const current=filters.some(x=>x[0]===rt98ActivityFilter)?rt98ActivityFilter:'fazer';
 const visible=items.filter(x=>x.state===current).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
 return heading('ATIVIDADES E INSTRUMENTOS','Minhas atividades','Todos os recursos enviados pelo profissional em um único lugar. Escolha uma atividade para continuar.')+
 `<div class="rt98-activity-shell"><div class="rt98-tabs" role="group" aria-label="Filtrar atividades">${filters.map(([key,label])=>`<button type="button" data-act="activities-filter" data-id="${key}" class="rt98-tab ${current===key?'active':''}" aria-pressed="${current===key}">${label} <span>${counts[key]}</span></button>`).join('')}</div><div class="rt98-activity-list" aria-live="polite">${visible.map(t=>`<article class="rt98-activity"><div class="rt98-activity-copy"><span class="rt98-activity-kind">${esc(t.kind)}</span><h2>${esc(t.name)}</h2><p>${esc(t.detail)}</p>${t.html}</div>${t.cta?`<div class="rt98-activity-action">${t.cta}</div>`:`<span class="rt98-state-done">✓ Concluída</span>`}</article>`).join('')||empty(current==='fazer'?'Nada pendente':current==='andamento'?'Nenhuma atividade em andamento':'Nenhuma atividade concluída',current==='fazer'?'Seu profissional poderá atribuir novas atividades.':'Seus registros aparecerão aqui quando houver atividades nessa situação.')}</div><div class="rt98-activity-footer"><p>Responder a uma atividade ou marcar um compromisso não equivale a um diagnóstico ou avaliação de evolução psicológica.</p>${btn('Escrever reflexão','new-reflection','','btn small')} ${btn('Consultar minhas reflexões','goto','reflexoes','btn small')}</div></div>`;
}

function encontros(v){
 const next=upcoming(v),late=awaitingConfirmation(v);
 const completed=v.sessions.filter(s=>s.status==='concluida').sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
 const recapRows=completed.filter(s=>s.clientRecap);
 const linked=s=>v.actions.filter(a=>a.sessionId===s.id);
 const lastNext=next[0];
 return heading('AGENDA COMPARTILHADA','Meus encontros','Acompanhe datas, orientações liberadas e os compromissos combinados. Notas internas não aparecem aqui.')+
 `<div class="rt-v910-client-meetings"><div class="rt-v910-main">
  <section class="rt-v910-client-card"><div class="rt-v910-between"><h2>Próximos encontros</h2><span class="chip">${next.length} agendado(s)</span></div>${sessionsList(v)}${lastNext?`<div class="rt-v910-prep"><strong>Antes do próximo encontro</strong><p>Você pode revisar atividades e registrar uma reflexão fictícia para preparar sua conversa.</p>${btn('Ver atividades','goto','atividades','btn small')}${btn('Registrar reflexão','new-reflection','','btn small')}</div>`:''}</section>
  ${late.length?`<section class="rt-v910-client-card"><h2>Aguardando confirmação</h2><p>O horário passou. O profissional ainda precisa confirmar o que ocorreu.</p>${late.map(s=>`<div class="rt-v910-meeting-row"><strong>${esc(s.clientTopic||'Encontro')}</strong><small>${dateFmt(s.date)} · ${esc(s.time)}</small></div>`).join('')}</section>`:''}
  <section class="rt-v910-client-card"><h2>Encontros anteriores</h2>${completed.length?completed.map(s=>`<article class="rt-v910-client-meeting"><div class="rt-v910-between"><strong>${esc(s.clientTopic||'Encontro de acompanhamento')}</strong><small>${dateFmt(s.date)}</small></div>${s.clientRecap?`<div class="rt-v910-client-recap"><b>Resumo compartilhado</b><p>${esc(s.clientRecap)}</p></div>`:'<p class="rt-v910-muted">Nenhum resumo disponibilizado deste encontro.</p>'}${linked(s).length?`<div class="rt-v910-client-agreements"><b>Compromissos deste encontro</b>${linked(s).map(a=>`<div><span>${esc(a.title)}</span><small>${a.status==='concluido'?'Registrado':'Para fazer'} · ${a.due?dateFmt(a.due):'Sem prazo'}</small></div>`).join('')}${btn('Abrir atividades','goto','atividades','btn small')}</div>`:''}</article>`).join(''):empty('Ainda sem encontros realizados','Depois de um encontro, os conteúdos disponibilizados aparecerão aqui.')}</section>
 </div><aside class="rt-v910-client-aside"><section class="rt-v910-client-card"><h2>Preparar a conversa</h2><p>O que você deseja retomar no próximo encontro? Escolha se quer compartilhar sua reflexão.</p>${btn('Registrar reflexão','new-reflection','','btn solid')}</section><section class="rt-v910-client-card"><h2>Compartilhamento</h2><p>Somente agendas, resumos e compromissos explicitamente disponibilizados pelo profissional são exibidos neste espaço.</p></section></aside></div>`;
}

function desenvolvimento(v){
 const cards=v.programs.map(p=>{
  const goals=(v.goals||[]).filter(g=>g.programId===p.id),acs=actionsOf(v,p.id);
  return `<section class="rt99-program"><div class="rt99-program-head"><div><small>PROCESSO DE DESENVOLVIMENTO</small><h2>${esc(p.goal)}</h2><p>Etapa: ${esc(p.stage)} · Início: ${dateFmt(p.start)}</p></div><span class="chip">${esc(p.status)}</span></div>
    <div class="rt99-goal-stack">${goals.map(g=>{const aa=acs.filter(a=>a.goalId===g.id);const complete=aa.filter(a=>a.status==='concluido').length;
      const notes=(v.guidance||[]).filter(n=>n.goalId===g.id);
      const exercises=(v.instruments||[]).filter(i=>i.programId===p.id&&i.goalId===g.id);
      const reflections=(v.reflections||[]).filter(n=>n.goalId===g.id);
      return `<article class="rt99-goal-card"><div class="rt99-goal-top"><h3>${esc(g.title)}</h3><span>${complete} de ${aa.length} compromisso(s) registrado(s)</span></div>
        <div class="rt99-goal-items">${aa.map(a=>`<div class="rt99-goal-action"><span class="${a.status==='concluido'?'done':'waiting'}">${a.status==='concluido'?'✓':'○'}</span><div><strong>${esc(a.title)}</strong><p>${a.status==='concluido'?a.experience?.outcome==='tentada'?'Tentativa registrada':'Realizada':'A realizar'} · ${a.due?dateFmt(a.due):'Sem prazo'}</p>${a.experience?.note?`<p>${esc(a.experience.note)}</p>`:''}</div>${a.status==='pendente'?btn('Registrar','report-action',a.id,'btn small'):''}</div>`).join('')||'<p class="muted">Nenhum compromisso relacionado ainda.</p>'}</div>
        ${exercises.length?`<div class="rt-v917-goal-exercises"><strong>Atividades guiadas deste objetivo</strong>${exercises.map(i=>`<div class="rt-v917-exercise-row"><span>${esc(i.title)}</span><small>${i.responses?'Resposta enviada ao profissional':'Aguardando resposta'}${i.feedback?' · Devolutiva disponível':''}</small>${!i.responses?btn('Responder','respond-instrument',i.id,'btn small'):''}</div>`).join('')}</div>`:''}
        ${notes.length?`<div class="rt99-goal-guidance"><b>Orientações compartilhadas</b>${notes.map(n=>`<p>${esc(n.text)}</p>`).join('')}</div>`:''}
        ${reflections.length?`<p class="rt99-goal-note">${reflections.length} reflexão(ões) registrada(s) sobre este objetivo.</p>`:''}
        ${btn('Registrar reflexão sobre este objetivo','reflect-goal',g.id,'btn ghost small')}
       </article>`;}).join('')||empty('Sem objetivos definidos','O profissional pode definir objetivos para o processo.')}</div></section>`;
 });
 const events=[...v.actions.filter(a=>a.completedAt).map(a=>({at:a.completedAt,title:a.title,desc:a.experience?.outcome==='tentada'?'Experiência: tentou e encontrou dificuldades':'Compromisso concluído'})),
  ...v.reflections.map(r=>({at:r.created,title:r.title,desc:r.visibility==='compartilhado'?'Reflexão compartilhada':'Reflexão particular na demonstração'})),
  ...v.guidance.map(g=>({at:g.created,title:'Orientação compartilhada',desc:g.text})),
  ...v.sessions.filter(s=>s.status==='concluida').map(s=>({at:s.date,title:s.focus,desc:'Encontro registrado'}))].sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,12);
 return heading('DESENVOLVIMENTO COM CONTEXTO','Meu desenvolvimento','Seus objetivos conectam compromissos, orientações e reflexões. Concluir tarefas não mede evolução psicológica.')+
  `<div class="rt99-journey-layout"><div>${cards.join('')||empty('Sem processo de desenvolvimento','Seu profissional poderá iniciar um acompanhamento.')}</div><aside class="rt99-history card"><h2>Histórico da minha jornada</h2><p>Eventos compartilhados e registros que você decidiu criar.</p>${events.map(e=>`<div class="rt99-history-event"><span aria-hidden="true">●</span><div><strong>${esc(e.title)}</strong><small>${esc(e.at?.slice(0,10)||'')} · ${esc(e.desc)}</small></div></div>`).join('')||empty('Ainda sem registros','Suas atividades e encontros aparecerão aqui.')}</aside></div>`;
}
function materiais(v){
 const referenced=[...new Set(v.actions.map(a=>a.resource).filter(x=>x&&x!=='Nenhum'))];
 const presentations=v.presentationMaterials||[];
 const deckCards=presentations.map(item=>{
   const session=v.sessions.find(s=>s.id===item.sessionId);
   return `<article class="rt-v111-material" data-v111-shared="${esc(item.id)}"><div><small>APRESENTAÇÃO DISPONIBILIZADA</small><h3>${esc(item.title)}</h3><p>${item.slides.length} slide(s) · ${session?'Sessão de '+dateFmt(session.date):'Material de desenvolvimento'}</p></div>
      <details><summary>Visualizar slides compartilhados</summary><div class="rt-v111-material-slides">${item.slides.map((slide,i)=>`<section class="rt-v111-material-slide"><small>SLIDE ${i+1}</small><h4>${esc(slide.title)}</h4>${slide.subtitle?`<p>${esc(slide.subtitle)}</p>`:''}${slide.body?`<p class="rt-v111-slide-body">${esc(slide.body)}</p>`:''}</section>`).join('')}</div></details></article>`;
 }).join('');
 return heading('CONTEÚDOS DISPONIBILIZADOS','Meus materiais','Orientações e apresentações expressamente compartilhadas pelo profissional. Anotações e arquivos internos não são distribuídos.')+
  `<div class="columns"><div class="stack"><section class="card"><div class="card-heading"><h2>Apresentações disponibilizadas</h2></div>${deckCards||empty('Nenhuma apresentação liberada','O profissional pode selecionar slides educativos e compartilhá-los após associar uma sessão.')}</section>
  <div class="card"><div class="card-heading"><h2>Orientações compartilhadas</h2></div>${guidanceList(v)}</div>
  <div class="card"><h2>Recursos citados nas atividades</h2>${referenced.length?referenced.map(r=>`<div class="row"><div class="row-symbol">▧</div><div class="row-main"><b>${esc(r)}</b><p>Referência de apoio indicada no seu plano; esta demonstração não distribui conteúdo técnico automaticamente.</p></div></div>`).join(''):empty('Sem recursos atribuídos','O profissional poderá selecionar materiais.')}</div></div><div class="stack"><div class="card"><h2>Compartilhamento cuidadoso</h2><p>Notas internas, arquivos privados, histórico profissional completo, interpretações ou resultados não liberados não aparecem neste portal.</p></div></div></div>`;
}
function reflectionItem(r){return `<article class="reflection"><strong>${esc(r.title)}</strong><p>${esc(r.text)}</p><div class="meta"><span>${dateFmt(r.created)}</span><span class="${r.visibility==='compartilhado'?'shared':''}">${r.visibility==='compartilhado'?'Compartilhada com o profissional':'Privada nesta interface demonstrativa'}</span></div><div class="reflection-actions">${btn(r.visibility==='compartilhado'?'Tornar privada':'Compartilhar com profissional','visibility',r.id,'btn small')}${btn('Excluir','delete-reflection',r.id,'btn ghost small')}</div></article>`;}
function reflexoes(v){return heading('MEU ESPAÇO PESSOAL','Minhas reflexões','Organize pensamentos e aprendizados. Escolha explicitamente quais reflexões deseja mostrar ao profissional.',btn('+ Nova reflexão','new-reflection','','btn solid'))+`<div class="columns"><div class="stack"><div class="card"><div class="card-heading"><h2>Registros da jornada</h2><span class="chip">${v.reflections.length}</span></div>${v.reflections.length?[...v.reflections].reverse().map(reflectionItem).join(''):empty('Seu espaço está vazio','Use “Nova reflexão” para iniciar um registro demonstrativo.')}</div></div><div class="stack"><div class="card"><h2>Você escolhe o que compartilhar</h2><p>Reflexões marcadas como privadas não aparecem na interface profissional. Isso não significa confidencialidade técnica: o armazenamento local pode ser acessado por outras pessoas com acesso ao navegador.</p><div class="help">O controle de privacidade aqui é apenas funcional e visual. Para uso com clientes reais serão necessários login, autorizações, banco de dados seguro, regras no servidor e auditoria.</div></div></div></div>`;}
function perfil(v){return heading('SOBRE MINHA CONTA','Meu perfil','Este ambiente simula o acesso do cliente; a lista de perfis demonstra o fluxo, mas não autentica ninguém.')+`<div class="warning"><strong>Privacidade demonstrativa, não real</strong>Qualquer pessoa usando este navegador pode trocar de cliente e consultar os dados fictícios. Não utilize nome real, dados de saúde, sessões de Psicologia ou registros confidenciais.</div><div class="columns"><div class="stack"><div class="card"><h2>Dados fictícios da jornada</h2><div class="profile-grid"><div class="info"><small>Identificação</small><strong>${esc(v.client.name)}</strong></div><div class="info"><small>Modalidade</small><strong>${esc(v.client.contact)}</strong></div><div class="info"><small>Foco geral</small><strong>${esc(v.client.focus)}</strong></div><div class="info"><small>Processos registrados</small><strong>${v.programs.length}</strong></div></div></div></div><div class="stack"><div class="card"><h2>O que o profissional visualiza?</h2><p>O profissional demonstrativo pode ver atividades, processos, encontros, orientações e apenas reflexões que você marcou para compartilhar. Não existe login real nem proteção técnica entre os perfis.</p><a class="link" href="../docs/SEGURANCA_E_PERMISSOES_V5.md">Ver política de implantação →</a></div></div></div>`;}

// V8.1 — Mapeamento DISC/ACER original, distribuído ao participante (20 perguntas).
let rtQuiz=null;
// Apenas nesta DEMONSTRAÇÃO: rascunho no navegador local; não há sigilo de dados reais.
const RT_DRAFT_PREFIX='rt-v97-disc-draft:';
const rtDraftKey=(cid,id)=>RT_DRAFT_PREFIX+encodeURIComponent(cid)+':'+encodeURIComponent(id);
function saveQuizDraft(){
 if(!rtQuiz)return;
 const d=S.load(),t=d.discAssignments.find(x=>x.id===rtQuiz.id&&x.clientId===selected&&x.status==='atribuido'&&x.visibility==='compartilhado');
 if(!t)return;
 const q={v:1,id:rtQuiz.id,clientId:selected,step:rtQuiz.step,answers:rtQuiz.answers,adjectives:rtQuiz.adjectives,updatedAt:new Date().toISOString()};
 try{localStorage.setItem(rtDraftKey(selected,rtQuiz.id),JSON.stringify(q));}catch(e){toast('Não foi possível salvar o rascunho neste navegador.');}
 if(!t.startedAt){S.markDiscStarted(d,selected,t.id);S.save(d);db=d;}
}
function clearQuizDraft(cid,id){try{localStorage.removeItem(rtDraftKey(cid,id));}catch(e){}}
function restoreQuizDraft(cid,id){
 try{
  const raw=JSON.parse(localStorage.getItem(rtDraftKey(cid,id))||'null'),tasks=S.clientView(S.load(),cid)?.discAssignments||[];
  if(!tasks.some(t=>t.id===id&&t.status==='atribuido')||raw?.v!==1||raw.id!==id||raw.clientId!==cid)return null;
  const q=RTDiscQuestions.QUESTIONS.length,validOptions=raw.answers?.every((v,i)=>v===null||RTDiscQuestions.QUESTIONS[i].options.some(x=>x[1]===v));
  if(!Array.isArray(raw.answers)||raw.answers.length!==q||!validOptions||!Number.isInteger(raw.step)||raw.step<0||raw.step>q+1)return null;
  if(!Array.isArray(raw.adjectives)||raw.adjectives.length!==2||!raw.adjectives.every(a=>Array.isArray(a)&&a.length<=RTDiscQuestions.ADJECTIVES.length&&a.every(i=>Number.isInteger(i)&&i>=0&&i<RTDiscQuestions.ADJECTIVES.length)))return null;
  // Only advance to a step after all preceding questions have recorded answers.
  if(raw.answers.slice(0,Math.min(raw.step,q)).some(a=>a===null))return null;
  if(raw.step===q+1&&raw.adjectives[0].length<3)return null;
  return {id,step:raw.step,answers:raw.answers,adjectives:raw.adjectives};
 }catch(e){return null;}
}
function pruneDiscDrafts(){
 try{
  const d=S.load(),valid=new Set(d.discAssignments.filter(x=>x.status==='atribuido'&&x.visibility==='compartilhado').map(x=>rtDraftKey(x.clientId,x.id)));
  for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key?.startsWith(RT_DRAFT_PREFIX)&&!valid.has(key))localStorage.removeItem(key);}
 }catch(e){}
}
function forgetUnavailableDraft(){if(rtQuiz&&!S.clientView(S.load(),selected)?.discAssignments.some(t=>t.id===rtQuiz.id&&t.status==='atribuido')){clearQuizDraft(selected,rtQuiz.id);rtQuiz=null;}}
function discPage(v){
 const tasks=v.discAssignments||[];
 const intro=heading('AUTOCONHECIMENTO · DISC/ACER','Meu mapeamento DISC/ACER','Responda ao questionário original atribuído pelo profissional. Os gráficos ficam no Professional; aqui você acompanha a conclusão e eventuais orientações compartilhadas.');
 if(rtQuiz){
   const task=tasks.find(t=>t.id===rtQuiz.id&&t.status==='atribuido');
   if(!task){clearQuizDraft(selected,rtQuiz.id);rtQuiz=null;return intro+empty('Atividade indisponível','O profissional pode ter alterado a disponibilização.');}
   if(rtQuiz.step>=RTDiscQuestions.QUESTIONS.length){
     const round=rtQuiz.step-RTDiscQuestions.QUESTIONS.length;
     const chosen=rtQuiz.adjectives[round],desc=round===0?'Como você se percebe?':'Como acha que as outras pessoas esperam que você aja?';
     const words=RTDiscQuestions.ADJECTIVES;
     return intro+`<div class="rt-v81-quiz-shell"><div class="rt-v81-quiz-top"><span>ETAPA ${round+2} DE 3 · ADJETIVOS</span><button type="button" class="btn ghost" data-act="disc-cancel">Fechar</button></div>
       <p class="rt-v97-draft-notice" role="status">Seu progresso é salvo automaticamente neste navegador de demonstração.</p><div class="rt-v81-quiz-progress"><span style="width:${Math.round(((RTDiscQuestions.QUESTIONS.length+round)/(RTDiscQuestions.QUESTIONS.length+2))*100)}%"></span></div>
       <h2>${desc}</h2><p class="form-note">Selecione pelo menos 3 palavras que representam sua reflexão. Selecionadas: <strong>${chosen.length}</strong>. Esta é a etapa de adjetivos da versão original.</p>
       <div class="rt-v81-adjectives">${words.map(([word],i)=>`<button type="button" data-act="disc-adj-toggle" data-id="${i}" aria-pressed="${chosen.includes(i)}" class="rt-v81-adj-chip ${chosen.includes(i)?'selected':''}">${esc(word)}</button>`).join('')}</div>
       <div class="rt-v81-quiz-buttons"><button type="button" class="btn ghost" data-act="disc-adj-prev">← Voltar</button><button type="button" class="btn solid" data-act="disc-adj-next">${round===0?'Continuar →':'Concluir mapeamento'}</button></div>
       <div class="rt-v81-inline-error" id="disc-error" role="alert"></div></div>`;
   }
   const questions=RTDiscQuestions.QUESTIONS,idx=rtQuiz.step,q=questions[idx];
   return intro+`<div class="rt-v81-quiz-shell"><div class="rt-v81-quiz-top"><span>QUESTÃO ${idx+1} DE ${questions.length}</span><button type="button" class="btn ghost" data-act="disc-cancel">Fechar questionário</button></div><p class="rt-v97-draft-notice" role="status">Progresso salvo automaticamente · você pode continuar depois.</p><div class="rt-v81-quiz-progress"><span style="width:${Math.round((idx/ (questions.length+2))*100)}%"></span></div><h2>${esc(q.text)}</h2><p class="form-note">Selecione a alternativa que melhor representa sua preferência nesta situação fictícia.</p><fieldset class="rt-v81-options"><legend class="sr-only">Alternativas</legend>${q.options.map(([label,key],i)=>`<label class="rt-v81-option ${rtQuiz.answers[idx]===key?'selected':''}"><input type="radio" name="disc-choice" value="${key}" ${rtQuiz.answers[idx]===key?'checked':''} /><span class="rt-v81-option-letter">${i+1}</span><span>${esc(label)}</span></label>`).join('')}</fieldset><div class="rt-v81-quiz-buttons"><button type="button" class="btn ghost" data-act="disc-prev" ${idx===0?'disabled':''}>← Anterior</button><button type="button" class="btn solid" data-act="disc-next">${idx===questions.length-1?'Continuar para os adjetivos →':'Próxima →'}</button></div><div class="rt-v81-inline-error" id="disc-error" role="alert"></div></div>`;
 }
 return intro+`<div class="columns"><div class="stack"><section class="card"><div class="card-heading"><h2>Mapeamentos atribuídos</h2><span class="chip">${tasks.length}</span></div>${tasks.map(t=>`<div class="row"><div class="row-symbol">◈</div><div class="row-main"><b>Mapeamento DISC/ACER</b><p>${esc(v.programs.find(p=>p.id===t.programId)?.goal||'Processo')} · ${t.status==='respondido'?'Concluído':t.startedAt?'Em andamento':'Aguardando resposta'}</p>${t.status==='respondido'&&t.feedback?`<p class="rt-v81-devolutiva"><strong>Devolutiva compartilhada:</strong> ${esc(t.feedback)}</p>`:''}</div>${t.status==='atribuido'?btn(t.startedAt?'Continuar':'Responder','disc-start',t.id,'btn solid small'):'<span class="chip done">✓ Concluído</span>'}</div>`).join('')||empty('Nenhum mapeamento atribuído','Seu profissional poderá enviar o questionário pela área Professional.')}</section></div><div class="stack"><section class="card"><h2>Como funciona?</h2><p>Você responde às 20 perguntas e a duas rodadas de adjetivos do modelo DISC/ACER original. A análise gráfica fica reservada ao profissional nesta experiência.</p><p>Não há resultado automático, diagnóstico ou classificação de personalidade exibida ao participante. Uma devolutiva aparece somente após o profissional liberá-la.</p><div class="help">Exercício educativo demonstrativo, sem validação psicométrica apresentada. Use apenas respostas fictícias; não insira dados pessoais.</div></section></div></div>`;
}
function runDiscAction(type,id){
 if(type==='disc-cancel'){saveQuizDraft();rtQuiz=null;render();toast('Progresso preservado neste navegador.');return true;}
 if(type==='disc-start'){
  const t=view()?.discAssignments.find(x=>x.id===id&&x.status==='atribuido');if(!t)return true;
  rtQuiz=restoreQuizDraft(selected,id)||{id,step:0,answers:Array(RTDiscQuestions.QUESTIONS.length).fill(null),adjectives:[[],[]]};saveQuizDraft();if(location.hash!=='#disc')location.hash='disc';render();return true;
 }
 if(type==='disc-adj-toggle'){
  if(!rtQuiz||rtQuiz.step<RTDiscQuestions.QUESTIONS.length)return true;
  const round=rtQuiz.step-RTDiscQuestions.QUESTIONS.length,n=Number(id),list=rtQuiz.adjectives[round];
  if(!Number.isInteger(n)||n<0||n>=RTDiscQuestions.ADJECTIVES.length)return true;
  rtQuiz.adjectives[round]=list.includes(n)?list.filter(x=>x!==n):[...list,n];saveQuizDraft();render();return true;
 }
 if(type==='disc-adj-prev'){
  if(!rtQuiz)return true;
  rtQuiz.step=Math.max(0,rtQuiz.step-1);saveQuizDraft();render();return true;
 }
 if(type==='disc-adj-next'){
  if(!rtQuiz||rtQuiz.step<RTDiscQuestions.QUESTIONS.length)return true;
  if(rtQuiz.adjectives[rtQuiz.step-RTDiscQuestions.QUESTIONS.length].length<3){const n=$('#disc-error');if(n)n.textContent='Escolha ao menos 3 adjetivos.';return true;}
  if(rtQuiz.step===RTDiscQuestions.QUESTIONS.length){rtQuiz.step++;saveQuizDraft();render();return true;}
  const q=rtQuiz;rtQuiz=null;const d=S.load();
  const ok=S.submitDisc(d,selected,q.id,q.answers,q.adjectives[0],q.adjectives[1]);
  if(ok){clearQuizDraft(selected,q.id);S.log(d,'cliente','submit-disc',q.id);S.save(d);db=d;render();location.hash='atividades';rt98ActivityFilter='concluidas';toast('Questionário enviado. O profissional poderá analisar suas respostas e compartilhar uma devolutiva.');}
  else{rtQuiz=q;saveQuizDraft();render();toast('Não foi possível concluir o mapeamento.');}
  return true;
 }
 if(type==='disc-next'||type==='disc-prev'){
  if(!rtQuiz)return true;
  if(type==='disc-prev'){rtQuiz.step=Math.max(0,rtQuiz.step-1);saveQuizDraft();render();return true;}
  const chosen=document.querySelector('input[name="disc-choice"]:checked')?.value;
  if(!chosen){const note=$('#disc-error');if(note)note.textContent='Selecione uma opção para continuar.';return true;}
  rtQuiz.answers[rtQuiz.step]=chosen;
  rtQuiz.step++;saveQuizDraft();render();return true;
 }
 return false;
}

const components={disc:discPage,instrumentos,jornada,atividades,encontros,desenvolvimento,materiais,reflexoes,perfil};
const rt98MainPage=p=>({disc:'atividades',instrumentos:'atividades',reflexoes:'atividades',perfil:'perfil'}[p]||p);
function chooseClient(id){rtQuiz=null;if(!db.clients.some(c=>c.id===id))return;selected=id;sessionStorage.setItem('rt-v5-client-demo',id);const u=new URL(location.href);u.searchParams.set('demo',id);history.replaceState(null,'',u.pathname+u.search+u.hash);render();}
function render(){forgetUnavailableDraft();pruneDiscDrafts();db=S.load();if(!db.clients.some(c=>c.id===selected))selected=db.clients[0]?.id||'';const v=view();let page=location.hash.slice(1)||'jornada';if(!headers[page])page='jornada';const select=$('#demo-user');select.innerHTML=db.clients.map(c=>`<option value="${esc(c.id)}" ${selected===c.id?'selected':''}>${esc(c.name)}</option>`).join('');$('#avatar').textContent=selected.slice(-2).toUpperCase();$('#crumb').textContent=headers[page][0];$('#app').innerHTML=v?components[page](v):'<p>Sem dados demonstrativos. Crie um cliente na área profissional.</p>';document.querySelectorAll('[data-page]').forEach(a=>{const active=a.dataset.page===rt98MainPage(page);a.classList.toggle('active',active);a.setAttribute('aria-current',active?'page':'false')});$('#side').classList.remove('open');$('#shade').classList.remove('open');$('#toggle').setAttribute('aria-expanded','false');}
function mutate(actor,action,id,update){const d=S.load();const v=S.clientView(d,selected);if(!v)return;const changed=update(d,v);if(!changed)return;S.log(d,actor,action,id);S.save(d);db=d;render();toast('Alteração sincronizada neste navegador.');}
function toast(s){let e=$('#toast');e.textContent=s;e.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.remove('show'),3200);}
function action(type,id){if(runDiscAction(type,id))return;
 if(type==='report-action'){const v=view();const a=v?.actions.find(a=>a.id===id&&a.status==='pendente');if(!a)return;const modal=$('#rt99-experience-dialog');$('#rt99-action-id').value=id;$('#rt99-action-title').textContent=a.title;$('#rt99-experience-form').reset();modal.showModal();return;}
 if(type==='reflect-goal'){const modal=$('#reflection-dialog');$('#reflection-form').reset();$('#reflection-form').dataset.goalId=id;modal.showModal();return;}
if(type==='activities-filter'){rt98ActivityFilter=['fazer','andamento','concluidas'].includes(id)?id:'fazer';render();return;}if(type==='goto'){location.hash=id;return;}if(type==='respond-instrument'){
  const v=view(),i=v?.instruments.find(x=>x.id===id&&x.status==='atribuido');if(!i)return;
  $('#instrument-form').dataset.id=i.id;
  $('#instrument-name').textContent=i.title;
  $('#instrument-intro').textContent=i.instructions;
  const fields=$('#instrument-fields');
  fields.innerHTML=i.kind==='formulario-personalizado'?customFields(i):prompts.map((p,k)=>'<label class="field">'+esc((k+1)+'. '+p)+'<textarea name="answer'+k+'" required minlength="3" maxlength="600"></textarea></label>').join('');
  const error=$('#rt-v117-form-error');if(error)error.textContent='';
  $('#instrument-dialog').showModal();return;
 }if(type==='new-reflection'){$('#reflection-form').dataset.goalId='';$('#reflection-dialog').showModal();$('#reflection-form').elements.title.focus();return;}if(type==='toggle'){rt98ActivityFilter='fazer';mutate('cliente','toggle-activity',id,(d,v)=>{if(!v.actions.some(x=>x.id===id))return false;const a=d.actions.find(x=>x.id===id);a.status=a.status==='concluido'?'pendente':'concluido';return true;});return;}if(type==='visibility'){mutate('cliente','reflection-visibility',id,(d,v)=>{if(!v.reflections.some(x=>x.id===id))return false;const r=d.reflections.find(x=>x.id===id);r.visibility=r.visibility==='compartilhado'?'privado':'compartilhado';return true;});return;}if(type==='delete-reflection'){if(!confirm('Excluir esta reflexão fictícia?'))return;mutate('cliente','delete-reflection',id,(d,v)=>{if(!v.reflections.some(x=>x.id===id))return false;d.reflections=d.reflections.filter(x=>x.id!==id);return true;});return;}}
$('#rt99-experience-form').addEventListener('submit',e=>{
 e.preventDefault();const form=e.target,id=form.elements.actionId.value,outcome=form.elements.outcome.value,note=form.elements.note.value;
 const d=S.load();if(!S.recordExperience(d,selected,id,outcome,note)){toast('Compromisso indisponível para registro.');return;}
 S.log(d,'cliente','record-experience',id);S.save(d);db=d;$('#rt99-experience-dialog').close();rt98ActivityFilter='concluidas';location.hash='atividades';render();toast('Experiência registrada neste navegador demonstrativo.');
});
$('#rt99-experience-cancel').addEventListener('click',()=>$('#rt99-experience-dialog').close());
$('#instrument-form').addEventListener('submit',e=>{
 e.preventDefault();const id=e.target.dataset.id,record=view()?.instruments.find(x=>x.id===id);
 if(!record){toast('Atividade indisponível.');return;}
 const d=S.load();let done=false;
 if(record.kind==='formulario-personalizado'){
  const data=new FormData(e.target),answers={};
  for(const section of record.sections)for(const q of section.questions){
   const key='q_'+q.id;
   answers[q.id]=q.type==='multipla'?data.getAll(key).map(String):String(data.get(key)||'');
  }
  done=S.submitCustomForm(d,selected,id,answers);
 }else{
  const answers=prompts.map((_,ix)=>e.target.elements['answer'+ix]?.value.trim()||'');
  done=S.submitInstrument(d,selected,id,answers);
 }
 if(!done){const e=$('#rt-v117-form-error');if(e)e.textContent='Confira as respostas obrigatórias, opções e limites dos campos.';return;}
 S.log(d,'cliente','submit-instrument',id);S.save(d);db=d;
 $('#instrument-dialog').close();e.target.reset();rt98ActivityFilter='concluidas';location.hash='atividades';render();
 toast('Respostas enviadas ao profissional nesta demonstração.');
});
$('#instrument-cancel').addEventListener('click',()=>$('#instrument-dialog').close());
$('#demo-user').addEventListener('change',e=>chooseClient(e.target.value));
document.addEventListener('change',e=>{if(e.target.name==='disc-choice'){if(rtQuiz&&rtQuiz.step<RTDiscQuestions.QUESTIONS.length){rtQuiz.answers[rtQuiz.step]=e.target.value;saveQuizDraft();}document.querySelectorAll('.rt-v81-option').forEach(l=>l.classList.toggle('selected',l.querySelector('input')?.checked));}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b){e.preventDefault();action(b.dataset.act,b.dataset.id||'');}});
$('#reflection-form').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.target);const title=String(data.get('title')||'').trim().slice(0,80),body=String(data.get('text')||'').trim().slice(0,500),visibility=data.get('visibility')==='compartilhado'?'compartilhado':'privado';if(!title||!body)return;mutate('cliente','add-reflection','',(d,v)=>{const goal=v.goals?.find(g=>g.id===e.target.dataset.goalId)||null;d.reflections.push({id:S.freshId('r'),clientId:selected,programId:goal?.programId||program(v)?.id||null,goalId:goal?.id||null,title,text:body,visibility,created:new Date().toISOString().slice(0,10)});return true;});$('#reflection-dialog').close();e.target.reset();location.hash='reflexoes';});
$('#dialog-close').addEventListener('click',()=>$('#reflection-dialog').close());$('#dialog-cancel').addEventListener('click',()=>$('#reflection-dialog').close());
$('#toggle').addEventListener('click',()=>{const on=$('#side').classList.toggle('open');$('#shade').classList.toggle('open',on);$('#toggle').setAttribute('aria-expanded',String(on));});$('#shade').addEventListener('click',()=>{$('#side').classList.remove('open');$('#shade').classList.remove('open')});
window.addEventListener('hashchange',()=>{if(location.hash!=='#disc'){saveQuizDraft();rtQuiz=null;}render();});window.addEventListener('storage',e=>{if(e.key===S.KEY)render();});render();
