/* RealTalent V9.13 — Banco de Perguntas e Temporizador. Demonstração local; dados fictícios. */
(function(root){
 'use strict';
 const questions=[
  ['abertura','Qual assunto merece sua atenção neste encontro?','Acolher a pauta escolhida pela pessoa.'],
  ['abertura','O que tornaria esta conversa útil para você hoje?','Definir utilidade do encontro.'],
  ['abertura','O que mudou desde a última conversa?','Identificar novidades sem pressupor melhora.'],
  ['abertura','Por onde gostaria de começar?','Fortalecer a autonomia.'],
  ['abertura','Existe algo importante que ainda não colocamos na pauta?','Ampliar a escuta.'],
  ['objetivo','O que você gostaria de alcançar com este processo?','Descrever a intenção em linguagem própria.'],
  ['objetivo','Como saberia que avançou em direção a esse objetivo?','Explorar sinais observáveis.'],
  ['objetivo','O que está sob seu controle nessa situação?','Delimitar o espaço de ação.'],
  ['objetivo','Qual seria um primeiro resultado pequeno e útil?','Tornar o objetivo concreto.'],
  ['objetivo','O que é mais importante preservar durante esse caminho?','Identificar critérios e valores.'],
  ['realidade','O que está acontecendo de fato, sem interpretações?','Diferenciar fatos e hipóteses.'],
  ['realidade','Quais tentativas você já realizou e o que observou?','Recuperar experiências anteriores.'],
  ['realidade','O que parece facilitar ou dificultar a situação?','Mapear condições do contexto.'],
  ['realidade','Que perspectivas ainda não foram consideradas?','Ampliar a compreensão.'],
  ['realidade','O que você precisaria saber para entender melhor?','Identificar lacunas de informação.'],
  ['opcoes','Quais caminhos possíveis vêm à mente?','Gerar possibilidades.'],
  ['opcoes','Se houvesse mais de uma alternativa viável, quais seriam?','Evitar fechamento prematuro.'],
  ['opcoes','Qual opção seria possível testar com baixo risco?','Promover experimentação responsável.'],
  ['opcoes','De quais recursos ou apoios você já dispõe?','Identificar recursos.'],
  ['opcoes','Que outra forma de abordar essa conversa faria sentido?','Explorar alternativas comunicacionais.'],
  ['acao','Qual passo você escolhe assumir até o próximo encontro?','Definir compromisso voluntário.'],
  ['acao','Quando e em que contexto pretende fazer isso?','Dar contorno prático à ação.'],
  ['acao','Que obstáculo previsível mereceria um plano alternativo?','Antecipar dificuldades.'],
  ['acao','De que apoio precisa para colocar o plano em prática?','Ajustar suporte.'],
  ['acao','Como gostaria de acompanhar o que aconteceu?','Combinar uma revisão.'],
  ['revisao','O que você tentou desde a última sessão?','Retomar compromissos sem cobrança.'],
  ['revisao','O que aprendeu com essa experiência?','Extrair aprendizado contextual.'],
  ['revisao','O que foi diferente do que imaginava?','Comparar expectativa e observação.'],
  ['revisao','Há algo no plano que mereça ser ajustado?','Recalibrar o caminho.'],
  ['revisao','Qual assunto merece continuidade no próximo encontro?','Preparar o acompanhamento.']
 ].map(([phase,text,purpose],i)=>({id:'cq-'+String(i+1).padStart(2,'0'),phase,text,purpose}));
 const phases=[['todas','Todas'],['abertura','Abertura'],['objetivo','Objetivo'],['realidade','Realidade'],['opcoes','Opções'],['acao','Ação'],['revisao','Revisão'],['selecionadas','Selecionadas']];
 const timerKey=id=>'rt-v913-session-timer:'+id;
 const escDefault=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sessionList=d=>d.sessions.filter(s=>d.programs.some(p=>p.id===s.programId&&d.clients.some(c=>c.id===p.clientId))).slice().sort((a,b)=>(a.date+'T'+(a.time||'00:00')).localeCompare(b.date+'T'+(b.time||'00:00')));
 const choose=(d,id,now)=>{const list=sessionList(d);return {list,s:list.find(s=>s.id===id)||list.find(s=>s.status==='agendada'&&s.date>=now)||list[list.length-1]}};
 const href=(tab,sessionId,extra='')=>'#ferramentas?tab='+encodeURIComponent(tab)+(sessionId?'&session='+encodeURIComponent(sessionId):'')+(extra?'&'+extra:'');
 function picker(d,list,s,tab,ctx,extra=''){
  const {esc,dateFmt}=ctx,p=d.programs.find(x=>x.id===s.programId),c=d.clients.find(x=>x.id===p?.clientId);
  return '<div class="rt-v913-picker"><label for="rt-v913-session-select"><strong>Sessão de referência</strong><span>O conteúdo é interno e vinculado ao encontro escolhido.</span></label>'+
   '<select id="rt-v913-session-select" data-tab="'+esc(tab)+'" aria-label="Selecionar sessão">'+list.map(row=>{
    const program=d.programs.find(x=>x.id===row.programId),client=d.clients.find(x=>x.id===program?.clientId);
    return '<option value="'+esc(row.id)+'"'+(row.id===s.id?' selected':'')+'>'+esc((client?.name||'Cliente')+' · '+dateFmt(row.date)+' · '+(row.time||'')+' · '+(row.status==='concluida'?'Concluída':'Agendada'))+'</option>';
   }).join('')+'</select>'+
   '<a class="rt-v913-open" href="'+ctx.wsUrl(c.id,'sessoes',p.id,'session='+encodeURIComponent(s.id))+'">Abrir sessão →</a></div>'+
   '<div class="rt-v913-context"><span>'+esc(c.name)+'</span><strong>'+esc(p.goal)+'</strong><small>'+esc(dateFmt(s.date)+' · '+(s.time||''))+'</small></div>';
 }
 const empty='<section class="rt-v913-card"><h2>Cadastre uma sessão para começar</h2><p>O banco e o temporizador utilizam encontros existentes. Não criam fichas, diagnósticos nem novas sessões.</p><a href="#sessoes" class="btn-primary">Abrir sessões →</a></section>';
 function renderQuestions(d,id,filter,ctx){
  const {s,list}=choose(d,id,ctx.today());if(!s)return empty;
  const {esc}=ctx,selected=(s.coachingQuestionIds||[]).filter(qid=>questions.some(q=>q.id===qid));
  const f=phases.some(x=>x[0]===filter)?filter:'todas';
  const cards=questions.filter(q=>f==='selecionadas'?selected.includes(q.id):f==='todas'||q.phase===f)
   .map(q=>'<article class="rt-v913-question" data-v913-question data-search="'+esc((q.text+' '+q.purpose+' '+q.phase).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())+'"><div><span class="rt-v913-kicker">'+esc(phases.find(x=>x[0]===q.phase)?.[1]||q.phase)+'</span><p>'+esc(q.text)+'</p><small>'+esc(q.purpose)+'</small></div><button type="button" data-act="rt-v913-toggle-question" data-id="'+esc(q.id)+'" class="'+(selected.includes(q.id)?'btn-secondary rt-v913-picked':'btn-primary')+'" aria-pressed="'+selected.includes(q.id)+'">'+(selected.includes(q.id)?'✓ Selecionada':'Adicionar à sessão')+'</button></article>').join('')||
   '<p class="rt-v913-no-results">Nenhuma pergunta nesta categoria.</p>';
  const selectedQuestions=selected.map(qid=>questions.find(q=>q.id===qid)).filter(Boolean);
  const linkPhase=k=>href('perguntas',s.id,'phase='+encodeURIComponent(k));
  return '<section class="rt-v913-suite">'+picker(d,list,s,'perguntas',ctx)+
   '<div class="rt-v913-intro"><div><span class="eyebrow">RECURSO EDUCATIVO · UTILIZAÇÃO OPCIONAL</span><h2>Banco de Perguntas de Coaching</h2><p>Questões abertas para apoiar a escuta e a construção de objetivos. O profissional seleciona o que cabe no contexto e no seu campo de atuação.</p></div><span class="rt-v913-pill">'+selected.length+'/12 selecionadas</span></div>'+
   '<div class="rt-v913-columns"><div class="rt-v913-main"><div class="rt-v913-filters">'+phases.map(([k,label])=>'<a class="rt-v913-chip" href="'+linkPhase(k)+'"'+(f===k?' aria-current="page"':'')+'>'+label+'</a>').join('')+'</div>'+
   '<label class="rt-v913-search"><span>Buscar perguntas</span><input id="rt-v913-question-search" type="search" placeholder="Busque por tema, pergunta ou finalidade..." autocomplete="off"></label>'+
   '<div class="rt-v913-questions" id="rt-v913-question-list">'+cards+'</div><p id="rt-v913-question-empty" class="rt-v913-no-results" hidden>Nenhuma pergunta encontrada. Limpe a busca para ver mais opções.</p></div>'+
   '<aside class="rt-v913-card rt-v913-aside"><h3>Roteiro selecionado para a sessão</h3><small>Apenas o profissional vê estas perguntas; elas não são enviadas à Minha Jornada.</small>'+
   (selectedQuestions.length?'<ol class="rt-v913-selected">'+selectedQuestions.map(q=>'<li><span>'+esc(q.text)+'</span><button type="button" data-act="rt-v913-toggle-question" data-id="'+esc(q.id)+'" aria-label="Remover pergunta" title="Remover pergunta">×</button></li>').join('')+'</ol>':'<p class="rt-v913-muted">Selecione perguntas do banco. Até 12 podem ser relacionadas a um encontro.</p>')+
   '<a class="btn-secondary" href="'+href('kit',s.id)+'">Abrir preparação GROW →</a></aside></div>'+
   '<p class="rt-v913-disclaimer">Este é um banco de apoio à condução de coaching e desenvolvimento, não um roteiro obrigatório, avaliação clínica, teste psicológico ou recomendação automatizada por perfil DISC/ACER.</p></section>';
 }
 function filterQuestions(searchText){
  if(typeof document==='undefined')return 0;
  const normalized=String(searchText||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  let shown=0;document.querySelectorAll('[data-v913-question]').forEach(el=>{const visible=!normalized||String(el.dataset.search||'').includes(normalized);el.hidden=!visible;if(visible)shown++});
  const e=document.getElementById('rt-v913-question-empty');if(e)e.hidden=shown>0;
  return shown;
 }
 function storage(){try{return root.sessionStorage||null}catch(e){return null}}
 const fallback=new Map();
 function read(id){
  const key=timerKey(id);try{const v=storage()?.getItem(key);if(v)return JSON.parse(v)}catch(e){}
  return fallback.get(key)||null;
 }
 function write(id,value){
  const key=timerKey(id);fallback.set(key,value);
  try{storage()?.setItem(key,JSON.stringify(value))}catch(e){}
 }
 const validPlan=plan=>Array.isArray(plan)&&plan.length===4&&plan.every(x=>Number.isInteger(x.minutes)&&x.minutes>=1&&x.minutes<=90&&String(x.label||'').length>0);
 function initial(plan){return {index:0,remainingMs:plan[0].minutes*60000,deadlineMs:null,running:false,signature:JSON.stringify(plan)}}
 function snapshot(session,now=Date.now()){
  const plan=session.timerPlan;if(!validPlan(plan))return null;
  const signature=JSON.stringify(plan);let state=read(session.id);
  if(!state||state.signature!==signature||!Number.isInteger(state.index)||state.index<0||state.index>=plan.length||typeof state.running!=='boolean'||!Number.isFinite(state.remainingMs)||state.remainingMs<0){state=initial(plan);write(session.id,state)}
  if(state.running){
    const remaining=Math.max(0,(Number(state.deadlineMs)||now)-now);
    if(remaining<=0){state={...state,remainingMs:0,deadlineMs:null,running:false};write(session.id,state)}
    else return {...state,remainingMs:remaining};
  }
  return state;
 }
 function timerCommand(session,action,now=Date.now()){
  const state=snapshot(session,now);if(!state)return false;
  const plan=session.timerPlan;let next={...state};
  if(action==='start'){if(state.running||state.remainingMs<=0)return false;next.running=true;next.deadlineMs=now+state.remainingMs}
  else if(action==='pause'){if(!state.running)return false;next.running=false;next.deadlineMs=null;next.remainingMs=state.remainingMs}
  else if(action==='next'){if(state.index>=plan.length-1)return false;next=initial(plan);next.index=state.index+1;next.remainingMs=plan[next.index].minutes*60000}
  else if(action==='previous'){if(state.index<=0)return false;next=initial(plan);next.index=state.index-1;next.remainingMs=plan[next.index].minutes*60000}
  else if(action==='reset')next=initial(plan);
  else return false;
  write(session.id,next);return true;
 }
 function renderTimer(d,id,ctx){
  const {s,list}=choose(d,id,ctx.today());if(!s)return empty;
  const esc=ctx.esc,plan=s.timerPlan||[],state=snapshot(s),total=plan.reduce((n,p)=>n+p.minutes,0);
  if(!state)return '<section class="rt-v913-card">Configuração do temporizador inválida. Reinicie a sessão demonstrativa.</section>';
  const m=Math.max(0,Math.ceil(state.remainingMs/1000)),fmt=v=>String(v).padStart(2,'0');
  const display=fmt(Math.floor(m/60))+':'+fmt(m%60);
  return '<section class="rt-v913-suite">'+picker(d,list,s,'temporizador',ctx)+
   '<div class="rt-v913-intro"><div><span class="eyebrow">SESSÃO · ORGANIZAÇÃO DE TEMPO</span><h2>Temporizador de Sessão</h2><p>Distribua o tempo entre quatro etapas configuráveis. A passagem à próxima etapa é manual, sem avisos sonoros.</p></div><span class="rt-v913-pill">Duração planejada: '+total+' min</span></div>'+
   '<div class="rt-v913-timer-grid"><section class="rt-v913-card rt-v913-live" id="rt-v913-timer" data-session-id="'+esc(s.id)+'"><span class="rt-v913-kicker">ETAPA '+(state.index+1)+' DE '+plan.length+'</span>'+
   '<h3 id="rt-v913-phase-label">'+esc(plan[state.index].label)+'</h3><div id="rt-v913-clock" role="timer" aria-label="Tempo restante da etapa">'+display+'</div>'+
   '<div class="rt-v913-track"><div id="rt-v913-progress" style="width:'+Math.round(100*state.remainingMs/(plan[state.index].minutes*60000))+'%"></div></div>'+
   '<p id="rt-v913-status" aria-live="polite">'+(state.remainingMs<=0?'Tempo encerrado. Avance manualmente.':state.running?'Contagem em andamento nesta aba.':'Pronto para iniciar ou retomar.')+'</p>'+
   '<div class="rt-v913-timer-buttons"><button type="button" class="btn-primary" data-act="rt-v913-timer" data-id="'+(state.running?'pause':'start')+'" data-timer-control="toggle"'+(state.remainingMs<=0?' disabled':'')+'>'+(state.running?'Pausar':'Iniciar / retomar')+'</button>'+
   '<button type="button" class="btn-secondary" data-act="rt-v913-timer" data-id="previous"'+(state.index===0?' disabled':'')+'>Anterior</button>'+
   '<button type="button" class="btn-secondary" data-act="rt-v913-timer" data-id="next"'+(state.index===plan.length-1?' disabled':'')+'>Próxima etapa</button>'+
   '<button type="button" class="btn-secondary" data-act="rt-v913-timer" data-id="reset">Reiniciar</button></div>'+
   '<p class="rt-v913-note">O relógio usa o horário da aba atual; continua computando o tempo ao trocar de tela enquanto o navegador mantém esta sessão. Não grava áudio nem confirma presença.</p></section>'+
   '<section class="rt-v913-card"><h3>Configurar etapas</h3><p class="rt-v913-muted">Altere os nomes e os minutos (1–90 por etapa, máximo de 240 no total). Salvar reinicia o cronômetro desta sessão.</p>'+
   '<form id="rt-v913-timer-form"><input type="hidden" name="sessionId" value="'+esc(s.id)+'"><div class="rt-v913-timer-fields">'+plan.map((p,i)=>'<div class="rt-v913-timer-row"><label><span>Etapa '+(i+1)+'</span><input name="label-'+esc(p.id)+'" maxlength="65" value="'+esc(p.label)+'" required></label><label><span>Minutos</span><input name="minutes-'+esc(p.id)+'" type="number" min="1" max="90" step="1" value="'+p.minutes+'" required></label></div>').join('')+'</div>'+
   '<button class="btn-primary" type="submit">Salvar configuração</button></form></section></div>'+
   '<div class="rt-v913-card"><h3>Sequência do encontro</h3><ol class="rt-v913-step-list">'+plan.map((p,i)=>'<li'+(i===state.index?' aria-current="step"':'')+'><span>'+(i+1)+'</span><strong>'+esc(p.label)+'</strong><small>'+p.minutes+' min</small></li>').join('')+'</ol></div></section>';
 }
 function updateTimerUI(){
  if(typeof document==='undefined')return;
  const el=document.getElementById('rt-v913-timer');if(!el)return;
  const sid=el.dataset.sessionId;const entry=timerRenderedSession;
  if(!entry||entry.id!==sid)return;
  const s=snapshot(entry);if(!s)return;
  const time=Math.ceil(s.remainingMs/1000),clock=document.getElementById('rt-v913-clock');
  if(clock)clock.textContent=String(Math.floor(time/60)).padStart(2,'0')+':'+String(time%60).padStart(2,'0');
  const progress=document.getElementById('rt-v913-progress');
  if(progress)progress.style.width=Math.max(0,Math.min(100,100*s.remainingMs/(entry.timerPlan[s.index].minutes*60000)))+'%';
  const status=document.getElementById('rt-v913-status');
  if(status)status.textContent=s.remainingMs<=0?'Tempo encerrado. Avance manualmente.':s.running?'Contagem em andamento nesta aba.':'Pronto para iniciar ou retomar.';
  const toggle=el.querySelector('[data-timer-control="toggle"]');
  if(toggle){toggle.dataset.id=s.running?'pause':'start';toggle.textContent=s.running?'Pausar':'Iniciar / retomar';toggle.disabled=s.remainingMs<=0}
 }
 let timerRenderedSession=null;
 function armTimerSession(session){timerRenderedSession=session||null;updateTimerUI()}
 if(typeof root.setInterval==='function')root.setInterval(updateTimerUI,500);
 root.RTSessionAssist=Object.freeze({questions,phases,renderQuestions,renderTimer,filterQuestions,choose,snapshot,timerCommand,armTimerSession,updateTimerUI,href});
})(window);
