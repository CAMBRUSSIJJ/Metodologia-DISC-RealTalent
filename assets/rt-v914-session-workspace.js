/* RealTalent V9.14 — ambiente unificado de atendimento. Somente demonstração local. */
(function(root){
 'use strict';
 const stages=[['antes','01','Antes','Preparar e recuperar contexto'],['durante','02','Durante','Conduzir o encontro'],['depois','03','Depois','Registrar e acompanhar']];
 const when=s=>(s.date||'')+'T'+(s.time||'00:00');
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function model(db,s){
  if(!s)return null;
  const p=(db.programs||[]).find(p=>p.id===s.programId);
  const c=(db.clients||[]).find(c=>c.id===p?.clientId);
  if(!p||!c)return null;
  const previous=(db.sessions||[]).filter(x=>x.id!==s.id&&x.programId===p.id&&x.status==='concluida'&&when(x)<when(s)).slice().sort((a,b)=>when(b).localeCompare(when(a)))[0]||null;
  const carried=(db.actions||[]).filter(a=>a.programId===p.id&&a.status==='pendente'&&a.sessionId!==s.id&&(!a.sessionId||(db.sessions||[]).some(old=>old.id===a.sessionId&&old.programId===p.id&&when(old)<=when(s)))).slice().sort((a,b)=>String(a.due||'9999').localeCompare(String(b.due||'9999')));
  const linked=(db.actions||[]).filter(a=>a.programId===p.id&&a.sessionId===s.id);
  return {p,c,previous,carried,linked,s};
 }
 function link(m,stage,ctx){return ctx.wsUrl(m.c.id,'sessoes',m.p.id,'session='+encodeURIComponent(m.s.id)+'&moment='+encodeURIComponent(stage))}
 function linkMore(m,stage,ctx,extra=''){return link(m,stage,ctx)+(extra?'&'+extra:'')}
 function summaryCard(title,description){return '<div class="rt-v914-info"><strong>'+safe(title)+'</strong><p>'+safe(description)+'</p></div>'}
 function actionRow(a,ctx){return '<li class="rt-v914-task"><span class="rt-v914-task-state '+(a.status==='concluido'?'is-done':'')+'" aria-hidden="true"></span><span><strong>'+ctx.esc(a.title)+'</strong><small>'+(a.due?'Prazo: '+ctx.dateFmt(a.due):'Sem prazo')+' · '+(a.visibility==='compartilhado'?'Compartilhada':'Interna')+'</small></span></li>'}
 function sectionHeading(ey,title,subtitle=''){return '<div class="rt-v914-section-head"><span>'+safe(ey)+'</span><h3>'+safe(title)+'</h3>'+(subtitle?'<p>'+safe(subtitle)+'</p>':'')+'</div>'}
 function before(m,ctx){
  const s=m.s,prep=s.preparation||{},fields=[
   ['goal','G · Objetivo','O que precisa estar mais claro ao final do encontro?'],
   ['reality','R · Realidade','Quais fatos e obstáculos merecem ser compreendidos?'],
   ['options','O · Opções','Que possibilidades poderão ser exploradas?'],
   ['wayForward','W · Próximos passos','Que ações merecem acompanhamento?']];
  const completed=fields.filter(([k])=>String(prep[k]||'').trim()).length;
  const previous=m.previous?'<div class="rt-v914-previous"><div><strong>'+ctx.dateFmt(m.previous.date)+'</strong><small>Último encontro concluído</small></div><p>'+ctx.esc(m.previous.summary||'Sem síntese interna anterior.')+'</p></div>':summaryCard('Primeiro encontro do processo','Ainda não existe sessão anterior concluída para este processo.');
  const carry=m.carried.length?'<ul class="rt-v914-tasks">'+m.carried.slice(0,5).map(a=>actionRow(a,ctx)).join('')+'</ul>':summaryCard('Nada pendente','Não há compromissos anteriores em aberto neste processo.');
  return '<div class="rt-v914-stage-content"><div class="rt-v914-two-col"><section class="rt-v914-card">'+sectionHeading('CONTEXTO','O que precisamos retomar?','Informações da mesma trajetória, sem recadastros.')+
   '<div class="rt-v914-context-block"><strong>Foco planejado</strong><p>'+ctx.esc(s.focus||'Pauta não definida')+'</p></div>'+previous+
   '<details class="rt-v914-details" open><summary>Para retomar neste encontro <span>'+m.carried.length+'</span></summary>'+carry+'</details></section>'+
   '<aside class="rt-v914-card rt-v914-support">'+sectionHeading('PREPARAÇÃO','Checklist rápido')+
   '<ol class="rt-v914-steps"><li>Recuperar o resultado desejado pela pessoa.</li><li>Consultar situações e compromissos anteriores.</li><li>Escolher perguntas relevantes, sem roteiro obrigatório.</li><li>Combinar o foco do encontro.</li></ol>'+
   '<a class="btn-secondary" href="'+link(m,'durante',ctx)+'">Ir para a condução →</a></aside></div>'+
   '<section class="rt-v914-card">'+sectionHeading('PREPARAÇÃO GROW','Estruturar a conversa','Material privado, opcional e vinculado à sessão original.')+
   '<div class="rt-v914-form-head"><span>'+completed+' de 4 campos preparados</span><span class="rt-v914-private">Somente profissional</span></div>'+
   '<form id="rt-v911-prep-form" autocomplete="off"><input type="hidden" name="sessionId" value="'+ctx.esc(s.id)+'">'+
   '<div class="rt-v914-grow">'+fields.map(([key,title,label])=>'<label><strong>'+title+'</strong><span>'+label+'</span><textarea rows="3" maxlength="650" name="'+key+'" placeholder="Registro demonstrativo da preparação...">'+ctx.esc(prep[key]||'')+'</textarea></label>').join('')+'</div>'+
   '<div class="rt-v914-form-foot"><small>As anotações não são compartilhadas automaticamente.</small><button class="btn-primary" type="submit">Salvar preparação</button></div></form></section></div>';
 }
 function questionsPanel(m,ctx){
  const s=m.s,questions=root.RTSessionAssist.questions;
  const selected=(s.coachingQuestionIds||[]).filter(id=>questions.some(q=>q.id===id));
  const filters=[['todas','Todas'],['abertura','Abertura'],['objetivo','Objetivo'],['realidade','Realidade'],['opcoes','Opções'],['acao','Ação'],['revisao','Revisão'],['selecionadas','Minhas perguntas']];
  const filter=ctx.filter&&filters.some(([id])=>ctx.filter===id)?ctx.filter:'todas';
  const rows=questions.filter(q=>filter==='selecionadas'?selected.includes(q.id):filter==='todas'||q.phase===filter);
  const norm=v=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return '<section class="rt-v914-card rt-v914-questions" aria-label="Banco de perguntas da sessão">'+sectionHeading('ESCUTA E EXPLORAÇÃO','Perguntas de apoio','Escolha o que for pertinente. Este banco não interpreta perfis nem prescreve intervenções.')+
   '<div class="rt-v914-question-tools"><nav aria-label="Filtrar perguntas" class="rt-v914-question-filters">'+filters.map(([id,label])=>'<a href="'+linkMore(m,'durante',ctx,'phase='+encodeURIComponent(id))+'"'+(filter===id?' aria-current="page"':'')+'>'+label+'</a>').join('')+'</nav>'+
   '<label>Buscar na categoria atual<input id="rt-v913-question-search" type="search" placeholder="Buscar pergunta ou finalidade" autocomplete="off"></label></div>'+
   '<div class="rt-v914-question-layout"><div><div id="rt-v913-question-list" class="rt-v914-question-list">'+rows.map(q=>'<article data-v913-question data-search="'+ctx.esc(norm(q.text+' '+q.purpose+' '+q.phase))+'"><span>'+ctx.esc(q.phase)+'</span><p>'+ctx.esc(q.text)+'</p><button class="'+(selected.includes(q.id)?'btn-secondary':'btn-primary')+'" type="button" data-act="rt-v913-toggle-question" data-id="'+ctx.esc(q.id)+'" aria-pressed="'+selected.includes(q.id)+'">'+(selected.includes(q.id)?'✓ Selecionada':'Adicionar à sessão')+'</button></article>').join('')+'</div>'+
   '<p id="rt-v913-question-empty" class="rt-v913-no-results" hidden>Nenhuma pergunta encontrada.</p></div>'+
   '<aside class="rt-v914-picked"><strong>Roteiro deste encontro</strong><small>'+selected.length+'/12 perguntas</small>'+
   (selected.length?'<ol>'+selected.map(id=>{const q=questions.find(q=>q.id===id);return '<li>'+ctx.esc(q.text)+'</li>'}).join('')+'</ol>':'<p>Selecione perguntas do banco para montar um roteiro opcional.</p>')+
   '</aside></div></section>';
 }
 function during(m,ctx){
  const s=m.s;
  const timer=root.RTSessionAssist.renderTimer(ctx.db,s.id,{esc:ctx.esc,dateFmt:ctx.dateFmt,wsUrl:ctx.wsUrl,today:ctx.today});
  return '<div class="rt-v914-stage-content"><div class="rt-v914-card rt-v914-timer-wrapper">'+sectionHeading('CONDUÇÃO','Tempo do encontro','Use os controles sem sair do acompanhamento.')+
   '<div class="rt-v914-embedded-timer">'+timer+'</div></div>'+
   '<section class="rt-v914-card">'+sectionHeading('ANOTAÇÕES INTERNAS','Registre observações relevantes','Use apenas dados fictícios. Notas são privadas e não geram automaticamente tarefas ou devolutivas.')+
   '<form id="rt-v914-live-form"><input type="hidden" name="sessionId" value="'+ctx.esc(s.id)+'"><label class="rt-v914-live-label">Notas do encontro<textarea name="liveNotes" maxlength="1600" rows="5" placeholder="Síntese breve e fictícia da condução...">'+ctx.esc(s.liveNotes||'')+'</textarea></label>'+
   '<div class="rt-v914-form-foot"><small>Até 1.600 caracteres · salvo somente neste navegador.</small><button class="btn-primary" type="submit">Salvar notas internas</button></div></form></section>'+
   questionsPanel(m,ctx)+'<nav class="rt-v914-stage-next" aria-label="Continuar atendimento"><a class="btn-secondary" href="'+link(m,'depois',ctx)+'">Continuar para Depois →</a></nav></div>';
 }
 function after(m,ctx){
  const s=m.s,done=s.status==='concluida';
  const recapShared=done&&s.visibility==='compartilhado'&&s.recapVisibility==='compartilhado'&&s.clientRecap;
  return '<div class="rt-v914-stage-content">'+
  '<div class="rt-v914-two-col"><section class="rt-v914-card">'+sectionHeading('ENCERRAMENTO','Registrar o que foi combinado',done?'Encontro concluído. Consulte e atualize os registros existentes.':'Conclua o encontro depois de revisar a síntese e os acordos.')+
  '<div class="rt-v914-status-line"><span class="'+(done?'is-complete':'')+'">'+(done?'✓ Encontro concluído':'• Ainda agendado')+'</span>'+
  (!done?'<span>Conclua pelo botão no cabeçalho.</span>':'<span>Conclusão registrada</span>')+'</div>'+
  '<div class="rt-v914-context-block"><strong>Síntese interna</strong><p>'+ctx.esc(s.summary||'Nenhuma síntese registrada.')+'</p></div>'+
  '<div class="rt-v914-context-block"><strong>Notas da condução</strong><p>'+ctx.esc(s.liveNotes||'Nenhuma anotação interna salva.')+'</p></div>'+
  (!done?'<p class="rt-v914-muted">Ao concluir, a síntese interna não é compartilhada com o cliente.</p>':'')+
  '</section><section class="rt-v914-card">'+sectionHeading('COMPARTILHAMENTO','Resumo para Minha Jornada',recapShared?'Compartilhado com o participante de forma explícita.':'Conteúdo restrito por padrão.')+
  '<span class="rt-v914-visibility '+(recapShared?'is-public':'')+'">'+(recapShared?'Compartilhado':'Restrito')+'</span>'+
  '<p>'+ctx.esc(s.clientRecap||'Não há resumo compartilhável registrado.')+'</p>'+
  (done?ctx.btn('Editar resumo e compartilhamento','edit-session-recap',s.id,'btn-secondary'):'<small>Conclua o encontro para preparar o resumo compartilhável.</small>')+
  '</section></div>'+
  '<section class="rt-v914-card">'+sectionHeading('ACOMPANHAMENTO','Compromissos deste encontro','Os acordos são vinculados ao Plano de Ação original, sem duplicação.')+
  '<div class="rt-v914-form-foot"><span>'+m.linked.length+' compromisso(s) associado(s)</span><span>Gerencie pela lateral</span></div>'+
  (m.linked.length?'<ul class="rt-v914-tasks">'+m.linked.map(a=>actionRow(a,ctx)).join('')+'</ul>':summaryCard('Nenhum compromisso neste encontro','Adicione um acordo concreto, com objetivo e prazo, para dar continuidade.'))+
  '<div class="rt-v914-footer-links"><a href="'+ctx.wsUrl(m.c.id,'desenvolvimento',m.p.id)+'">Ver plano de desenvolvimento →</a><a href="'+link(m,'antes',ctx)+'">Rever preparação →</a></div>'+(done&&m.p.status!=='finalizado'?'<div class="rt-v914-stage-next">'+ctx.btn('Agendar próximo encontro','new-session-for',m.p.id,'btn-secondary')+'</div>':'')+'</section></div>';
 }
 function render(db,s,ctx){
  const m=model(db,s);
  if(!m)return '<p class="rt-v914-muted">Sessão não encontrada neste processo.</p>';
  const moment=stages.some(([id])=>id===ctx.moment)?ctx.moment:(s.status==='concluida'?'depois':'antes');
  const carried=m.carried.length,linked=m.linked.length;
  const sheet='<aside class="rt-v914-rail" aria-label="Contexto fixo da sessão">'+
   '<div class="rt-v914-rail-card"><span>PROCESSO DE DESENVOLVIMENTO</span><strong>'+ctx.esc(m.p.goal)+'</strong><small>'+ctx.esc(m.p.stage||'Etapa não definida')+'</small></div>'+
   '<div class="rt-v914-rail-card"><h3>O que precisa da sua atenção</h3>'+
   '<div class="rt-v914-mini-metric"><span>Compromissos pendentes</span><strong>'+carried+'</strong></div>'+
   '<div class="rt-v914-mini-metric"><span>Acordos deste encontro</span><strong>'+linked+'</strong></div>'+
   '<div class="rt-v914-mini-metric"><span>Perguntas selecionadas</span><strong>'+(s.coachingQuestionIds||[]).length+'</strong></div>'+
   '<div class="rt-v914-rail-links"><a href="'+link(m,'antes',ctx)+'">Ver contexto anterior →</a><a href="'+link(m,'depois',ctx)+'">Ver compromissos →</a></div></div>'+ 
   '<div class="rt-v914-rail-card rt-v914-rail-actions"><h3>Compromissos deste encontro</h3><p>'+linked+' acordo(s) vinculados à sessão atual.</p>'+ctx.btn('+ Novo acordo','new-session-action',s.id,'btn-secondary')+'</div>'+
   '<details class="rt-v914-rail-card"><summary>Visibilidade e privacidade</summary><p>A preparação, as perguntas e as anotações são internas. Os acordos e os resumos só aparecem na Minha Jornada quando explicitamente compartilhados.</p></details>'+
   '</aside>';
  const content=moment==='antes'?before(m,ctx):moment==='durante'?during(m,{...ctx,db}):after(m,ctx);
  return '<div class="rt-v914-workspace" data-rt-v914-workspace data-session="'+ctx.esc(s.id)+'">'+
   '<div class="rt-v914-backline"><a href="'+ctx.wsUrl(m.c.id,'sessoes',m.p.id)+'">← Todas as sessões</a><span>Atendimento individual</span></div>'+
   '<header class="rt-v914-hero"><div><span class="rt-v914-overline">ENCONTRO · '+(s.status==='concluida'?'REALIZADO':'AGENDADO')+'</span>'+
   '<h2>'+ctx.esc(m.c.name)+'</h2><p>'+ctx.esc(s.clientTopic||'Sessão de acompanhamento')+'</p>'+
   '<div class="rt-v914-meta"><span>'+ctx.dateFmt(s.date)+' · '+ctx.esc(s.time||'')+'</span><span>'+ (s.visibility==='compartilhado'?'Agenda compartilhada':'Agenda restrita')+'</span></div></div>'+
   '<div class="rt-v914-hero-cta">'+(s.status==='agendada'?ctx.btn('Concluir encontro','close-session',s.id,'btn-primary'):'<span class="rt-v914-done">✓ Concluída</span>')+'</div></header>'+
   '<nav class="rt-v914-stage-nav" aria-label="Etapas do atendimento">'+stages.map(([id,n,title,subtitle])=>
    '<a href="'+link(m,id,ctx)+'"'+(id===moment?' aria-current="step"':'')+'><span class="rt-v914-stage-number">'+n+'</span><span><strong>'+title+'</strong><small>'+subtitle+'</small></span></a>').join('')+'</nav>'+
   '<div class="rt-v914-shell"><section class="rt-v914-stage" aria-label="Etapa '+safe(moment)+'">'+content+'</section>'+sheet+'</div>'+
   '</div>';
 }
 root.RTSessionWorkspace=Object.freeze({model,render,stages});
})(window);
