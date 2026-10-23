/* RealTalent V9.12 — ferramentas de desenvolvimento, exclusivamente demonstrativas. */
(function(root){
 'use strict';
 const defaultAreas=['Trabalho e propósito','Relacionamentos','Organização','Aprendizado','Lazer','Equilíbrio da rotina','Autonomia','Projetos pessoais'];
 const escFallback=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const processData=(d,id)=>{
  const ps=(d.programs||[]).filter(p=>d.clients.some(c=>c.id===p.clientId));
  const p=ps.find(x=>x.id===id)||ps.find(x=>x.status==='em andamento')||ps[0];
  return {ps,p,client:d.clients.find(c=>c.id===p?.clientId)};
 };
 const url=(tab,pid='',extra='')=>'#ferramentas?tab='+encodeURIComponent(tab)+(pid?'&program='+encodeURIComponent(pid):'')+(extra?'&'+extra:'');
 function processPicker(d,tab,p,ps,client,esc){
  return '<div class="rt-v912-context"><label for="rt-v912-program"><strong>Cliente e processo</strong><span>As informações permanecem vinculadas a este acompanhamento.</span></label>'+
  '<select id="rt-v912-program" aria-label="Selecionar cliente e processo">'+ps.map(item=>{
   const c=d.clients.find(x=>x.id===item.clientId);
   return '<option value="'+esc(item.id)+'"'+(item.id===p.id?' selected':'')+'>'+esc((c?.name||'Cliente')+' · '+item.goal)+'</option>';
  }).join('')+'</select><a class="rt-v912-link" href="#cliente='+encodeURIComponent(client.id)+'&tab=desenvolvimento&program='+encodeURIComponent(p.id)+'">Abrir acompanhamento →</a></div>';
 }
 function wheelSvg(areas,previous){
  const data=(Array.isArray(areas)?areas:[]).slice(0,10).map(a=>({name:String(a.name||''),score:Math.max(0,Math.min(10,Number(a.score)||0))}));const n=data.length;
  if(!n)return '';
  const R=87,c=110,ang=i=>-Math.PI/2+2*Math.PI*i/n;
  const point=(i,k)=>[(c+Math.cos(ang(i))*R*k/10).toFixed(2),(c+Math.sin(ang(i))*R*k/10).toFixed(2)].join(',');
  const poly=(scores)=>scores.map((v,i)=>point(i,v)).join(' ');
  const guide=[2.5,5,7.5,10].map(k=>'<polygon points="'+data.map((a,i)=>point(i,k)).join(' ')+'" class="rt-v912-gridline"/>').join('');
  const axes=data.map((a,i)=>'<line x1="110" y1="110" x2="'+point(i,10).replace(',','" y2="')+'" class="rt-v912-axis"/>').join('');
  const same=Array.isArray(previous)&&previous.length===data.length&&data.every((a,i)=>a.name.trim().toLocaleLowerCase('pt-BR')===String(previous[i].name||'').trim().toLocaleLowerCase('pt-BR'));
  const old=same?'<polygon class="rt-v912-previous" points="'+poly(previous.map(x=>Number(x.score)||0))+'"/>':'';
  const dots=data.map((a,i)=>{const [x,y]=point(i,a.score).split(',');return '<circle cx="'+x+'" cy="'+y+'" r="3.5" class="rt-v912-dot"/>';}).join('');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" role="img" aria-label="'+escFallback('Roda de autoavaliação: '+data.map(a=>a.name+' '+a.score+' de 10').join(', '))+'"><circle cx="110" cy="110" r="103" class="rt-v912-guide"/>'+guide+axes+old+'<polygon class="rt-v912-current" points="'+poly(data.map(a=>a.score))+'"/>'+dots+'</svg>';
 }
 function renderWheel(d,programId,ctx){
  const {esc,dateFmt,today}=ctx;const {ps,p,client}=processData(d,programId);
  if(!p)return '<section class="rt-v912-empty"><h2>Primeiro, crie um processo</h2><p>A Roda da Vida é uma reflexão subjetiva vinculada a um acompanhamento, não um teste psicológico.</p><a class="btn-primary" href="#clientes">Abrir Clientes →</a></section>';
  const hist=(d.wheelAssessments||[]).filter(x=>x.programId===p.id).slice().sort((a,b)=>(b.date+'T'+(b.createdAt||'')).localeCompare(a.date+'T'+(a.createdAt||'')));
  const latest=hist[0],prior=hist[1];
  const areas=(latest?.areas?.length?latest.areas:defaultAreas.map(name=>({name,score:5}))).map(x=>({...x}));
  const previous=prior?.areas;
  const rows=areas.map((a,i)=>'<div class="rt-v912-wheel-row"><label><span class="rt-v912-number">'+String(i+1).padStart(2,'0')+'</span><input type="text" name="name-'+i+'" maxlength="65" required aria-label="Nome da dimensão '+(i+1)+'" value="'+esc(a.name)+'"></label><div class="rt-v912-range"><input type="range" name="score-'+i+'" min="0" max="10" step="1" value="'+Number(a.score)+'" aria-label="Nota da dimensão '+(i+1)+'"><output data-wheel-output="'+i+'">'+Number(a.score)+'/10</output></div></div>').join('');
  const history=hist.slice(0,6).map(row=>'<div class="rt-v912-history-row"><div><strong>'+dateFmt(row.date)+'</strong><small>'+row.areas.length+' dimensões · Autoavaliação subjetiva</small>'+(row.note?'<p>'+esc(row.note)+'</p>':'')+'</div><button type="button" class="btn-secondary rt-v912-remove" data-act="rt-v912-wheel-delete" data-id="'+esc(row.id)+'" aria-label="Excluir registro de '+esc(dateFmt(row.date))+'">Excluir</button></div>').join('');
  return '<section class="rt-v912-tools" aria-label="Roda da Vida">'+processPicker(d,'roda',p,ps,client,esc)+
  '<div class="rt-v912-heading"><div><span class="eyebrow">REFLEXÃO SUBJETIVA · NÃO DIAGNÓSTICA</span><h2>Roda da Vida</h2><p>Escolha as áreas que fazem sentido para este processo e atribua notas de satisfação percebida de 0 a 10. Salve registros ao longo do tempo, sem transformar notas em diagnóstico.</p></div><span class="rt-v912-badge">Privado · Profissional</span></div>'+
  '<div class="rt-v912-wheel-layout"><section class="rt-v912-card"><div class="rt-v912-card-title"><h3>Dimensões e percepção atual</h3><span>Notas ajustáveis</span></div><form id="rt-v912-wheel-form" autocomplete="off"><input type="hidden" name="programId" value="'+esc(p.id)+'"><div class="rt-v912-wheel-rows">'+rows+'</div><div class="rt-v912-wheel-bottom"><label>Data desta reflexão<input name="date" type="date" required value="'+esc(today())+'"></label><label>Observação contextual (opcional)<textarea name="note" maxlength="400" rows="3" placeholder="Contextualize sem registrar informações clínicas reais."></textarea></label></div><div class="rt-v912-form-actions"><p>Cada salvamento cria um registro histórico; não altera o anterior.</p><button type="submit" class="btn-primary">Salvar nova roda</button></div></form></section>'+
  '<aside class="rt-v912-card rt-v912-graphic"><h3>Visualização</h3><div id="rt-v912-chart">'+wheelSvg(areas,previous)+'</div><div class="rt-v912-legend"><span>● Percepção atual</span>'+(prior?'<span>┄ Registro anterior</span>':'')+'</div><p>As notas representam apenas a percepção registrada naquele momento. Comparações não demonstram mudança psicológica.</p></aside></div>'+
  '<section class="rt-v912-card"><div class="rt-v912-card-title"><h3>Histórico deste processo</h3><span>'+hist.length+' registro(s)</span></div>'+(hist.length?history:'<p class="rt-v912-muted">Nenhum registro salvo. Ajuste as notas acima e salve a primeira roda.</p>')+'</section></section>';
 }
 const fields=[
  ['what','O quê? · What','Qual ação concreta será realizada?','text',300,true],
  ['why','Por quê? · Why','Qual objetivo justifica esta ação?','textarea',450,true],
  ['where','Onde? · Where','Em que contexto ou ambiente?','text',160,false],
  ['when','Quando? · When','Prazo combinado','date',10,true],
  ['who','Quem? · Who','Quem ficará responsável?','text',140,true],
  ['how','Como? · How','Quais passos serão necessários?','textarea',550,true],
  ['howMuch','Quanto custa? · How much','Recursos ou custo estimado (opcional)','text',130,false]
 ];
 function renderFive(d,programId,actionId,ctx){
  const {esc,dateFmt,today,wsUrl}=ctx;const {ps,p,client}=processData(d,programId);
  if(!p)return '<section class="rt-v912-empty"><h2>Primeiro, crie um processo</h2><p>O plano 5W2H precisa ser vinculado a um objetivo de desenvolvimento.</p><a class="btn-primary" href="#clientes">Abrir Clientes →</a></section>';
  const goals=(d.goals||[]).filter(g=>g.programId===p.id),actions=(d.actions||[]).filter(a=>a.programId===p.id);
  const a=actions.find(a=>a.id===actionId);const f=a?.fiveWTwoH||{};
  const vals={what:a?.title||'',why:f.why||'',where:f.where||'',when:a?.due||today(),who:f.who||'',how:f.how||'',howMuch:f.howMuch||''};
  const inputs=fields.map(([key,title,hint,type,max,required])=>'<label class="rt-v912-five-field"><strong>'+title+'</strong><span>'+hint+'</span>'+(type==='textarea'?'<textarea name="'+key+'" maxlength="'+max+'" rows="3"'+(required?' required':'')+'>'+esc(vals[key])+'</textarea>':'<input type="'+type+'" name="'+key+'" maxlength="'+max+'" value="'+esc(vals[key])+'"'+(required?' required':'')+'>')+'</label>').join('');
  const items=actions.filter(x=>x.fiveWTwoH).slice().sort((x,y)=>(x.due||'').localeCompare(y.due||'')).slice(0,8);
  return '<section class="rt-v912-tools" aria-label="Matriz 5W2H">'+processPicker(d,'5w2h',p,ps,client,esc)+
  '<div class="rt-v912-heading"><div><span class="eyebrow">PLANEJAMENTO · AÇÃO CONCRETA</span><h2>Matriz 5W2H</h2><p>Estruture uma ação existente ou crie uma nova sem duplicar o Plano de Ação. Os detalhes 5W2H permanecem internos, enquanto a ação continua no fluxo original do processo.</p></div><span class="rt-v912-badge">Integrada ao Plano de Ação</span></div>'+
  '<div class="rt-v912-five-layout"><section class="rt-v912-card"><label class="rt-v912-picker"><strong>Ação que deseja planejar</strong><span>Escolha uma ação existente para completar a matriz ou crie outra.</span><select id="rt-v912-action-select"><option value="">+ Criar nova ação</option>'+actions.map(x=>'<option value="'+esc(x.id)+'"'+(a?.id===x.id?' selected':'')+'>'+esc(x.title)+'</option>').join('')+'</select></label>'+
  (goals.length?'<form id="rt-v912-five-form" autocomplete="off"><input type="hidden" name="programId" value="'+esc(p.id)+'"><input type="hidden" name="actionId" value="'+esc(a?.id||'')+'"><label class="rt-v912-five-field"><strong>Objetivo relacionado</strong><span>O vínculo é obrigatório e deve pertencer ao processo selecionado.</span><select name="goalId" required>'+goals.map(g=>'<option value="'+esc(g.id)+'"'+((a?.goalId||goals[0].id)===g.id?' selected':'')+'>'+esc(g.title)+'</option>').join('')+'</select></label><div class="rt-v912-five-fields">'+inputs+'</div><div class="rt-v912-form-actions"><p>'+(a?.visibility==='compartilhado'?'Esta ação já é compartilhada: título e prazo podem aparecer na Minha Jornada. Os demais detalhes do 5W2H ficam restritos.':'Ações novas começam privadas. O compartilhamento exige autorização posterior do profissional.')+'</p><button type="submit" class="btn-primary">'+(a?'Atualizar ação existente':'Criar ação com 5W2H')+'</button></div></form>':'<p>Adicione um objetivo neste processo antes de montar o plano.</p><a class="btn-primary" href="'+wsUrl(client.id,'desenvolvimento',p.id)+'">Abrir objetivos →</a>')+'</section>'+
  '<aside class="rt-v912-card"><h3>Ações planejadas neste processo</h3>'+(items.length?items.map(row=>'<div class="rt-v912-five-item"><strong>'+esc(row.title)+'</strong><small>'+esc(dateFmt(row.due))+' · '+(row.status==='concluido'?'Concluída':'Pendente')+'</small><a href="'+url('5w2h',p.id,'action='+encodeURIComponent(row.id))+'">Editar matriz →</a></div>').join(''):'<p class="rt-v912-muted">Nenhuma ação com matriz 5W2H preenchida.</p>')+'<a class="rt-v912-link" href="'+wsUrl(client.id,'desenvolvimento',p.id)+'">Abrir Plano de Ação →</a></aside></div></section>';
 }
 root.RTDevelopmentToolkit=Object.freeze({renderWheel,renderFive,wheelSvg,defaultAreas});
})(window);
