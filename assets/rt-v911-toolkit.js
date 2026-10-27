/* V9.11 — Kit do Profissional. Somente demonstração local; não usar dados reais. */
window.RTProfessionalKit = (function kitFactory(){
 'use strict';
 function render(db,selectedId,ui){
  const {esc,dateFmt,wsUrl,today}=ui;
  const sessions=(db.sessions||[]).filter(s=>(!ui.contextProgramId||s.programId===ui.contextProgramId)&&db.programs.some(p=>p.id===s.programId)&&db.clients.some(c=>c.id===db.programs.find(p=>p.id===s.programId)?.clientId))
    .slice().sort((a,b)=>(a.date+'T'+(a.time||'00:00')).localeCompare(b.date+'T'+(b.time||'00:00')));
  const s=sessions.find(x=>x.id===selectedId)||sessions.find(x=>x.status==='agendada'&&x.date>=today())||sessions[sessions.length-1];
  if(!s)return '<section class="rt-v911-empty"><h2>Prepare seu próximo encontro</h2><p>Este kit usa sessões que já existem. Agende uma sessão em um processo para montar a pauta e revisar os compromissos, sem criar cadastros duplicados.</p><a class="btn-primary" href="#sessoes">Ir para sessões →</a></section>';
  const p=db.programs.find(x=>x.id===s.programId),c=db.clients.find(x=>x.id===p.clientId);
  const sessionKey=(x)=>(x.date||'')+'T'+(x.time||'00:00');
  const previous=db.sessions.filter(x=>x.programId===p.id&&x.id!==s.id&&x.status==='concluida'&&sessionKey(x)<sessionKey(s)).sort((a,b)=>sessionKey(b).localeCompare(sessionKey(a)))[0];
  const open=db.actions.filter(a=>a.programId===p.id&&a.status==='pendente'&&a.sessionId!==s.id&&(!a.sessionId||db.sessions.some(pr=>pr.id===a.sessionId&&pr.programId===p.id&&sessionKey(pr)<=sessionKey(s))))
    .sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
  const tied=db.actions.filter(a=>a.programId===p.id&&a.sessionId===s.id);
  const prep=s.preparation||{};
  const items=[
   ['goal','G · Objetivo','O que precisa estar mais claro ao final do encontro?','Ex.: definir o resultado desejado e como reconhecê-lo.'],
   ['reality','R · Realidade','Quais fatos, avanços ou obstáculos precisam ser compreendidos?','Ex.: observar fatos e alternativas sem pressupor causas.'],
   ['options','O · Opções','Que possibilidades podem ser exploradas pela pessoa?','Ex.: construir opções sem antecipar uma solução.'],
   ['wayForward','W · Próximos passos','Que combinação concreta merece acompanhamento?','Ex.: ação, condições e como revisar no próximo encontro.']
  ];
  const filled=items.filter(([key])=>String(prep[key]||'').trim()).length;
  const options=sessions.map(item=>{
    const pro=db.programs.find(p=>p.id===item.programId),cli=db.clients.find(c=>c.id===pro?.clientId);
    return '<option value="'+esc(item.id)+'"'+(item.id===s.id?' selected':'')+'>'+esc((cli?.name||'Cliente')+' · '+dateFmt(item.date)+' · '+(item.time||'')+' · '+(item.status==='concluida'?'Concluída':'Agendada'))+'</option>';
  }).join('');
  const actionMarkup=(list)=>list.length?list.slice(0,5).map(a=>'<li><span>'+esc(a.title)+'</span><small>'+(a.due?'Prazo: '+dateFmt(a.due):'Sem prazo')+'</small></li>').join(''):'<li class="rt-v911-nothing">Nenhum compromisso nesta categoria.</li>';
  return '<section class="rt-v911-kit" aria-label="Kit de preparação do profissional">'+
   '<div class="rt-v911-pick"><label for="rt-v911-session-select"><strong>Encontro em preparação</strong><span>Selecione a sessão para carregar o contexto correto.</span></label><select id="rt-v911-session-select">'+options+'</select></div>'+
   '<div class="rt-v911-summary"><div><span class="rt-v911-kicker">CLIENTE E PROCESSO</span><h2>'+esc(c.name)+'</h2><p>'+esc(p.goal)+'</p><small>Etapa: '+esc(p.stage||'Não definida')+'</small></div><div class="rt-v911-summary-side"><span class="rt-v911-pill">'+esc(s.status==='concluida'?'Encontro concluído':'Encontro agendado')+'</span><strong>'+dateFmt(s.date)+' · '+esc(s.time||'')+'</strong><a class="btn-secondary" href="'+wsUrl(c.id,'sessoes',p.id,'session='+encodeURIComponent(s.id))+'">Abrir detalhes da sessão →</a></div></div>'+
   '<div class="rt-v911-grid"><section class="rt-v911-card"><div class="rt-v911-card-head"><h3>01 · Contexto para a sessão</h3><span>Leitura rápida</span></div><dl class="rt-v911-facts"><div><dt>Foco registrado</dt><dd>'+esc(s.focus||'Não informado')+'</dd></div><div><dt>Último encontro concluído</dt><dd>'+esc(previous?dateFmt(previous.date):'Nenhum encontro anterior')+'</dd></div></dl>'+(previous?.summary?'<details><summary>Consultar síntese interna anterior</summary><p>'+esc(previous.summary)+'</p></details>':'')+
   '<p class="rt-v911-note">A pauta e a síntese são internas. Não aparecem na Minha Jornada.</p></section>'+
   '<section class="rt-v911-card"><div class="rt-v911-card-head"><h3>02 · Compromissos para retomar</h3><span>'+open.length+' em aberto</span></div><ul class="rt-v911-actions">'+actionMarkup(open)+'</ul><p class="rt-v911-foot">'+tied.length+' acordo(s) já associado(s) a esta sessão.</p><a class="rt-v911-link" href="'+wsUrl(c.id,'desenvolvimento',p.id)+'">Ver plano de ação →</a></section></div>'+
   '<section class="rt-v911-card rt-v911-work"><div class="rt-v911-card-head"><div><h3>03 · Roteiro GROW</h3><p>Estrutura opcional de perguntas para organização do encontro, não um protocolo clínico.</p></div><span class="rt-v911-pill">'+filled+'/4 blocos</span></div>'+
   '<form id="rt-v911-prep-form" autocomplete="off"><input type="hidden" name="sessionId" value="'+esc(s.id)+'"/><div class="rt-v911-fields">'+items.map(([key,title,label,placeholder])=>'<label><strong>'+title+'</strong><span>'+label+'</span><textarea name="'+key+'" rows="4" maxlength="650" placeholder="'+esc(placeholder)+'">'+esc(prep[key]||'')+'</textarea></label>').join('')+'</div><div class="rt-v911-save"><p>Salvo apenas nesta demonstração local. Nunca inclua registros clínicos ou informações reais.</p><button class="btn-primary" type="submit">Salvar preparação</button></div></form></section>'+
   '</section>';
 }
 return Object.freeze({render});
})();
