/* RealTalent Professional V9.6 — protótipo local persistido APENAS no navegador. Sem autenticação ou segurança para dados reais. */
'use strict';
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = () => { const d = new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
const plus = n => { const d = new Date(); d.setDate(d.getDate()+n); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
const dateFmt = s => !s ? 'Não definido' : new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
const day = s => new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit'});
const month = s => new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{month:'short'}).replace('.','').toUpperCase();
const newid = prefix => RTDemoStore.freshId(prefix);
function examples(){return {
 clients:[
  {id:'c1',name:'Cliente demonstrativo 01',focus:'Comunicação e alinhamento de expectativas',status:'ativo',contact:'Atendimento individual',created:plus(-12)},
  {id:'c2',name:'Cliente demonstrativo 02',focus:'Desenvolvimento de liderança',status:'ativo',contact:'Atendimento individual',created:plus(-20)},
  {id:'c3',name:'Cliente demonstrativo 03',focus:'Planejamento de carreira',status:'ativo',contact:'Atendimento individual',created:plus(-26)}
 ],
 programs:[
  {id:'p1',clientId:'c1',goal:'Aprimorar conversas difíceis e acordos de comunicação',stage:'Exploração de objetivos',status:'em andamento',start:plus(-12)},
  {id:'p2',clientId:'c2',goal:'Desenvolver delegação, feedback e autonomia da equipe',stage:'Plano de ação',status:'em andamento',start:plus(-20)},
  {id:'p3',clientId:'c3',goal:'Definir critérios pessoais para os próximos passos profissionais',stage:'Avaliação inicial',status:'em andamento',start:plus(-26)}
 ],
 sessions:[
  {id:'s1',programId:'p1',date:plus(1),time:'10:00',focus:'Alinhar objetivos e situações de comunicação',status:'agendada',summary:''},
  {id:'s2',programId:'p2',date:plus(2),time:'14:30',focus:'Revisar experimentos de delegação',status:'agendada',summary:''},
  {id:'s3',programId:'p3',date:plus(4),time:'09:00',focus:'Explorar critérios para tomada de decisão',status:'agendada',summary:''},
  {id:'s4',programId:'p2',date:plus(-4),time:'15:00',focus:'Construir um plano de ação observável',status:'concluida',summary:'Exemplo fictício de encerramento: revisados próximos passos e acordos.'}
 ],
 actions:[
  {id:'a1',programId:'p1',title:'Praticar uma pergunta aberta em uma conversa de rotina',due:plus(3),status:'pendente',resource:'Communication Lab'},
  {id:'a2',programId:'p2',title:'Definir critérios de delegação e revisar com a equipe',due:plus(5),status:'pendente',resource:'Guia de comunicação'},
  {id:'a3',programId:'p3',title:'Listar opções e critérios profissionais',due:plus(-2),status:'concluido',resource:'Roteiro de coaching'}
 ]
};}
let db=RTDemoStore.load();
const persist=(actor,action,id)=>{RTDemoStore.log(db,actor,action,id||'');RTDemoStore.save(db);};
const pages={inicio:'Visão geral',clientes:'Clientes',processos:'Processo de desenvolvimento','atividades-guiadas':'Atividades guiadas','graficos-relatorios':'Gráficos e relatórios',sessoes:'Sessões','plano-desenvolvimento':'Plano de desenvolvimento','plano-acao':'Plano de ação',ferramentas:'Ferramentas',biblioteca:'Biblioteca',configuracoes:'Configurações'};
const client=id=>db.clients.find(c=>c.id===id);
const program=id=>db.programs.find(p=>p.id===id);
const clientOf=p=>client(p?.clientId)?.name || 'Cliente não vinculado';
const pgName=id=>{let p=program(id);return p?clientOf(p):'Não vinculado'};
const status = t => `<span class="status ${esc(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')}">${esc(t)}</span>`;
const btn=(label,act,id='',cls='line-button')=>`<button type="button" class="${cls}" data-act="${act}" data-id="${esc(id)}">${label}</button>`;
const head=(ey,title,subtitle,buttons='')=>`<div class="page-head"><div><div class="eyebrow">${ey}</div><h1 class="page-title">${title}</h1><p class="lead">${subtitle}</p></div><div class="page-actions">${buttons}</div></div>`;
const empty=(title,subtitle)=>`<div class="empty"><b>${title}</b>${subtitle}</div>`;
const badgeWarn='<div class="warning"><strong>Protótipo local — não insira dados reais.</strong>Dados fictícios são salvos somente neste navegador para permitir testar o fluxo profissional ↔ cliente. NÃO há autenticação, controle de acesso, armazenamento seguro ou sincronização em nuvem.</div>';
function attentionQueue(){
 const needs=[];
 db.discAssignments.filter(t=>t.status==='respondido'&&!t.feedback).forEach(t=>{const p=program(t.programId);if(p)needs.push({clientId:p.clientId,programId:p.id,label:'DISC/ACER concluído',detail:'Resposta pronta para análise',tab:'resultados',priority:1});});
 db.instruments.filter(i=>i.responses&&!i.feedback).forEach(i=>{const p=program(i.programId);if(p)needs.push({clientId:p.clientId,programId:p.id,label:'Atividade respondida',detail:i.title,tab:'atividades',priority:2});});
 db.actions.filter(a=>a.status==='pendente'&&a.due&&a.due<today()).forEach(a=>{const p=program(a.programId);if(p)needs.push({clientId:p.clientId,programId:p.id,label:'Ação com prazo vencido',detail:a.title,tab:'desenvolvimento',priority:3});});
 return needs.sort((a,b)=>a.priority-b.priority);
}
function wsUrl(id,tab='geral',pid='',extra=''){
 return '#cliente='+encodeURIComponent(id)+'&tab='+encodeURIComponent(tab)+(pid?'&program='+encodeURIComponent(pid):'')+(extra?'&'+extra:'');
}
function workspaceButton(label,id,tab='geral',pid='',cl='line-button'){
 return `<a class="${cl}" href="${wsUrl(id,tab,pid)}">${label}</a>`;
}
function showHome(){
 const ss=db.sessions.filter(s=>s.status==='agendada'&&!isElapsedAppointment(s)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 const daySessions=ss.filter(s=>s.date===today());const attention=attentionQueue();
 const due=db.actions.filter(a=>a.status==='pendente');
 return head('PAINEL DE TRABALHO','Visão geral','Suas próximas sessões e o que precisa da sua atenção.',btn('+ Novo cliente','new-client','','btn-primary')+(ss.length?`<a class="btn-secondary" href="${rt96Href('kit','session='+encodeURIComponent(ss[0].id))}">Preparar próxima sessão →</a>`:''))+
 `<div class="rt-v9-search-shortcut"><label for="home-search">Acesso rápido ao cliente</label><div><input class="searchbar" id="home-search" type="search" placeholder="Digite o nome ou objetivo..." autocomplete="off" aria-label="Pesquisar cliente" /><a class="btn-secondary" href="#clientes">Ver todos os clientes</a></div><div class="rt-v9-quick-results" id="home-search-results" aria-live="polite"></div></div>`+
 `<div class="rt-v9-kpis">
 <a class="rt-v9-kpi" href="#sessoes?filter=hoje"><span>Sessões de hoje</span><strong>${daySessions.length}</strong><small>Ver sessões →</small></a>
 <a class="rt-v9-kpi" href="#clientes?filter=atencao"><span>Para analisar</span><strong>${attention.filter(x=>x.priority<3).length}</strong><small>Ver pendências →</small></a>
 <a class="rt-v9-kpi" href="#clientes?filter=pendentes"><span>Ações pendentes</span><strong>${due.length}</strong><small>Abrir clientes →</small></a></div>`+
 `<div class="rt-v9-dashboard"><section class="card"><div class="card-head"><h2>Próximas sessões</h2><a href="#sessoes" class="plain-link">Abrir sessões →</a></div>
 ${ss.length?ss.slice(0,5).map(s=>{const p=program(s.programId);return `<div class="rt-v9-dash-row"><div class="datebox"><strong>${day(s.date)}</strong>${month(s.date)}</div><div class="item-main"><strong>${esc(pgName(s.programId))}</strong><p>${dateFmt(s.date)} · ${esc(s.time)} · ${esc(s.clientTopic||'Sessão')}</p></div>${p?workspaceButton('Abrir',p.clientId,'sessoes',p.id):''}</div>`;}).join(''):empty('Sem sessões futuras','Agende um encontro dentro de um cliente.')}</section>
 <section class="card"><div class="card-head"><h2>Precisam da sua atenção</h2><a href="#clientes?filter=atencao" class="plain-link">Ver todos →</a></div>
 ${attention.length?attention.slice(0,6).map(t=>`<div class="rt-v9-dash-row"><span class="rt-v9-signal">!</span><div class="item-main"><strong>${esc(client(t.clientId)?.name||'Cliente')}</strong><p>${esc(t.label)} · ${esc(t.detail)}</p></div>${workspaceButton('Revisar',t.clientId,t.tab,t.programId)}</div>`).join(''):empty('Tudo em dia','Nenhuma resposta ou prazo vencido requer revisão.')}</section></div>`+
 `<section class="card rt-v9-recent"><div class="card-head"><h2>Clientes recentes</h2><a href="#clientes" class="plain-link">Todos →</a></div><div class="rt-v9-recent-grid">${db.clients.slice().reverse().slice(0,4).map(c=>`<a class="rt-v9-person" href="${wsUrl(c.id)}"><span class="circle-initial">${esc(c.name.slice(0,2).toUpperCase())}</span><span><strong>${esc(c.name)}</strong><small>${esc(c.focus)}</small></span><b aria-hidden="true">→</b></a>`).join('')||empty('Sem clientes','Cadastre seu primeiro cliente demonstrativo.')}</div></section>`;
}
function stat(label,value,icon,foot){return `<div class="stat"><div class="stat-top"><span>${esc(label)}</span><span class="stat-icon">${icon}</span></div><div class="stat-val">${value}</div><div class="stat-foot">${esc(foot)}</div></div>`;}
function tile(title,subtitle,icon,route){return `<button type="button" class="tile" data-act="go" data-id="${route}"><span class="tile-icon">${icon}</span><strong>${title}</strong><span>${subtitle}</span><span class="arrow">Explorar →</span></button>`;}
const clientStates=[['ativo','Ativo'],['pausado','Pausado'],['encerrado','Encerrado'],['arquivado','Arquivado']];
const clientStatusLabel=v=>clientStates.find(([key])=>key===v)?.[1]||'Ativo';
function clientsQuery(){const h=location.hash.split('?')[1]||'';return new URLSearchParams(h);}
function clientsFilters(){return clientsQuery().get('filter')||'todos';}
function clientProcesses(id){return db.programs.filter(p=>p.clientId===id);}
function nextClientSession(id){const ids=new Set(clientProcesses(id).map(p=>p.id));return db.sessions.filter(x=>ids.has(x.programId)&&x.status==='agendada'&&!isElapsedAppointment(x)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0];}
function clientPendingCount(id){const ids=new Set(clientProcesses(id).map(p=>p.id));return db.actions.filter(a=>ids.has(a.programId)&&a.status==='pendente').length+db.discAssignments.filter(t=>ids.has(t.programId)&&t.status==='respondido'&&!t.feedback).length+db.instruments.filter(t=>ids.has(t.programId)&&t.responses&&!t.feedback).length;}
function clientRecentDate(id){const ids=new Set(clientProcesses(id).map(p=>p.id));const found=[client(id)?.updatedAt,client(id)?.created,...clientProcesses(id).map(p=>p.start),...db.sessions.filter(s=>ids.has(s.programId)&&s.date<=today()).map(s=>s.date),...db.discAssignments.filter(t=>ids.has(t.programId)).map(t=>t.completedAt||t.assignedAt),...db.instruments.filter(i=>ids.has(i.programId)).map(i=>i.answeredAt||i.assignedAt)].filter(Boolean).map(x=>String(x).slice(0,10)).sort();return found.at(-1)||'';}
function clientListRows(){const opts=clientsQuery(),filter=opts.get('filter')||'todos',sort=opts.get('sort')||'nome';
 let rows=db.clients.filter(c=>{const state=c.status||'ativo';return filter==='todos'?state!=='arquivado':filter==='atencao'?attentionQueue().some(x=>x.clientId===c.id):filter==='pendentes'?clientPendingCount(c.id)>0:filter===state;});
 const cmp=(a,b)=>sort==='sessao'?(nextClientSession(a.id)?.date||'9999-99-99').localeCompare(nextClientSession(b.id)?.date||'9999-99-99')||a.name.localeCompare(b.name,'pt-BR'):sort==='recente'?clientRecentDate(b.id).localeCompare(clientRecentDate(a.id)):sort==='pendencias'?clientPendingCount(b.id)-clientPendingCount(a.id)||a.name.localeCompare(b.name,'pt-BR'):a.name.localeCompare(b.name,'pt-BR');
 return rows.sort(cmp);
}
function showClients(){const q=clientsQuery();const filter=q.get('filter')||'todos';const sort=q.get('sort')||'nome';const rows=clientListRows();const countState=x=>db.clients.filter(c=>(c.status||'ativo')===x).length;
 const filters=[['todos','Todos'],['ativo','Ativos'],['atencao','Atenção'],['pausado','Pausados'],['encerrado','Encerrados'],['arquivado','Arquivados']];
 return head('ACOMPANHAMENTO','Clientes','Encontre pessoas, identifique pendências e abra o acompanhamento em um só lugar.',btn('+ Novo cliente','new-client','','btn-primary'))+
 `<div class="rt-v92-stat-row"><span><b>${db.clients.length}</b> clientes cadastrados</span><span><b>${countState('ativo')}</b> ativos</span><span><b>${attentionQueue().length}</b> sinais de atenção</span></div>`+
 `<div class="rt-v92-client-controls"><div class="rt-v92-filter-scroll" role="group" aria-label="Filtrar clientes">${filters.map(([k,title])=>`<a class="rt-v92-chip ${filter===k?'selected':''}" href="#clientes?filter=${k}&sort=${encodeURIComponent(sort)}" ${filter===k?'aria-current="page"':''}>${title}</a>`).join('')}</div>
 <div class="rt-v92-client-tools"><label class="rt-v92-search"><span class="sr-only">Pesquisar clientes</span><input id="client-search" class="searchbar" type="search" placeholder="Buscar nome, objetivo ou processo..." autocomplete="off" aria-label="Buscar clientes"></label><label class="rt-v92-sort">Ordenar <select id="rt-v92-client-sort" aria-label="Ordenar clientes">${[['nome','Nome (A–Z)'],['sessao','Próxima sessão'],['recente','Atualização recente'],['pendencias','Mais pendências']].map(([k,t])=>`<option value="${k}" ${sort===k?'selected':''}>${t}</option>`).join('')}</select></label></div></div>`+
 `<div class="card rt-v9-client-list rt-v92-client-list"><div class="table-wrap"><table class="table"><thead><tr><th>CLIENTE</th><th>PROCESSO ATUAL</th><th>PRÓXIMA SESSÃO</th><th>PENDÊNCIAS</th><th>SITUAÇÃO</th><th>AÇÕES</th></tr></thead><tbody>${rows.map(c=>{
 const ps=clientProcesses(c.id),p=ps.find(x=>x.status==='em andamento')||ps[0],s=nextClientSession(c.id),pending=clientPendingCount(c.id);
 return `<tr data-v92-client-row="${esc(c.id)}"><td><div class="profile"><span class="circle-initial">${esc(c.name.slice(0,2).toUpperCase())}</span><div><b>${esc(c.name)}</b><small class="rt-v9-secondary">${esc(c.contact||'Modalidade não definida')}</small></div></div></td><td><span class="rt-v92-cell-clip">${esc(p?.goal||c.focus||'Sem processo')}</span></td><td>${s?dateFmt(s.date)+' · '+esc(s.time):'<span class="muted">Não agendada</span>'}</td><td>${pending?`<span class="rt-v92-pending">${pending} pendente${pending===1?'':'s'}</span>`:'<span class="muted">Em dia</span>'}</td><td>${status(clientStatusLabel(c.status||'ativo'))}</td><td><div class="rt-v92-row-buttons">${workspaceButton('Abrir',c.id,'geral',p?.id||'','btn-secondary')}${btn('Editar','edit-client',c.id,'line-button')}</div></td></tr>`;
 }).join('')||`<tr><td colspan="6">${empty('Nenhum cliente neste filtro','Escolha outro filtro ou cadastre um cliente demonstrativo.')}</td></tr>`}</tbody></table></div><div class="rt-v92-list-footer"><span id="rt-v92-visible-count">${rows.length} clientes exibidos</span><span>O arquivamento preserva o histórico demonstrativo.</span></div></div>`;
}
const WSTABS=[['geral','Visão geral'],['sessoes','Sessões'],['atividades','Atividades'],['resultados','Resultados'],['desenvolvimento','Desenvolvimento'],['documentos','Documentos']];
function cardList(headline,body,action=''){return `<section class="card"><div class="card-head"><h2>${headline}</h2>${action}</div>${body}</section>`;}
function timelineEvents(id,pid){
 const p=program(pid);if(!p||p.clientId!==id)return [];
 const ev=[{when:p.start||client(id)?.created||today(),kind:'processo',label:'Processo iniciado',detail:p.goal,tab:'geral'}];
 // Uma sessão agendada para o futuro não é um acontecimento no histórico.
 // Uma sessão vencida e ainda 'agendada' pede confirmação, nunca é considerada realizada.
 for(const x of db.sessions.filter(x=>x.programId===pid)){
  if(x.status==='concluida')ev.push({when:x.completedAt||x.date,kind:'sessao',label:'Sessão concluída',detail:x.clientTopic||'Encontro de acompanhamento',tab:'sessoes',extra:'session='+encodeURIComponent(x.id)});
  else if(x.status==='agendada'&&isElapsedAppointment(x))ev.push({when:x.date,kind:'sessao',label:'Encontro sem confirmação',detail:(x.clientTopic||'Encontro')+' · Verificar situação',tab:'sessoes',extra:'session='+encodeURIComponent(x.id)});
 }
 for(const a of db.actions.filter(x=>x.programId===pid)){
  if(a.createdAt)ev.push({when:a.createdAt,kind:'acao',label:'Ação combinada',detail:a.title,tab:'desenvolvimento'});
  if(a.status==='pendente'&&a.due&&a.due<today())ev.push({when:a.due,kind:'acao',label:'Prazo vencido',detail:a.title,tab:'desenvolvimento'});
  if(a.completedAt)ev.push({when:a.completedAt,kind:'acao',label:'Ação concluída',detail:a.title,tab:'desenvolvimento'});
 }
 for(const x of db.discAssignments.filter(x=>x.programId===pid)){
  ev.push({when:x.assignedAt,kind:'disc',label:'DISC/ACER atribuído',detail:x.visibility==='compartilhado'?'Atribuição compartilhada':'Rascunho interno',tab:'atividades'});
  if(x.completedAt)ev.push({when:x.completedAt,kind:'disc',label:'DISC/ACER respondido',detail:'Resultado disponível para análise profissional',tab:'resultados'});
 }
 for(const x of db.instruments.filter(x=>x.programId===pid)){
  ev.push({when:x.assignedAt,kind:'atividade',label:'Atividade guiada atribuída',detail:x.title,tab:'atividades'});
  if(x.answeredAt)ev.push({when:x.answeredAt,kind:'atividade',label:'Atividade guiada respondida',detail:x.title,tab:'atividades'});
 }
 for(const x of db.guidance.filter(x=>x.programId===pid))ev.push({when:x.created,kind:'orientacao',label:'Orientação registrada',detail:x.text,tab:'desenvolvimento'});
 return ev.filter(x=>x.when&&/^\d{4}-\d\d-\d\d/.test(String(x.when))&&String(x.when).slice(0,10)<=today())
  .sort((a,b)=>String(b.when).localeCompare(String(a.when)));
}
function showTimeline(id,pid){const raw=decodeURIComponent(location.hash.slice(1));const query=new URLSearchParams(raw.includes('&')?raw.slice(raw.indexOf('&')+1):'');
 const selected=query.get('events')||'todos',period=query.get('period')||'90';const all=timelineEvents(id,pid);const types=[['todos','Tudo'],['sessao','Sessões'],['atividade','Atividades'],['disc','DISC/ACER'],['acao','Ações'],['processo','Processo'],['orientacao','Orientações']];
 const filtered=all.filter(x=>(selected==='todos'||x.kind===selected)&&(period==='todos'||String(x.when).slice(0,10)>=plus(-Number(period))));
 const link=(kind,days)=>wsUrl(id,'geral',pid,'events='+encodeURIComponent(kind)+'&period='+encodeURIComponent(days));
 return `<section class="card rt-v92-timeline"><div class="card-head"><div><h2>Histórico do acompanhamento</h2><p class="rt-v92-muted">Acontecimentos registrados neste processo</p></div><span class="pill">${filtered.length} evento${filtered.length===1?'':'s'}</span></div><div class="rt-v92-timeline-tools"><div class="rt-v92-timeline-filters" role="group" aria-label="Filtrar histórico por tipo de evento">${types.map(([k,t])=>`<a href="${link(k,period)}" class="rt-v92-chip ${k===selected?'selected':''}" ${k===selected?'aria-current="true"':''}>${t}</a>`).join('')}</div><label>Período <select id="rt-v92-period" data-client-id="${esc(id)}" data-program-id="${esc(pid)}" data-event-kind="${esc(selected)}">${[['30','30 dias'],['90','90 dias'],['todos','Todo o histórico']].map(([k,t])=>`<option value="${k}" ${k===period?'selected':''}>${t}</option>`).join('')}</select></label></div>
 ${filtered.length?`<ol class="rt-v92-timeline-list">${filtered.slice(0,60).map(x=>`<li><span class="rt-v92-timeline-dot" aria-hidden="true"></span><div><time datetime="${esc(String(x.when).slice(0,10))}">${dateFmt(String(x.when).slice(0,10))}</time><strong>${esc(x.label)}</strong><p>${esc(x.detail||'')}</p></div><a href="${wsUrl(id,x.tab,pid,x.extra||'')}" class="rt-v92-timeline-open">Abrir →</a></li>`).join('')}</ol>`:empty('Sem registros neste período','Altere os filtros ou registre a primeira atividade do processo.')}</section>`;
}
function isElapsedAppointment(session){
 if(!session?.date||session.status!=='agendada')return false;
 const date=new Date(session.date+'T'+(session.time||'00:00')+':00');
 return !Number.isNaN(date.getTime()) && date.getTime()<Date.now();
}
function nextClientAction(id,pid){
 const p=program(pid), c=client(id);
 const ids=new Set(pid?[pid]:clientProcesses(id).map(x=>x.id));
 if(!p)return {title:'Criar o primeiro processo',sub:'Defina o objetivo do acompanhamento para começar.',act:'new-process-for',target:id,cta:'Criar processo',tone:'neutral'};
 if(c?.status==='arquivado'||c?.status==='encerrado'||p.status==='finalizado')return {title:'Acompanhamento encerrado',sub:'Consulte o histórico ou reabra o processo quando apropriado.',tab:'geral',cta:'Ver histórico',tone:'neutral'};
 if(c?.status==='pausado')return {title:'Cliente com acompanhamento pausado',sub:'Verifique o contexto antes de programar novas atividades.',tab:'geral',cta:'Ver contexto',tone:'neutral'};
 const disc=db.discAssignments.filter(x=>ids.has(x.programId)&&x.status==='respondido'&&!x.feedback)
  .sort((a,b)=>String(a.completedAt||'').localeCompare(String(b.completedAt||'')))[0];
 if(disc)return {title:'Revisar respostas do DISC/ACER',sub:'Questionário concluído; devolutiva ainda não registrada.',tab:'resultados',cta:'Analisar resultado',tone:'attention'};
 const instrument=db.instruments.find(x=>ids.has(x.programId)&&x.responses&&!x.feedback);
 if(instrument)return {title:'Revisar atividade respondida',sub:instrument.title,tab:'atividades',cta:'Revisar resposta',tone:'attention'};
 const elapsed=db.sessions.filter(x=>ids.has(x.programId)&&isElapsedAppointment(x)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0];
 if(elapsed)return {title:'Confirmar situação do encontro',sub:dateFmt(elapsed.date)+' · '+elapsed.time+' — horário já ultrapassado. Conclua ou reagende conforme ocorreu.',tab:'sessoes',extra:'session='+encodeURIComponent(elapsed.id),cta:'Ver sessão',tone:'attention'};
 const overdue=db.actions.filter(x=>ids.has(x.programId)&&x.status==='pendente'&&x.due&&x.due<today()).sort((a,b)=>a.due.localeCompare(b.due))[0];
 if(overdue)return {title:'Acompanhar ação com prazo vencido',sub:overdue.title,tab:'desenvolvimento',cta:'Ver ação',tone:'attention'};
 const future=db.sessions.filter(x=>ids.has(x.programId)&&x.status==='agendada'&&!isElapsedAppointment(x))
  .sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')))[0];
 if(future)return {title:'Preparar o próximo encontro',sub:dateFmt(future.date)+' · '+future.time+' · '+(future.clientTopic||'Encontro de acompanhamento'),tab:'sessoes',extra:'session='+encodeURIComponent(future.id),cta:'Ver encontro',tone:'standard'};
 const nextDue=db.actions.filter(x=>ids.has(x.programId)&&x.status==='pendente'&&x.due).sort((a,b)=>a.due.localeCompare(b.due))[0];
 if(nextDue)return {title:'Acompanhar ação combinada',sub:nextDue.title+' · até '+dateFmt(nextDue.due),tab:'desenvolvimento',cta:'Ver plano',tone:'standard'};
 return {title:'Definir o próximo encontro',sub:'Ainda não existe sessão futura nem ação pendente neste processo.',act:'new-session-for',target:pid,cta:'Agendar sessão',tone:'neutral'};
}
function v93Priority(id,pid){
 const item=nextClientAction(id,pid);
 const action=item.act?btn(esc(item.cta),item.act,item.target,'btn-primary'):`<a class="btn-primary" href="${wsUrl(id,item.tab,pid,item.extra||'')}">${esc(item.cta)}</a>`;
 return `<section class="rt-v92-next-action rt-v93-priority" data-tone="${esc(item.tone||'standard')}" aria-label="Ação que precisa de atenção"><div class="rt-v93-priority-copy"><div class="rt-v93-overline"><span class="rt-v93-indicator" aria-hidden="true"></span> Atenção ao acompanhamento</div><h2>${esc(item.title)}</h2><p>${esc(item.sub)}</p></div><div class="rt-v93-priority-action">${action}</div></section>`;
}
function v93Summary(id,pid,sessions,actions,tasks,instruments,p){
 const goals=RTDemoStore.goalsOf(db,pid);
 const scheduled=sessions.filter(x=>x.status==='agendada'&&!isElapsedAppointment(x))
  .sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));
 const unconfirmed=sessions.filter(isElapsedAppointment).length;
 const held=sessions.filter(x=>x.status==='concluida').length;
 const openActions=actions.filter(x=>x.status==='pendente');
 const lateActions=openActions.filter(x=>x.due&&x.due<today()).length;
 const reviewed=tasks.filter(x=>x.status==='respondido'&&!x.feedback).length+
   instruments.filter(x=>x.responses&&!x.feedback).length;
 const assigned=tasks.length+instruments.length;
 const steps=[
  {id:'objetivos',name:'Objetivos',tab:'desenvolvimento',
   value:goals.length?goals.length+' acordado'+(goals.length===1?'':'s'):'A definir',
   hint:goals.length?'Ver objetivos e etapa':'Definir objetivo do processo'},
  {id:'sessoes',name:'Sessões',tab:'sessoes',attention:unconfirmed>0,
   value:unconfirmed?unconfirmed+' sem confirmação':scheduled[0]?dateFmt(scheduled[0].date)+' · '+(scheduled[0].time||''):held?held+' realizada'+(held===1?'':'s'):'Não agendada',
   hint:unconfirmed?'Verificar encontros':scheduled.length?'Preparar próximo encontro':'Ver agenda e histórico'},
  {id:'acoes',name:'Ações combinadas',tab:'desenvolvimento',attention:lateActions>0,
   value:lateActions?lateActions+' com prazo vencido':openActions.length?openActions.length+' pendente'+(openActions.length===1?'':'s'):actions.length?actions.length+' concluída'+(actions.length===1?'':'s'):'Nenhuma ação',
   hint:lateActions?'Revisar prazos':'Acompanhar compromissos'},
  {id:'atividades',name:'Atividades',tab:'atividades',attention:reviewed>0,
   value:reviewed?reviewed+' para revisar':assigned?assigned+' atribuída'+(assigned===1?'':'s'):'Nenhuma atividade',
   hint:reviewed?'Revisar respostas':'Ver exercícios e DISC/ACER'}
 ];
 return `<section class="rt-v93-summary rt-v915-journey" aria-labelledby="rt-v93-summary-title">
 <div class="rt-v93-summary-head"><div><h2 id="rt-v93-summary-title">Jornada do processo</h2><p>Os quatro pontos de acompanhamento usam os mesmos registros de cada aba.</p></div><span>Não representa evolução psicológica</span></div>
 <nav class="rt-v93-summary-grid" aria-label="Áreas da jornada de desenvolvimento">
 ${steps.map((step,index)=>`<a href="${wsUrl(id,step.tab,pid)}" data-v915-step="${step.id}" data-attention="${step.attention?'true':'false'}" class="rt-v93-summary-item">
 <span class="rt-v915-step-label"><span class="rt-v915-step-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span>${esc(step.name)}</span>
 <strong>${esc(step.value)}</strong><small>${esc(step.hint)} <span aria-hidden="true">→</span></small></a>`).join('')}
 </nav></section>`;
}
// V9.4: hierarquia consistente por tarefa. Estado/filtros vêm sempre dos registros originais.
function ws94Query(){
 const raw=decodeURIComponent(location.hash.slice(1));
 return new URLSearchParams(raw.includes('&')?raw.slice(raw.indexOf('&')+1):'');
}
function ws94TabIntro(id,pid,chosen,subtitle,stats,action=''){
 return `<header class="rt-v94-tab-head"><div class="rt-v94-tab-copy"><span class="rt-v94-eyebrow">ACOMPANHAMENTO DO PROCESSO</span><h2>${esc(WSTABS.find(x=>x[0]===chosen)?.[1]||chosen)}</h2><p>${esc(subtitle)}</p></div>${action?`<div class="rt-v94-tab-actions">${action}</div>`:''}</header>
 ${stats?.length?`<div class="rt-v94-stats" aria-label="Resumo desta área">${stats.map(x=>x.tab?`<a class="rt-v94-stat" href="${wsUrl(id,x.tab,pid,x.extra||'')}"><small>${esc(x.label)}</small><strong>${esc(x.value)}</strong><span>${esc(x.hint||'Ver detalhes')} →</span></a>`:`<div class="rt-v94-stat"><small>${esc(x.label)}</small><strong>${esc(x.value)}</strong><span>${esc(x.hint||'Neste processo')}</span></div>`).join('')}</div>`:''}`;
}
function ws94Panel(title,content,subtitle='',action='',extra=''){
 return `<section class="rt-v94-panel ${extra}" aria-label="${esc(title)}"><div class="rt-v94-panel-header"><div><h3>${esc(title)}</h3>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div>${action?`<div class="rt-v94-panel-action">${action}</div>`:''}</div><div class="rt-v94-panel-body">${content}</div></section>`;
}
function ws94Row(title,detail,meta='',action='',tone=''){
 return `<div class="rt-v94-row ${tone}"><div class="rt-v94-row-copy"><strong>${esc(title)}</strong>${detail?`<p>${esc(detail)}</p>`:''}${meta?`<small>${esc(meta)}</small>`:''}</div>${action?`<div class="rt-v94-row-action">${action}</div>`:''}</div>`;
}
function ws94Filters(id,pid,tab,items,active,extra=''){
 return `<nav class="rt-v94-filters" aria-label="Filtrar ${esc(WSTABS.find(x=>x[0]===tab)?.[1]||tab)}">${items.map(([key,label,count])=>`<a href="${wsUrl(id,tab,pid,'view='+encodeURIComponent(key)+(extra?'&'+extra:''))}" ${active===key?'aria-current="true"':''} class="rt-v94-chip ${active===key?'selected':''}">${esc(label)} <span>${count}</span></a>`).join('')}</nav>`;
}
function ws94SelectedSession(s,id,pid){
 if(!s)return ws94Panel('Selecione um encontro','<p class="rt-v910-muted">Abra um encontro para preparar e acompanhar seus acordos.</p>');
 const canClose=s.status==='agendada';
 const tied=db.actions.filter(a=>a.programId===pid&&a.sessionId===s.id);
 const previous=db.actions.filter(a=>a.programId===pid&&a.status==='pendente'&&a.sessionId!==s.id&&(!a.sessionId||db.sessions.some(prev=>prev.id===a.sessionId&&((prev.date||'')+'T'+(prev.time||'00:00'))<=(s.date+'T'+s.time))));
 const details=`<dl class="rt-v94-facts"><div><dt>Quando</dt><dd>${dateFmt(s.date)} · ${esc(s.time)}</dd></div><div><dt>Situação</dt><dd>${isElapsedAppointment(s)?'Sem confirmação':esc(s.status)}</dd></div><div><dt>Agenda visível na Minha Jornada</dt><dd>${s.visibility==='compartilhado'?'Sim':'Não'}</dd></div></dl>`;
 const privateNotes=`<div class="rt-v94-private"><strong>Pauta interna</strong><p>${esc(s.focus||'Pauta ainda não registrada')}</p>${s.summary?`<strong>Síntese interna</strong><p>${esc(s.summary)}</p>`:''}<small>A pauta e a síntese internas não são enviadas ao participante.</small></div>`;
 const recaps=`<div class="rt-v910-recap"><div class="rt-v910-between"><strong>Resumo para Minha Jornada</strong><span class="rt-v910-state">${s.clientRecap&&s.recapVisibility==='compartilhado'?'Compartilhado':'Restrito'}</span></div>${s.clientRecap?`<p>${esc(s.clientRecap)}</p>`:'<p>Prepare um resumo simples dos acordos quando o encontro for concluído.</p>'}${s.status==='concluida'?btn('Editar resumo e compartilhamento','edit-session-recap',s.id,'btn-secondary'):''}${s.visibility==='privado'?'<small>Encontro interno: o resumo não pode ser compartilhado enquanto a agenda estiver restrita.</small>':''}</div>`;
 const commitments=`<div class="rt-v910-commitments"><div class="rt-v910-between"><strong>Compromissos deste encontro</strong>${btn('+ Novo acordo','new-session-action',s.id,'btn-secondary')}</div>${tied.length?tied.map(a=>`<div class="rt-v910-agreement"><span class="rt-v910-dot ${a.status==='concluido'?'done':''}" aria-hidden="true"></span><div><strong>${esc(a.title)}</strong><small>${a.due?'Prazo: '+dateFmt(a.due):'Sem prazo'} · ${a.status==='concluido'?'Registrado':'Em aberto'} · ${a.visibility==='compartilhado'?'Compartilhado':'Restrito'}</small>${a.experience?`<p>${esc(a.experience.outcome==='tentada'?'Tentou e encontrou dificuldades':'Realizou')}${a.experience.note?' — '+esc(a.experience.note):''}</p>`:''}</div></div>`).join(''):'<p class="rt-v910-muted">Nenhum acordo registrado para este encontro.</p>'}</div>`;
 const carry=`<div class="rt-v910-carry"><strong>Para retomar neste encontro</strong>${previous.length?previous.slice(0,5).map(a=>`<div class="rt-v910-carry-row"><span class="rt-v910-dot" aria-hidden="true"></span><div><strong>${esc(a.title)}</strong><small>${a.due?'Até '+dateFmt(a.due):'Sem prazo'} · Aguardando retorno</small></div></div>`).join(''):'<p class="rt-v910-muted">Sem compromissos anteriores em aberto.</p>'}<small>Registros do mesmo processo. Ações continuam ligadas ao plano e não são duplicadas.</small></div>`;
 return ws94Panel('Detalhes do encontro',details+`<div class="rt-v911-shortcut rt-v913-session-shortcuts"><a class="btn-secondary" href="${rt96Href('kit','session='+encodeURIComponent(s.id))}">Preparar com GROW →</a><a class="btn-secondary" href="${rt96Href('perguntas','session='+encodeURIComponent(s.id))}">Banco de perguntas →</a><a class="btn-secondary" href="${rt96Href('temporizador','session='+encodeURIComponent(s.id))}">Temporizador →</a></div>`+privateNotes+(canClose?`<div class="rt-v94-inline-actions">${btn('Concluir encontro','close-session',s.id,'btn-primary')}</div>`:'')+commitments+recaps+carry,'Preparação, acordos e continuidade no mesmo processo.','','rt-v94-detail rt-v910-session-detail');
}

function showClientWorkspace(id,tab='geral',programId='',sessionId=''){
 const c=client(id);if(!c)return showClients();let ps=db.programs.filter(p=>p.clientId===id);
 const p=ps.find(x=>x.id===programId)||ps.find(x=>x.status==='em andamento')||ps[0]||null;
 const pid=p?.id||'';const chosen=WSTABS.some(x=>x[0]===tab)?tab:'geral';
 const sessions=db.sessions.filter(x=>x.programId===pid).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 const actions=db.actions.filter(x=>x.programId===pid);
 const tasks=db.discAssignments.filter(x=>x.programId===pid);
 const instruments=db.instruments.filter(x=>x.programId===pid);
 const guidance=db.guidance.filter(x=>x.programId===pid);
 const links=db.discLinks.filter(x=>x.programId===pid);
 const feedbacks=tasks.filter(x=>x.feedback).map(x=>({title:'Devolutiva DISC/ACER',text:x.feedback,visible:x.feedbackVisibility==='compartilhado'})).concat(instruments.filter(x=>x.feedback).map(x=>({title:x.title,text:x.feedback,visible:x.feedbackVisibility==='compartilhado'})));
 const procPick=ps.length>1?`<div class="rt-v9-proc-switch"><label for="ws-process-select">Processo</label><select id="ws-process-select" data-client-id="${esc(id)}" data-tab="${chosen}">${ps.map(x=>`<option value="${esc(x.id)}" ${x.id===pid?'selected':''}>${esc(x.goal)} (${esc(x.status)})</option>`).join('')}</select></div>`:p?`<span class="rt-v9-process-label">Processo: <b>${esc(p.goal)}</b></span>`:'';
 const tabs=`<nav class="rt-v9-workspace-tabs" aria-label="Áreas do cliente">${WSTABS.map(([key,label])=>`<a href="${wsUrl(id,key,pid)}" class="${key===chosen?'selected':''}" ${key===chosen?'aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
 const activeTitle=p?.goal||'Nenhum processo iniciado';
 const title=`<div class="rt-v92-back"><a href="#clientes">← Clientes</a><span>/</span> Acompanhamento individual</div><header class="rt-v92-profile-head rt-v93-profile-head"><div class="rt-v92-profile-main"><span class="rt-v92-avatar">${esc(c.name.slice(0,2).toUpperCase())}</span><div class="rt-v93-profile-ident"><h1>${esc(c.name)}</h1><div class="rt-v92-profile-tags">${status(clientStatusLabel(c.status||'ativo'))}<span>${esc(c.contact||'Modalidade não definida')}</span></div></div></div><div class="rt-v92-profile-actions rt-v93-profile-actions">${chosen==='geral'?(p?btn('Agendar sessão','new-session-for',pid,'btn-primary'):btn('Criar processo','new-process-for',id,'btn-primary')):''}<details class="rt-v93-action-menu"><summary aria-label="Outras ações do cliente">Mais ações <span aria-hidden="true">⌄</span></summary><div class="rt-v93-menu-options">${btn('Editar cadastro','edit-client',id,'line-button')}${btn('Novo processo','new-process-for',id,'line-button')}${p?btn('Nova atividade','new-instrument-for',pid,'line-button'):''}</div></details></div><div class="rt-v93-process-context"><div class="rt-v93-context-meta"><span>PROCESSO ATUAL</span><small>${p?'Etapa: '+esc(p.stage):'Sem processo ativo'}</small></div><div class="rt-v93-process-choice">${ps.length>1?`<label class="sr-only" for="ws-process-select">Processo atual</label><select id="ws-process-select" data-client-id="${esc(id)}" data-tab="${chosen}">${ps.map(x=>`<option value="${esc(x.id)}" ${x.id===pid?'selected':''}>${esc(x.goal)} (${esc(x.status)})</option>`).join('')}</select>`:`<strong>${esc(activeTitle)}</strong>`}</div>${p?btn('Atualizar etapa','edit-stage',pid,'rt-v93-text-button'):''}</div></header>`;
 const actionsTop='';
 let body='';
 if(!p){body=cardList('Nenhum processo vinculado',empty('Comece pelo processo de desenvolvimento','Defina um objetivo antes de atribuir sessões e atividades.'),btn('+ Criar processo','new-process-for',id,'btn-primary'));}
 else if(chosen==='geral'){
  const open=actions.filter(a=>a.status==='pendente').sort((a,b)=>String(a.due||'9999').localeCompare(String(b.due||'9999')));
  body=`${v93Priority(id,pid)}${v93Summary(id,pid,sessions,actions,tasks,instruments,p)}
  <div class="rt-v93-overview-layout"><div class="rt-v93-history">${showTimeline(id,pid)}</div><aside class="rt-v93-context-column" aria-label="Contexto do processo"><section class="rt-v93-aside-card rt-v915-goals" aria-label="Objetivos deste processo"><div class="rt-v93-aside-head"><h2>Objetivos acordados</h2><a href="${wsUrl(id,'desenvolvimento',pid)}">Gerenciar →</a></div>
 ${RTDemoStore.goalsOf(db,pid).length?`<ul class="rt-v915-goals-list">${RTDemoStore.goalsOf(db,pid).slice(0,3).map(g=>`<li><strong>${esc(g.title)}</strong><small>${actions.filter(a=>a.goalId===g.id).length} ação(ões) vinculada(s)</small></li>`).join('')}</ul>${RTDemoStore.goalsOf(db,pid).length>3?`<p class="rt-v915-goals-more">+${RTDemoStore.goalsOf(db,pid).length-3} objetivo(s) em Desenvolvimento</p>`:''}`:empty('Nenhum objetivo específico','Defina objetivos na aba Desenvolvimento.')}
 </section>
  <section class="rt-v93-aside-card"><div class="rt-v93-aside-head"><h2>Ações combinadas</h2><a href="${wsUrl(id,'desenvolvimento',pid)}">Ver todas</a></div>${open.length?`<ul class="rt-v93-action-list">${open.slice(0,3).map(a=>`<li><span>${esc(a.title)}</span><small>${a.due?'Até '+dateFmt(a.due):'Sem prazo definido'}</small></li>`).join('')}</ul>`:`<p>Sem ações pendentes neste processo.</p>`}</section>
  <details class="rt-v93-aside-card rt-v93-process-details"><summary>Detalhes e situação do processo <span aria-hidden="true">⌄</span></summary><dl><div><dt>Etapa</dt><dd>${esc(p.stage)}</dd></div><div><dt>Situação</dt><dd>${esc(p.status)}</dd></div><div><dt>Ações concluídas</dt><dd>${actions.filter(a=>a.status==='concluido').length} de ${actions.length}</dd></div></dl>${btn(p.status==='finalizado'?'Reabrir processo':'Finalizar processo',p.status==='finalizado'?'reopen-process':'finish-process',pid,'line-button')}</details></aside></div>`;
 }
 else if(chosen==='sessoes'){
  const next=sessions.filter(x=>x.status==='agendada'&&!isElapsedAppointment(x));
  const pending=sessions.filter(x=>isElapsedAppointment(x));
  const completed=sessions.filter(x=>x.status==='concluida');
  const focused=sessions.find(x=>x.id===sessionId);
  const selectedView=ws94Query().get('view')||'proximos';
  const view=['proximos','historico','todos'].includes(selectedView)?selectedView:'proximos';
  const shown=view==='historico'?sessions.filter(x=>x.status==='concluida'):view==='todos'?sessions:sessions.filter(x=>x.status==='agendada');
  const ordered=shown.slice().sort((a,b)=>((a.date+a.time).localeCompare(b.date+b.time))*(view==='historico'?-1:1));
  const nextSession=next.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0];
  const primary=focused||pending[0]||nextSession;
  if(focused){
   body=RTSessionWorkspace.render(db,focused,{esc,dateFmt,wsUrl,btn,today,moment:ws94Query().get('moment'),filter:ws94Query().get('phase')});
  }else{
  body=ws94TabIntro(id,pid,chosen,'Escolha um encontro para preparar, conduzir e acompanhar em uma única tela.',[
   {label:'Próximo encontro',value:nextSession?dateFmt(nextSession.date):'Não agendado',hint:nextSession?nextSession.time:'Agendar novo'},
   {label:'Sem confirmação',value:pending.length,hint:'Horário transcorrido'},
   {label:'Realizados',value:completed.length,hint:'Histórico deste processo'}],btn('+ Agendar sessão','new-session-for',pid,'btn-primary'))+
  (pending.length?`<div class="rt-v94-attention" role="status"><div><strong>${pending.length===1?'Encontro aguardando confirmação':pending.length+' encontros aguardando confirmação'}</strong><p>O horário passou, mas a sessão não foi marcada como concluída.</p></div><a href="${wsUrl(id,'sessoes',pid,'session='+encodeURIComponent(pending[0].id))}" class="btn-secondary">Verificar situação</a></div>`:'')+
  `<div class="rt-v94-layout"><div class="rt-v94-main">${ws94Filters(id,pid,chosen,[['proximos','Agendados',sessions.filter(x=>x.status==='agendada').length],['historico','Realizados',completed.length],['todos','Todos',sessions.length]],view)}`+
  ws94Panel(view==='historico'?'Histórico de encontros':view==='todos'?'Todos os encontros':'Encontros agendados',ordered.map(s=>ws94Row(s.clientTopic||'Sessão de acompanhamento',`${dateFmt(s.date)} · ${s.time}`,isElapsedAppointment(s)?'Aguardando confirmação':s.status==='concluida'?'Realizada':s.status,`<a class="btn-secondary" href="${wsUrl(id,'sessoes',pid,'session='+encodeURIComponent(s.id))}">Detalhes</a>`,focused?.id===s.id?'selected':'')).join('')||empty(view==='historico'?'Nenhuma sessão realizada':'Nenhuma sessão neste filtro','Agende um encontro ou altere o filtro.'),'Cada registro mantém sua pauta e situação.')+'</div>'+
  `<aside class="rt-v94-aside">${ws94SelectedSession(primary,id,pid)}${ws94Panel('Acompanhamento após a sessão',`<p class="rt-v94-aside-copy">Cada encontro pode gerar compromissos vinculados ao objetivo, exibidos no Plano de ação e, quando compartilhados, na Minha Jornada.</p><a class="rt-v94-text-link" href="${wsUrl(id,'desenvolvimento',pid)}">Ver ações combinadas →</a>`,'Continuidade do trabalho.')}</aside></div>`;
  }
 }
 else if(chosen==='atividades'){
  const review=instruments.filter(x=>x.responses&&!x.feedback);
  const discReview=tasks.filter(t=>t.status==='respondido'&&!t.feedback);
  const pendingInstruments=instruments.filter(x=>!x.responses);
  const pendingDisc=tasks.filter(x=>x.status!=='respondido');
  const viewRaw=ws94Query().get('view')||'acompanhar';
  const view=['acompanhar','respondidas','todas'].includes(viewRaw)?viewRaw:'acompanhar';
  const activeDisc=tasks.filter(t=>view==='respondidas'?t.status==='respondido':view==='acompanhar'?t.status!=='respondido'||!t.feedback:true);
  const activeInstruments=instruments.filter(t=>view==='respondidas'?Boolean(t.responses):view==='acompanhar'?!t.responses||!t.feedback:true);
  body=ws94TabIntro(id,pid,chosen,'Acompanhe o que foi enviado, as respostas recebidas e o que precisa ser revisado.',[
   {label:'Para revisar',value:review.length+discReview.length,hint:'Respostas sem devolutiva'},
   {label:'Aguardando resposta',value:pendingInstruments.length+pendingDisc.length,hint:'Instrumentos e exercícios'},
   {label:'Total atribuído',value:instruments.length+tasks.length,hint:'Neste processo'}],btn('+ Atribuir exercício','new-instrument-for',pid,'btn-primary'))+
  (review.length+discReview.length?`<div class="rt-v94-attention"><div><strong>Respostas aguardando análise</strong><p>${review.length+discReview.length} atividade(s) pronta(s) para sua revisão profissional.</p></div><a class="btn-secondary" href="${wsUrl(id,'atividades',pid,'view=respondidas')}">Ver respostas</a></div>`:'')+
  ws94Filters(id,pid,chosen,[['acompanhar','Em acompanhamento',pendingInstruments.length+pendingDisc.length+review.length+discReview.length],['respondidas','Respondidas',instruments.filter(x=>x.responses).length+tasks.filter(x=>x.status==='respondido').length],['todas','Todas',tasks.length+instruments.length]],view)+
  `<div class="rt-v94-layout"><div class="rt-v94-main">`+
  ws94Panel('Exercícios e reflexões',activeInstruments.length?activeInstruments.map(t=>`<article class="rt-v94-resource" data-v917-instrument="${esc(t.id)}"><div class="rt-v94-row"><div class="rt-v94-row-copy"><strong>${esc(t.title)}</strong><p>${t.responses?'Resposta recebida':'Aguardando resposta'} · ${t.visibility==='compartilhado'?'Visível na Minha Jornada':'Interna'}</p><p class="rt-v917-goal-ref">Objetivo: ${esc(RTDemoStore.goalsOf(db,pid).find(g=>g.id===t.goalId)?.title||'Objetivo do processo')}</p>${t.feedback?`<small>Devolutiva ${t.feedbackVisibility==='compartilhado'?'compartilhada':'restrita'}</small>`:t.responses?'<small>Aguardando análise profissional</small>':''}</div><div class="rt-v94-row-action">${t.responses?btn('Revisar','review-instrument',t.id,'btn-secondary'):btn(t.visibility==='compartilhado'?'Restringir':'Disponibilizar','toggle-instrument',t.id,'btn-secondary')}</div></div>${t.responses?`<details class="rt-v94-answer"><summary>Ler resposta do exercício</summary>${['Situação observada','Minha reação','Próxima prática'].map((q,j)=>`<p><b>${q}:</b> ${esc(t.responses[j])}</p>`).join('')}</details>`:''}</article>`).join(''):empty('Nenhum exercício neste filtro','Atribua um exercício ou ajuste o filtro.'),'Atividades educativas vinculadas ao processo.')+
  ws94Panel('DISC/ACER',activeDisc.map(t=>ws94Row('Mapeamento DISC/ACER',t.status==='respondido'?'Questionário concluído':t.status==='cancelado'?'Aplicação cancelada':t.startedAt?'Em andamento':'Aguardando resposta',t.visibility==='compartilhado'?'Disponível no portal':'Rascunho interno',t.status==='respondido'?`<a class="btn-secondary" href="${wsUrl(id,'resultados',pid)}">Ver gráficos</a>`:t.status==='cancelado'?'<span class="rt-v94-state">Aplicação encerrada</span>':btn(t.visibility==='compartilhado'?'Restringir':'Disponibilizar','toggle-disc',t.id,'btn-secondary'))).join('')||empty('Nenhum DISC/ACER neste filtro','Atribua um mapeamento ou altere o filtro.'),'As respostas são analisadas no ambiente profissional.',btn('+ Atribuir DISC','new-disc',pid,'btn-secondary'))+'</div>'+
  `<aside class="rt-v94-aside">${ws94Panel('Como funciona',`<ol class="rt-v94-steps"><li>O profissional atribui a atividade.</li><li>O cliente responde na Minha Jornada.</li><li>O profissional revisa e decide compartilhar a devolutiva.</li></ol><p class="rt-v94-aside-copy">Gráficos e escores DISC/ACER ficam na área profissional.</p>`,'Fluxo de acompanhamento.')} ${ws94Panel('Materiais de apoio',`<a class="rt-v94-text-link" href="#biblioteca">Explorar Biblioteca →</a>`,'Exercícios e Communication Lab.')}</aside></div>`;
 }
 else if(chosen==='resultados'){
  const completed=tasks.filter(t=>t.status==='respondido'&&t.scores).slice().reverse();
  const review=completed.filter(t=>!t.feedback);
  const ready=completed.filter(t=>t.feedback&&t.feedbackVisibility==='compartilhado');
  body=ws94TabIntro(id,pid,chosen,'Consulte os resultados, revise as respostas e controle as devolutivas disponibilizadas.',[
   {label:'Resultados DISC/ACER',value:completed.length,hint:'Respostas concluídas'},
   {label:'Aguardam análise',value:review.length,hint:'Devolutiva pendente'},
   {label:'Devolutivas liberadas',value:ready.length,hint:'Compartilhadas explicitamente'}],`<a class="btn-secondary" href="${wsUrl(id,'atividades',pid)}">Ver atribuições</a>`)+
  (review.length?`<div class="rt-v94-attention"><div><strong>${review.length} resultado(s) aguardando análise</strong><p>Revise os dados antes de preparar qualquer devolutiva.</p></div><a class="btn-secondary" href="#rt-v94-results">Analisar</a></div>`:'')+
  `<div class="rt-v94-layout"><div class="rt-v94-main"><div id="rt-v94-results">${ws94Panel('Resultados do DISC/ACER',completed.map((t,i)=>`<article class="rt-v94-result"><div class="rt-v94-result-top"><div><strong>Aplicação ${completed.length-i}</strong><p>${t.completedAt?new Date(t.completedAt).toLocaleDateString('pt-BR'):'Data não informada'} · Somente profissional</p></div><span class="rt-v94-state">${t.feedback?'Devolutiva registrada':'Aguardando devolutiva'}</span></div><div class="rt-v81-analysis"><div class="rt-v81-bars">${['D','I','S','C'].map(k=>`<div class="rt-v81-factor"><div><strong>${k} · ${discNames[k]}</strong><span>${Number(t.scores[k])||0} de 20</span></div><div class="rt-v81-track"><span style="width:${Math.max(0,Math.min(100,(Number(t.scores[k])||0)*5))}%"></span></div></div>`).join('')}</div>${discRadar(t.scores)}</div><div class="rt-v94-feedback"><div><strong>Devolutiva profissional</strong><p>${esc(t.feedback||'Nenhuma devolutiva registrada.')}</p><small>${t.feedbackVisibility==='compartilhado'?'Compartilhada com o cliente':'Restrita ao profissional'}</small></div><div class="rt-v94-inline-actions">${btn(t.feedback?'Editar':'Redigir','disc-feedback',t.id,'btn-secondary')}${t.feedback?btn(t.feedbackVisibility==='compartilhado'?'Restringir':'Compartilhar','toggle-disc-feedback',t.id,'line-button'):''}</div></div></article>`).join('')||empty('Nenhum resultado disponível','O participante precisa concluir o DISC/ACER na Minha Jornada.'),'Gráficos didáticos das respostas; não representam diagnóstico ou teste psicológico validado.')}</div>`+
  `<details class="rt-v94-secondary"><summary>Resultados históricos associados (${links.length})</summary>${links.map(l=>ws94Row('Mapeamento vinculado',`D ${l.scores.D} · I ${l.scores.I} · S ${l.scores.S} · C ${l.scores.C}`,'Associado manualmente',btn('Desvincular','unlink-disc',l.id))).join('')||empty('Sem histórico associado','Resultados do acervo não são migrados automaticamente.')}</details>`+
  `<details class="rt-v94-secondary"><summary>Acervo original de gráficos e relatórios</summary><p class="rt-v94-aside-copy">Dados legados não são associados automaticamente ao cliente. Utilize somente dados fictícios.</p>${linkableHistory()}${linkedResults()}${moduleFrame('disc','../disc-engine.html?rtEmbed=1&rtView=relatorio','Acervo DISC/ACER').replace('loading="eager"','loading="lazy"')}</details></div>`+
  `<aside class="rt-v94-aside">${ws94Panel('Critérios de compartilhamento',`<p class="rt-v94-aside-copy">Resultados permanecem no Professional. Somente uma devolutiva explicitamente liberada aparece na Minha Jornada.</p><a class="rt-v94-text-link" href="${wsUrl(id,'documentos',pid)}">Conferir documentos →</a>`,'Privacidade por padrão.')}${ws94Panel('Contexto do processo',`<p class="rt-v94-aside-copy">${esc(p.goal)}</p><a class="rt-v94-text-link" href="${wsUrl(id,'desenvolvimento',pid)}">Ver plano de desenvolvimento →</a>`,'Objetivo acordado.')}</aside></div>`;
 }
 else if(chosen==='desenvolvimento'){
  const goals=RTDemoStore.goalsOf(db,pid);
  const requestedGoal=ws94Query().get('goal')||'todos';
  const goalFilter=goals.some(g=>g.id===requestedGoal)?requestedGoal:'todos';
  const scope=goalFilter==='todos'?actions:actions.filter(a=>a.goalId===goalFilter);
  const selectedGoal=goals.find(g=>g.id===goalFilter);
  const completed=scope.filter(a=>a.status==='concluido');
  const open=scope.filter(a=>a.status!=='concluido').sort((a,b)=>String(a.due||'9999').localeCompare(String(b.due||'9999')));
  const late=open.filter(a=>a.due&&a.due<today());
  const viewRaw=ws94Query().get('view')||'pendentes';
  const view=['pendentes','concluidas','todas'].includes(viewRaw)?viewRaw:'pendentes';
  const filtered=view==='pendentes'?open:view==='concluidas'?completed:scope;
  const upcoming=sessions.filter(s=>s.status==='agendada'&&!isElapsedAppointment(s)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0];
  const sessionAgreements=actions.filter(a=>a.status==='pendente'&&a.sessionId&&sessions.some(s=>s.id===a.sessionId));
  const writable=p.status!=='finalizado';
  body=ws94TabIntro(id,pid,chosen,'Objetivos acordados, compromissos e continuidade entre atendimentos.',[
   {label:'Etapa atual',value:p.stage,hint:'Situação do processo'},
   {label:'Ações pendentes',value:open.length,hint:late.length?late.length+' com prazo vencido':'Sem atrasos'},
   {label:'Ações concluídas',value:completed.length,hint:'De '+scope.length+' compromissos'+(selectedGoal?' neste objetivo':'')}],writable?btn('+ Nova ação','new-action-for',pid,'btn-primary'):'')+
  (late.length?`<div class="rt-v94-attention"><div><strong>${late.length} ação(ões) com prazo vencido</strong><p>Confirme a situação com o participante. O atraso não é uma avaliação de desenvolvimento.</p></div><a class="btn-secondary" href="${wsUrl(id,'desenvolvimento',pid,'view=pendentes'+(selectedGoal?'&goal='+encodeURIComponent(goalFilter):''))}">Acompanhar</a></div>`:'')+
  `<div class="rt-v94-goal"><div><small>OBJETIVO DO PROCESSO</small><h3>${esc(p.goal)}</h3><p>${esc(p.stage)} · Início em ${dateFmt(p.start)}</p></div>${btn('Atualizar etapa','edit-stage',pid,'btn-secondary')}</div>`+
  `<section class="rt-v912-shortcuts"><div><strong>Ferramentas para este processo</strong><small>Organize reflexões e planos a partir deste cliente.</small></div><a class="btn-secondary" href="${rt96Href('roda','program='+encodeURIComponent(pid))}">Roda da Vida →</a><a class="btn-secondary" href="${rt96Href('5w2h','program='+encodeURIComponent(pid))}">Matriz 5W2H →</a></section>`+
  `<section class="rt99-goals rt-v916-goals" aria-label="Objetivos do processo"><div class="rt99-goals-head"><div><h3>Objetivos acordados</h3><p>Consulte compromissos vinculados a cada objetivo sem criar outro plano.</p></div>${writable?btn('+ Objetivo','new-goal',pid,'btn-secondary'):''}</div>
  <div class="rt99-goal-grid">${goals.map(g=>{const related=actions.filter(a=>a.goalId===g.id),pend=related.filter(a=>a.status!=='concluido').length;return `<article class="rt99-goal-item rt-v916-goal-item" data-v916-goal="${esc(g.id)}"><strong>${esc(g.title)}</strong><small>${pend} pendente(s) · ${related.length-pend} concluída(s)</small><div class="rt-v916-goal-actions"><a href="${wsUrl(id,'desenvolvimento',pid,'view=todas&goal='+encodeURIComponent(g.id))}" class="btn-secondary">Ver ações</a>${writable?btn('Editar objetivo','edit-goal',g.id,'line-button')+btn('+ Ação','new-action-goal',g.id,'line-button'):''}</div></article>`;}).join('')||empty('Nenhum objetivo específico','Adicione um objetivo e vincule compromissos.')}</div></section>`+
  ((upcoming||sessionAgreements.length)?`<section class="rt-v916-continuity" aria-label="Continuidade entre sessões"><div><h3>Continuidade entre encontros</h3><p>${sessionAgreements.length} compromisso(s) originado(s) em sessões ainda pendente(s)${upcoming?' · Próximo atendimento: '+dateFmt(upcoming.date)+' às '+esc(upcoming.time):' · Sem sessão futura'}</p></div><div class="rt-v916-continuity-actions">${upcoming?`<a class="btn-secondary" href="${wsUrl(id,'sessoes',pid,'session='+encodeURIComponent(upcoming.id))}">Preparar atendimento →</a>`:writable?btn('Agendar sessão','new-session-for',pid,'btn-secondary'):''}<a href="${wsUrl(id,'sessoes',pid)}" class="rt-v94-text-link">Ver sessões →</a></div></section>`:'')+
  `<div class="rt-v94-layout"><div class="rt-v94-main"><div class="rt-v916-filter-header"><label for="rt-v916-goal-filter">Objetivo <select id="rt-v916-goal-filter" data-client-id="${esc(id)}" data-program-id="${esc(pid)}" data-view="${esc(view)}" aria-label="Filtrar compromissos por objetivo"><option value="todos">Todos os objetivos</option>${goals.map(g=>`<option value="${esc(g.id)}" ${goalFilter===g.id?'selected':''}>${esc(g.title)}</option>`).join('')}</select></label>${selectedGoal?`<a href="${wsUrl(id,'desenvolvimento',pid,'view='+encodeURIComponent(view))}" class="rt-v916-clear">Limpar filtro</a>`:''}</div>
${ws94Filters(id,pid,chosen,[['pendentes','Pendentes',open.length],['concluidas','Concluídas',completed.length],['todas','Todas',scope.length]],view,selectedGoal?'goal='+encodeURIComponent(goalFilter):'')}`+
  ws94Panel('Ações combinadas',filtered.map(a=>{
    const source=sessions.find(s=>s.id===a.sessionId);
    const controls=btn('Editar','edit-action',a.id,'line-button')+btn(a.status==='concluido'?'Reabrir':'Concluir','toggle-action',a.id,'btn-secondary')+(source?`<a class="rt-v916-source" href="${wsUrl(id,'sessoes',pid,'session='+encodeURIComponent(source.id))}">Abrir sessão de origem →</a>`:'');
    return ws94Row(a.title,a.due?'Até '+dateFmt(a.due):'Sem prazo definido',
    `${a.status==='concluido'?'Concluída':a.due&&a.due<today()?'Prazo vencido':'Pendente'} · ${a.visibility==='compartilhado'?'Compartilhada':'Restrita'} · Objetivo: ${goals.find(g=>g.id===a.goalId)?.title||'Não relacionado'}${source?' · Combinada na sessão '+dateFmt(source.date):''}`,controls);
  }).join('')||empty('Nenhuma ação neste filtro','Altere o filtro ou selecione outro objetivo.'),'Conclusão indica execução do compromisso, não evolução psicológica.')+
  `<details class="rt-v94-secondary"><summary>Ferramentas originais de Plano de Ação DISC/ACER</summary>${moduleFrame('disc','../disc-engine.html?rtEmbed=1&rtView=plano','Plano de Ação DISC/ACER').replace('loading="eager"','loading="lazy"')}</details></div>`+
  `<aside class="rt-v94-aside">${ws94Panel('Orientações ao participante',guidance.map(g=>`<div class="rt-v94-note"><p>${esc(g.text)}</p><small>${dateFmt(g.created)} · ${g.visibility==='compartilhado'?'Compartilhada':'Interna'}</small></div>`).join('')||empty('Sem orientações','Adicione uma orientação pertinente ao processo.'),'Mensagens disponíveis na Minha Jornada quando compartilhadas.',btn('+ Orientação','new-guidance',pid,'btn-secondary'))}${ws94Panel('Materiais complementares',`<a class="rt-v94-text-link" href="#biblioteca">Explorar Biblioteca e Communication Lab →</a>`,'Recursos para o desenvolvimento.')}</aside></div>`;
 }
 else if(chosen==='documentos'){
  const reflections=RTDemoStore.publicReflections(db,id);
  const released=feedbacks.filter(x=>x.visible),privateDocs=feedbacks.filter(x=>!x.visible);
  const viewRaw=ws94Query().get('view')||'todos';
  const view=['todos','compartilhados','restritos'].includes(viewRaw)?viewRaw:'todos';
  const shown=view==='compartilhados'?released:view==='restritos'?privateDocs:feedbacks;
  body=ws94TabIntro(id,pid,chosen,'Confira devolutivas, materiais disponibilizados e reflexões compartilhadas pelo participante.',[
   {label:'Devolutivas',value:feedbacks.length,hint:'Neste processo'},
   {label:'Compartilhadas',value:released.length,hint:'Disponíveis na Jornada'},
   {label:'Reflexões recebidas',value:reflections.length,hint:'Compartilhadas pelo cliente'}],`<a class="btn-secondary" href="${wsUrl(id,'resultados',pid)}">Preparar devolutiva</a>`)+
  `<div class="rt-v94-layout"><div class="rt-v94-main">${ws94Filters(id,pid,chosen,[['todos','Todas',feedbacks.length],['compartilhados','Compartilhadas',released.length],['restritos','Restritas',privateDocs.length]],view)}`+
  ws94Panel('Devolutivas e registros',shown.map(x=>`<article class="rt-v94-note"><div class="rt-v94-note-head"><strong>${esc(x.title)}</strong><span class="rt-v94-state">${x.visible?'Compartilhada':'Restrita'}</span></div><p>${esc(x.text)}</p></article>`).join('')||empty('Nenhuma devolutiva neste filtro','Prepare uma devolutiva na aba Resultados ou Atividades.'),'A visibilidade é definida na origem, durante a revisão da resposta.')+
  ws94Panel('Reflexões disponibilizadas pelo participante',reflections.filter(r=>!r.programId||r.programId===pid).map(r=>`<article class="rt-v94-note"><strong>${esc(r.title||'Reflexão')}</strong><p>${esc(r.text)}</p><small>${dateFmt(r.created)} · ${esc(db.goals.find(g=>g.id===r.goalId)?.title||'Reflexão geral do processo')}</small></article>`).join('')||empty('Nenhuma reflexão compartilhada','Textos privados do participante não aparecem aqui.'),'Exibe apenas reflexões compartilhadas no portal.')+'</div>'+
  `<aside class="rt-v94-aside">${ws94Panel('O que o cliente pode ver?',`<p class="rt-v94-aside-copy">Somente devolutivas explicitamente compartilhadas e conteúdos disponibilizados no portal. Registros internos de sessão permanecem restritos.</p><a class="rt-v94-text-link" href="../cliente/index.html">Prévia da Minha Jornada →</a>`,'Resumo do compartilhamento.')}${ws94Panel('Limites desta versão',`<p class="rt-v94-aside-copy">O envio de arquivos e o armazenamento de documentos clínicos ainda não são suportados. Não existe upload simulado.</p>`,'Demonstração local.')}</aside></div>`;
 }
 return title+`<div class="rt-v9-workspace">${tabs}<section class="rt-v9-tab-content rt-v93-tab-content rt-v94-tab-content" aria-label="${WSTABS.find(x=>x[0]===chosen)?.[1]||'Visão geral'}">${body}</section></div>`;
}
function showGuidedActivities(){
 const guided=db.instruments.filter(i=>program(i.programId));
 const discs=db.discAssignments.filter(t=>program(t.programId));
 const canAssign=db.programs.some(p=>p.status!=='finalizado');
 return head('RECURSOS DO PROCESSO','Atividades guiadas','Atribua exercícios e o DISC/ACER, acompanhe respostas e revise devolutivas sem sair do Professional.',canAssign?btn('+ Nova atividade','new-instrument','','btn-primary'):'<a class="btn-primary" href="#processos">+ Criar processo</a>')+
 `<div class="rt-v91-overview"><div class="rt-v91-metric"><small>Reflexões atribuídas</small><strong>${guided.length}</strong></div><div class="rt-v91-metric"><small>Respostas para revisar</small><strong>${guided.filter(i=>i.responses&&!i.feedback).length+discs.filter(t=>t.status==='respondido'&&!t.feedback).length}</strong></div><div class="rt-v91-metric"><small>Mapeamentos DISC/ACER</small><strong>${discs.length}</strong></div></div>`+
 cardList('Exercícios e reflexões',guided.map(i=>{const p=program(i.programId);return `<div class="rt-v9-dash-row"><div class="item-main"><strong>${esc(i.title)}</strong><p>${esc(clientOf(p))} · ${i.responses?'Respondida':'Aguardando resposta'} · ${i.visibility==='compartilhado'?'Compartilhada':'Privada'}</p></div><div class="rt-v9-row-actions">${i.responses?btn('Revisar','review-instrument',i.id):btn(i.visibility==='compartilhado'?'Restringir':'Compartilhar','toggle-instrument',i.id)}${workspaceButton('Abrir',p.clientId,'atividades',p.id)}</div></div>`}).join('')||empty('Nenhuma reflexão atribuída','Use Nova atividade para criar um exercício em um processo.'),canAssign?btn('+ Atribuir reflexão','new-instrument','','btn-secondary'):'')+
 cardList('Questionários DISC/ACER',discs.map(t=>{const p=program(t.programId);return `<div class="rt-v9-dash-row"><div class="item-main"><strong>${esc(clientOf(p))}</strong><p>${esc(p.goal)} · ${t.status==='respondido'?'Respondido':'Pendente'} · ${t.visibility==='compartilhado'?'Disponibilizado':'Rascunho interno'}</p></div><div class="rt-v9-row-actions">${t.status==='respondido'?workspaceButton('Ver resultado',p.clientId,'resultados',p.id):btn(t.visibility==='compartilhado'?'Restringir':'Disponibilizar','toggle-disc',t.id)}${workspaceButton('Abrir',p.clientId,'atividades',p.id)}</div></div>`}).join('')||empty('Nenhum DISC/ACER atribuído','O questionário será realizado pelo cliente em Minha Jornada.'),canAssign?btn('+ Atribuir DISC/ACER','new-disc','','btn-secondary'):'')+
 `<p class="inline-note">Os resultados não são diagnósticos nem testes psicológicos validados. Devolutivas só são mostradas após compartilhamento explícito.</p>`;
}
function showDevelopmentPlans(){
 const ps=db.programs.slice().sort((a,b)=>b.start.localeCompare(a.start));
 return head('ACOMPANHAMENTO','Plano de desenvolvimento','Objetivos, ações e evolução de cada processo em um único painel.',db.programs.some(p=>p.status!=='finalizado')?btn('+ Nova ação','new-action','','btn-primary'):'<a class="btn-primary" href="#processos">+ Criar processo</a>')+
 `<div class="rt-v91-overview"><div class="rt-v91-metric"><small>Processos</small><strong>${ps.length}</strong></div><div class="rt-v91-metric"><small>Ações pendentes</small><strong>${db.actions.filter(a=>a.status==='pendente').length}</strong></div><div class="rt-v91-metric"><small>Ações concluídas</small><strong>${db.actions.filter(a=>a.status==='concluido').length}</strong></div></div>`+
 `<div class="rt-v91-cards">${ps.map(p=>{const aa=db.actions.filter(a=>a.programId===p.id);const done=aa.filter(a=>a.status==='concluido').length;const guided=db.instruments.filter(i=>i.programId===p.id),toReview=guided.filter(i=>i.responses&&!i.feedback).length;return `<section class="card rt-v91-process-card"><div class="card-head"><div><small class="eyebrow">${esc(clientOf(p))}</small><h2>${esc(p.goal)}</h2></div>${status(p.status)}</div><p class="muted">${esc(p.stage)} · ${done} de ${aa.length} compromissos executados · ${guided.length} atividade(s) guiada(s)${toReview?' · '+toReview+' para revisar':''}</p><div class="progress-track"><span style="width:${aa.length?100*done/aa.length:0}%"></span></div>${aa.slice(0,3).map(a=>`<div class="rt-v9-dash-row"><div class="item-main"><strong>${esc(a.title)}</strong><p>${a.status==='concluido'?'Concluída':'Prazo: '+dateFmt(a.due)}</p></div>${btn(a.status==='concluido'?'Reabrir':'Concluir','toggle-action',a.id)}</div>`).join('')||empty('Sem ações','Adicione uma ação ao plano deste processo.')}<div class="rt-v91-card-footer">${btn('+ Ação','new-action-for',p.id,'btn-secondary')}${workspaceButton('Abrir plano →',p.clientId,'desenvolvimento',p.id,'btn-primary')}${workspaceButton('Ver atividades →',p.clientId,'atividades',p.id,'btn-secondary')}</div></section>`}).join('')||empty('Nenhum plano disponível','Crie um processo de desenvolvimento para começar.')}</div>`;
}
function showAgenda(){
 const opts=[['proximos','Próximos'],['hoje','Hoje'],['sem-confirmacao','Sem confirmação'],['concluidas','Concluídas'],['todos','Todos']];
 const query=new URLSearchParams(location.hash.split('?')[1]||''),requested=query.get('filter')||'proximos';
 const filter=opts.some(([id])=>id===requested)?requested:'proximos';
 const all=db.sessions.filter(s=>program(s.programId)&&client(program(s.programId).clientId));
 const shown=all.filter(s=>filter==='hoje'?s.date===today():filter==='sem-confirmacao'?isElapsedAppointment(s):filter==='concluidas'?s.status==='concluida':filter==='proximos'?s.status==='agendada'&&!isElapsedAppointment(s):true)
  .sort((a,b)=>((a.date||'')+(a.time||'')).localeCompare((b.date||'')+(b.time||''))*(filter==='concluidas'?-1:1));
 const future=all.filter(s=>s.status==='agendada'&&!isElapsedAppointment(s)).length;
 const unconfirmed=all.filter(s=>isElapsedAppointment(s)).length;
 const finished=all.filter(s=>s.status==='concluida').length;
 const cards=shown.map(s=>{
  const p=program(s.programId),name=client(p.clientId)?.name||'Cliente';
  const href=wsUrl(p.clientId,'sessoes',p.id,'session='+encodeURIComponent(s.id));
  return '<article class="rt-v914-agenda-card"><div class="rt-v914-agenda-date"><strong>'+esc(day(s.date))+'</strong><span>'+esc(month(s.date))+'</span></div>'+
   '<div class="rt-v914-agenda-title"><span>'+(s.status==='concluida'?'Realizado':isElapsedAppointment(s)?'Aguardando confirmação':'Agendado')+'</span>'+
   '<h3>'+esc(name)+'</h3><p>'+esc(s.clientTopic||'Acompanhamento individual')+' · '+dateFmt(s.date)+' às '+esc(s.time||'')+'</p><small>'+esc(p.goal)+'</small></div>'+
   '<div class="rt-v914-agenda-cta"><a class="btn-primary" href="'+href+'">Abrir atendimento →</a></div></article>';
 }).join('');
 return head('ATENDIMENTO PROFISSIONAL','Sessões','Escolha um encontro e acompanhe as etapas Antes, Durante e Depois.',btn('+ Agendar sessão','new-session','','btn-primary'))+
 '<nav class="rt-v914-agenda-summary" aria-label="Resumo e atalhos da agenda"><a href="#sessoes?filter=proximos"'+(filter==='proximos'?' aria-current="page"':'')+'><span>Próximos encontros</span><strong>'+future+'</strong><small>Ver agenda →</small></a><a href="#sessoes?filter=sem-confirmacao"'+(filter==='sem-confirmacao'?' aria-current="page"':'')+'><span>Sem confirmação</span><strong>'+unconfirmed+'</strong><small>Revisar horários →</small></a><a href="#sessoes?filter=concluidas"'+(filter==='concluidas'?' aria-current="page"':'')+'><span>Concluídos</span><strong>'+finished+'</strong><small>Ver histórico →</small></a></nav>'+
 '<nav class="rt-v914-agenda-filters" aria-label="Filtrar sessões">'+opts.map(([id,label])=>'<a href="#sessoes?filter='+id+'"'+(filter===id?' aria-current="page"':'')+'>'+label+'</a>').join('')+'</nav>'+
 '<div class="rt-v914-agenda-list">'+(cards||'<div class="rt-v914-empty">Nenhum encontro neste filtro. <a href="#sessoes?filter=todos">Ver todas as sessões →</a></div>')+'</div>';
}
function showProcesses(){return head('PROCESSOS ACOMPANHADOS','Processo de desenvolvimento','Acesse cada processo em um só lugar: objetivos, atendimentos, atividades e compromissos.',btn('+ Novo processo','new-process','','btn-primary'))+
 `<details class="rt-v915-process-guide"><summary>Como funciona um processo de desenvolvimento</summary><p>Etapas de referência, não um indicador automático de evolução.</p><div class="workflow">${[['01','Acordo','Finalidade e limites'],['02','Objetivos','Metas contextualizadas'],['03','Sessões','Planejamento conjunto'],['04','Prática','Ações entre encontros'],['05','Revisão','Acompanhamento e fechamento']].map(([n,t,d])=>`<div class="step"><span>${n}</span><strong>${t}</strong><small>${d}</small></div>`).join('')}</div></details><div class="card"><div class="card-head"><h2>Processos registrados · ${db.programs.length}</h2></div><div class="table-wrap"><table class="table"><thead><tr><th>CLIENTE</th><th>OBJETIVO</th><th>ETAPA</th><th>STATUS</th><th>AÇÕES</th></tr></thead><tbody>${db.programs.map(p=>`<tr><td><b>${esc(clientOf(p))}</b></td><td>${esc(p.goal)}</td><td>${esc(p.stage)}</td><td>${status(p.status)}</td><td>${btn('Abrir jornada','process-detail',p.id)}</td></tr>`).join('')||`<tr><td colspan="5">${empty('Sem processos','Crie seu primeiro processo demonstrativo.')}</td></tr>`}</tbody></table></div></div>`;}
function showProcessDetail(id){let p=program(id);if(!p)return showProcesses();let ss=db.sessions.filter(s=>s.programId===id).sort((a,b)=>a.date.localeCompare(b.date));let aa=db.actions.filter(a=>a.programId===id);let done=aa.filter(a=>a.status==='concluido').length;
 return head('PROCESSO DE DESENVOLVIMENTO',esc(clientOf(p)),esc(p.goal),btn('← Processos','go','processos','btn-secondary')+btn('+ Agendar sessão','new-session-for',id,'btn-primary'))+
 `<div class="grid2"><div class="stack"><div class="card"><h2>Objetivos e condução</h2><div class="detail-grid"><div class="detail"><small>Objetivo acordado</small><b>${esc(p.goal)}</b></div><div class="detail"><small>Etapa atual</small><b>${esc(p.stage)}</b></div><div class="detail"><small>Início</small><b>${dateFmt(p.start)}</b></div><div class="detail"><small>Situação</small>${status(p.status)}</div></div>${btn('Atualizar etapa','edit-stage',p.id)} ${p.status!=='finalizado'?btn('Finalizar processo','finish-process',p.id):btn('Reabrir processo','reopen-process',p.id)}<p class="inline-note">Nenhum perfil comportamental é definido automaticamente. O profissional seleciona e interpreta os recursos de apoio.</p></div>
 <div class="card"><div class="card-head"><h2>Sessões do processo</h2>${btn('Agendar +','new-session-for',id,'plain-link')}</div>${ss.map(s=>`<div class="list-item"><div class="datebox"><strong>${day(s.date)}</strong>${month(s.date)}</div><div class="item-main"><strong>${esc(s.focus)}</strong><p>${esc(s.time)} · ${esc(s.status)}</p></div>${btn('Ver','session-detail',s.id)}</div>`).join('')||empty('Sem sessões','Agende o primeiro encontro.')}</div></div>
 <div class="stack"><div class="card"><div class="card-head"><h2>Acompanhamento de ações</h2>${btn('Nova ação +','new-action-for',id,'plain-link')}</div><div class="muted">${done} de ${aa.length} atividades concluídas</div><div class="progress-track"><span style="width:${aa.length?100*done/aa.length:0}%"></span></div>${aa.map(a=>`<div class="list-item"><div class="item-main"><strong>${esc(a.title)}</strong><p>Prazo: ${dateFmt(a.due)}</p></div>${btn(a.status==='concluido'?'↺':'✓','toggle-action',a.id)}${btn(a.visibility==='privado'?'Compartilhar':'Restringir','toggle-share-action',a.id)}</div>`).join('')||empty('Sem atividades','Adicione uma ação combinada.')}</div><div class="card"><div class="card-head"><h2>Orientações para o cliente</h2>${btn('+ Compartilhar orientação','new-guidance',id,'plain-link')}</div><p class="inline-note">Só as orientações marcadas como compartilhadas aparecem no portal do cliente. Não inclua registros clínicos nesta demonstração.</p>${db.guidance.filter(g=>g.programId===id&&g.visibility==='compartilhado').map(g=>`<div class="list-item"><div class="item-main"><p>${esc(g.text)}</p><small>${dateFmt(g.created)}</small></div></div>`).join('')||empty('Nenhuma orientação','Adicione uma orientação compartilhada.')}</div><div class="card"><div class="card-head"><h2>Instrumentos / reflexão guiada</h2>${btn('+ Atribuir','new-instrument-for',id,'plain-link')}</div>${instrumentEntries(id)}</div><div class="card"><div class="card-head"><h2>DISC/ACER no processo</h2><a href="#atividades-guiadas" class="row-link">Atribuir ↗</a></div>${db.discAssignments.filter(t=>t.programId===id).map(t=>`<div class="list-item"><div class="item-main"><strong>${t.status==='respondido'?'Mapeamento concluído':t.status==='cancelado'?'Aplicação cancelada':t.startedAt?'Mapeamento em andamento':'Mapeamento pendente'}</strong><p>${t.visibility==='compartilhado'?'Atribuído na Minha Jornada':'Rascunho interno'}</p></div>${t.status==='respondido'?btn('Analisar','go','relatorios'):''}</div>`).join('')||empty('Nenhum mapeamento atribuído','Atribua o DISC no menu Instrumentos.')}</div><div class="card"><div class="card-head"><h2>Mapeamentos associados</h2><a class="row-link" href="#graficos-relatorios">Ver relatórios ↗</a></div>${db.discLinks.filter(l=>l.programId===id).map(l=>`<div class="list-item"><div class="item-main"><strong>Mapeamento de ${new Date(l.sourceTs).toLocaleDateString('pt-BR')}</strong><p>D ${esc(l.scores.D)} · I ${esc(l.scores.I)} · S ${esc(l.scores.S)} · C ${esc(l.scores.C)} · Interno</p></div></div>`).join('')||empty('Nenhum vínculo','Associe um resultado demonstrativo na seção Relatórios e gráficos.')}</div><div class="card"><h2>Materiais relacionados</h2><p class="inline-note">Selecione práticas e leituras com base nos objetivos definidos em conjunto.</p><a href="#biblioteca" class="row-link">Abrir ferramentas DISC/ACER ↗</a><p><a href="#biblioteca" class="row-link">Abrir Communication Lab ↗</a></p></div></div></div>`;
}

function instrumentEntries(programId){
 const records=db.instruments.filter(i=>!programId||i.programId===programId);
 return records.map(i=>`<div class="list-item rt-instrument-row"><div class="item-main"><strong>${esc(i.title)}</strong><p>${esc(pgName(i.programId))} · ${i.status==='respondido'||i.status==='devolvido'?'Respondido':'Aguardando resposta'} · ${i.visibility==='compartilhado'?'Visível na jornada':'Privado ao profissional'}</p>${i.responses?`<div class="rt-answers">${['Situação observada','Minha reação','Próxima prática'].map((q,j)=>`<p><b>${q}:</b> ${esc(i.responses[j])}</p>`).join('')}</div>`:''}${i.feedback?`<p><b>Devolutiva interna:</b> ${esc(i.feedback)} ${i.feedbackVisibility==='compartilhado'?'· Compartilhada':'· Não compartilhada'}</p>`:''}</div><div class="rt-row-actions">${btn(i.visibility==='compartilhado'?'Restringir':'Compartilhar','toggle-instrument',i.id)}${i.responses?btn('Revisar resposta','review-instrument',i.id):''}</div></div>`).join('')||empty('Nenhuma atividade de reflexão atribuída','Atribua um exercício contextualizado a um processo.');
}
function showInstruments(){return head('PRÁTICAS CONTEXTUALIZADAS','Instrumentos e atividades','Atribua exercícios guiados e acompanhe respostas no contexto do processo. Isso não equivale a aplicação, pontuação ou interpretação de teste psicológico.',btn('+ Atribuir atividade','new-instrument','','btn-primary'))+
 `<div class="rt-disclaimer">Exercícios de reflexão educativa. Não geram diagnóstico ou escores DISC/ACER. O mapeamento DISC/ACER está no próprio workspace. Sua associação ao processo é explícita e demonstrativa; não é um teste psicológico validado.</div><p class="rt-inline-route"><a class="btn-secondary" href="#atividades-guiadas">Abrir atividades guiadas →</a></p><section class="card"><div class="card-head"><h2>Atividades atribuídas · ${db.instruments.length}</h2></div>${instrumentEntries('')}</section>`;}
function showSessions(){let ss=[...db.sessions].sort((a,b)=>a.date.localeCompare(b.date));return head('PLANEJAMENTO & CONDUÇÃO','Sessões','Estruture pauta, objetivos e próximos acordos. Não registre informações clínicas nesta demonstração.',btn('+ Agendar sessão','new-session','','btn-primary'))+
 `<div class="card"><div class="card-head"><h2>Agenda de sessões</h2><span class="pill">${ss.length} registros fictícios</span></div>${ss.map(s=>`<div class="list-item"><div class="datebox"><strong>${day(s.date)}</strong>${month(s.date)}</div><div class="item-main"><strong>${esc(pgName(s.programId))}</strong><p>${esc(s.focus)} · ${dateFmt(s.date)} às ${esc(s.time)}</p></div>${status(s.status)} ${btn('Abrir','session-detail',s.id)}</div>`).join('')||empty('Nenhuma sessão','Agende seu primeiro encontro.')}</div>`;}
function showSessionDetail(id){let s=db.sessions.find(x=>x.id===id);if(!s)return showSessions();let p=program(s.programId);let actionCount=db.actions.filter(a=>a.programId===s.programId).length;
 return head('SESSÃO · ACOMPANHAMENTO',esc(pgName(s.programId)),esc(s.focus),btn('← Sessões','go','sessoes','btn-secondary')+(s.status==='agendada'?btn('Concluir sessão','close-session',id,'btn-primary'):''))+
 `<div class="grid2"><div class="stack"><div class="card"><h2>Informações da sessão</h2><div class="detail-grid"><div class="detail"><small>Quando</small><b>${dateFmt(s.date)} · ${esc(s.time)}</b></div><div class="detail"><small>Status</small>${status(s.status)}</div><div class="detail"><small>Processo</small><b>${esc(p?.goal||'')}</b></div><div class="detail"><small>Atividades do processo</small><b>${actionCount}</b></div></div><div class="note">Pauta sugerida: abertura e objetivos → exploração orientada → exercício escolhido → definição de próximos passos → combinação de acompanhamento.</div>${s.summary?`<p class="inline-note"><b>Resumo não clínico demonstrativo:</b> ${esc(s.summary)}</p>`:''}</div></div><div class="stack"><div class="card"><h2>Preparação do encontro</h2><p class="inline-note">O profissional decide quais intervenções utilizar. Ferramentas DISC/ACER são recursos educativos e não substituem instrumentos psicológicos apropriados.</p><p><a class="row-link" target="_blank" rel="noopener" href="#biblioteca">Consultar conhecimentos ↗</a></p><p><a class="row-link" target="_blank" rel="noopener" href="#biblioteca">Abrir simulações de comunicação ↗</a></p>${btn('+ Criar atividade pós-sessão','new-action-for',s.programId,'btn-primary')}</div></div></div>`;
}
function showPlans(){let completed=db.actions.filter(x=>x.status==='concluido').length;return head('COMPROMISSOS PRÁTICOS','Planos de desenvolvimento','Registre ações concretas combinadas e acompanhe sua realização ao longo dos processos.',btn('+ Nova ação','new-action','','btn-primary'))+
 `<div class="stats">${stat('Ações em acompanhamento',db.actions.length,'◎','Total demonstrativo')}${stat('Concluídas',completed,'✓','Ações marcadas como feitas')}${stat('Pendentes',db.actions.length-completed,'◷','Próximas ações')}${stat('Taxa de conclusão',db.actions.length?Math.round(completed/db.actions.length*100)+'%':'0%','↗','Somente ações; não mede mudança psicológica')}</div>
 <div class="card"><div class="card-head"><h2>Atividades por processo</h2></div><div class="table-wrap"><table class="table"><thead><tr><th>ATIVIDADE</th><th>CLIENTE</th><th>DATA COMBINADA</th><th>SITUAÇÃO</th><th>AÇÃO</th></tr></thead><tbody>${db.actions.map(a=>`<tr><td><b>${esc(a.title)}</b><br/><span class="mini">${esc(a.resource)} · ${a.visibility==='privado'?'Somente profissional':'Compartilhada'}</span></td><td>${esc(pgName(a.programId))}</td><td>${dateFmt(a.due)}</td><td>${status(a.status)}</td><td>${btn(a.status==='concluido'?'Reabrir':'Concluir','toggle-action',a.id)} ${btn(a.visibility==='privado'?'Compartilhar':'Restringir','toggle-share-action',a.id)}</td></tr>`).join('')||`<tr><td colspan="5">${empty('Sem atividades','Crie uma primeira ação de desenvolvimento.')}</td></tr>`}</tbody></table></div></div>`;}
const resources=[
 {cat:'CONHECIMENTO',title:'Fundamentos DISC/ACER',desc:'Conceitos, usos educacionais e limites de interpretação do modelo.',url:'../biblioteca/index.html#view=conhecimento'},
 {cat:'COMUNICAÇÃO',title:'Communication Lab',desc:'Simulações e exercícios de comunicação, liderança e conflitos.',url:'../biblioteca/index.html#view=laboratorio'},
 {cat:'FERRAMENTAS',title:'Comparador de fatores',desc:'Compare tendências de comportamento de forma não determinista.',url:'../biblioteca/index.html#view=ferramentas'},
 {cat:'APRENDIZAGEM',title:'Trilhas de estudo',desc:'Percursos educativos para aprofundar o conhecimento da metodologia.',url:'../biblioteca/index.html#view=aprender'},
 {cat:'DESENVOLVIMENTO',title:'Planos por fator',desc:'Reflexões e microações de desenvolvimento; não são prescrições clínicas.',url:'../biblioteca/index.html#view=conhecimento'},
 {cat:'REFERÊNCIAS',title:'Fontes e cuidados metodológicos',desc:'Consulte as referências e diferencie evidências de modelos didáticos.',url:'../biblioteca/index.html#view=referencias'}
];

// V8: o motor DISC original e a Biblioteca são ferramentas internas, jamais um terceiro workspace.
const DISC_VIEWS={mapeamento:'mapeamento',relatorios:'relatorio','plano-disc':'plano'};
const showDiscNav=(active)=>`<div class="rt-v8-tabs" role="navigation" aria-label="Ferramentas de metodologia">
${[['mapeamento','Mapeamento'],['relatorios','Relatórios e gráficos'],['plano-disc','Plano de ação']].map(([route,title])=>`<a href="#${route}" ${active===route?'aria-current="page"':''}>${title}</a>`).join('')}</div>`;
const moduleFrame=(name,src,title)=>`<div class="rt-v8-frame-wrap"><iframe class="rt-v8-frame" data-rt-module="${name}" src="${src}" loading="eager" title="${esc(title)}" referrerpolicy="no-referrer" scrolling="no"></iframe></div>`;
function historyEntries(){try{const records=JSON.parse(localStorage.getItem('realtalent.history.v1')||'[]');return Array.isArray(records)?records.filter(x=>Number.isFinite(Number(x.ts))&&x.scores&&['D','I','S','C'].every(k=>Number.isFinite(Number(x.scores[k])))).slice(-40).reverse():[]}catch{return []}}
function linkedResults(){
 return `<section class="card rt-v8-linked"><div class="card-head"><h2>Mapeamentos associados a processos</h2><span class="pill">${db.discLinks.length} vínculos locais</span></div><p class="inline-note">Esta associação é feita manualmente e permanece restrita ao profissional nesta demonstração. Não compartilha resultados automaticamente com Minha Jornada e não valida o instrumento.</p>${db.discLinks.map(l=>`<div class="list-item"><div class="item-main"><strong>${esc(pgName(l.programId))}</strong><p>Origem: ${new Date(l.sourceTs).toLocaleDateString('pt-BR')} · D ${l.scores.D} / I ${l.scores.I} / S ${l.scores.S} / C ${l.scores.C} · Interno</p></div>${btn('Desvincular','unlink-disc',l.id)}</div>`).join('')||empty('Nenhum resultado associado','Conclua um mapeamento fictício e selecione o processo para estabelecer um vínculo.')}</section>`;
}
function linkableHistory(){
 const hist=historyEntries();
 if(!hist.length)return `<section class="card"><h2>Associar ao processo</h2>${empty('Sem mapeamentos locais','Preencha um mapeamento demonstrativo na seção acima. Ao concluir, volte aqui para vinculá-lo manualmente a um processo fictício.')}</section>`;
 return `<section class="card rt-v8-linked"><div class="card-head"><h2>Vincular mapeamento ao processo</h2><span class="pill">${hist.length} resultado(s) locais</span></div><p class="inline-note">Escolha um resultado local e um processo fictício. Somente as quatro pontuações e a data serão copiadas para a área profissional. Nada é liberado ao participante.</p>
 ${hist.slice(0,8).map((h,idx)=>`<form class="rt-v8-link-form" data-disc-ts="${h.ts}"><div><strong>Mapeamento ${new Date(h.ts).toLocaleString('pt-BR')}</strong><small>D ${esc(h.scores.D)} · I ${esc(h.scores.I)} · S ${esc(h.scores.S)} · C ${esc(h.scores.C)}</small></div><label><span>Vincular ao processo</span><select name="programId" required aria-label="Escolher processo para o mapeamento ${idx+1}"><option value="">Selecionar processo…</option>${db.programs.map(p=>`<option value="${esc(p.id)}">${esc(clientOf(p))} · ${esc(p.goal.slice(0,50))}</option>`).join('')}</select></label><button class="btn-primary" type="submit">Associar</button></form>`).join('')}</section>`;
}
// V8.1 — DISC distribuído por papel: atribuição profissional; resposta cliente; gráficos somente profissional.
const discNames={D:'Dominância',I:'Influência',S:'Estabilidade',C:'Conformidade'};
function discTaskLabel(t){const p=program(t.programId);return esc(clientOf(p))+' · '+esc(p?.goal||'Processo removido');}
function showDiscAssignments(){
 const list=db.discAssignments.slice().reverse();
 return head('INSTRUMENTOS · DISC/ACER','Atribuições de mapeamento','Envie o questionário original ao participante pela Minha Jornada. A análise de escores fica no Professional.',btn('+ Atribuir DISC','new-disc','','btn-primary'))+
 `<div class="rt-v8-notice"><strong>Fluxo:</strong> profissional atribui → cliente responde às 20 perguntas → gráficos aparecem em Relatórios. Nenhum resultado é compartilhado automaticamente.</div>
 <section class="card"><div class="card-head"><h2>Questionários por processo</h2><span class="pill">${list.length} registro(s)</span></div>
 ${list.map(t=>`<div class="list-item"><div class="item-main"><strong>${discTaskLabel(t)}</strong><p>${t.status==='respondido'?'✓ Respondido · '+new Date(t.completedAt).toLocaleString('pt-BR'):'Aguardando resposta'} · ${t.visibility==='compartilhado'?'Disponibilizado ao cliente':'Rascunho interno'}</p></div>
 ${t.status==='respondido'?btn('Ver gráficos','go','graficos-relatorios'):btn(t.visibility==='compartilhado'?'Recolher':'Disponibilizar','toggle-disc',t.id)}</div>`).join('')||empty('Nenhum mapeamento atribuído','Use “Atribuir DISC” e selecione um processo.')}</section>
 <section class="card"><h2>Instrumento original preservado</h2><p class="inline-note">O banco de 20 perguntas da versão original foi reaproveitado na Minha Jornada. O acervo antigo de relatórios, gráficos e histórico continua disponível em Relatórios → Acervo original, sem migração automática de resultados.</p></section>`;
}
function discRadar(scores){const letters=['D','I','S','C'],c=110,r=82;const xy=(k,v)=>{const i=letters.indexOf(k),a=-Math.PI/2+i*Math.PI/2;return `${(c+Math.cos(a)*r*v/20).toFixed(1)},${(c+Math.sin(a)*r*v/20).toFixed(1)}`};
 const grid=[5,10,15,20].map(v=>`<polygon points="${letters.map(k=>xy(k,v)).join(' ')}" fill="none" stroke="var(--rt-line)" stroke-width="1"/>`).join('');
 const axes=letters.map(k=>`<line x1="${c}" y1="${c}" x2="${xy(k,20).replace(',','" y2="')}" stroke="var(--rt-line)"/><text x="${(c+(k==='D'?0:k==='I'?99:k==='C'?-99:0))}" y="${(c+(k==='D'?-98:k==='S'?108:3))}" text-anchor="middle" dominant-baseline="middle" fill="var(--rt-text)" font-weight="800" font-size="15">${k}</text>`).join('');
 return `<svg class="rt-v81-radar" viewBox="-8 -10 236 240" role="img" aria-label="Distribuição ilustrativa D ${scores.D}, I ${scores.I}, S ${scores.S}, C ${scores.C}, de 20 escolhas">${grid}${axes}<polygon points="${letters.map(k=>xy(k,scores[k])).join(' ')}" fill="var(--rt-highlight)" stroke="var(--rt-purple)" stroke-width="3"/></svg>`;
}
function showDiscReports(){
 const records=db.discAssignments.filter(t=>t.status==='respondido'&&t.scores&&db.programs.some(p=>p.id===t.programId));
 const chosen=records.find(t=>t.id===window.rtDiscSelected)||records[records.length-1];
 return head('ANÁLISE PROFISSIONAL','Gráficos e relatórios','Indicadores ilustrativos das respostas, associados ao cliente e ao processo. O participante não tem acesso a estes gráficos.')+
 `<div class="rt-v8-tabs" aria-label="Seções do Professional"><a href="#atividades-guiadas">Atividades guiadas</a><a href="#graficos-relatorios" aria-current="page">Gráficos</a><a href="#plano-acao">Plano de ação</a></div>
 <section class="card"><div class="card-head"><h2>Selecione um resultado</h2><span class="pill">${records.length} respondido(s)</span></div>
 ${records.length?`<div class="rt-v81-selector">${records.slice().reverse().map(t=>`<button type="button" class="rt-v81-result-option ${t.id===chosen.id?'is-active':''}" data-act="select-disc" data-id="${esc(t.id)}" aria-pressed="${t.id===chosen.id}">${discTaskLabel(t)}<small>${new Date(t.completedAt).toLocaleDateString('pt-BR')}</small></button>`).join('')}</div>`:empty('Ainda sem respostas','Atribua o questionário em Atividades guiadas e responda na Minha Jornada.')}</section>
 ${chosen?`<section class="card"><div class="card-head"><h2>Distribuição dos fatores — ${esc(clientOf(program(chosen.programId)))}</h2><span class="pill">20 respostas</span></div>
 <div class="rt-v81-analysis"><div class="rt-v81-bars">${['D','I','S','C'].map(k=>`<div class="rt-v81-factor"><div><strong>${k} · ${discNames[k]}</strong><span>${chosen.scores[k]} de 20 · ${Math.round(chosen.scores[k]*5)}%</span></div><div class="rt-v81-track"><span style="width:${chosen.scores[k]*5}%"></span></div></div>`).join('')}</div>${discRadar(chosen.scores)}</div>
 ${chosen.selfScores&&chosen.perceivedScores?`<div class="rt-v81-two-rounds"><section><h3>Autoimagem — adjetivos escolhidos</h3>${['D','I','S','C'].map(k=>`<p><strong>${k}</strong> · ${chosen.selfScores[k]} escolhas</p>`).join('')}</section><section><h3>Expectativas percebidas — adjetivos escolhidos</h3>${['D','I','S','C'].map(k=>`<p><strong>${k}</strong> · ${chosen.perceivedScores[k]} escolhas</p>`).join('')}</section></div>`:''}
 <p class="inline-note">Percentuais representam a frequência de escolha entre 20 itens, não percentis, diagnóstico nem medida psicométrica validada. Interpretação contextual cabe ao profissional.</p>
 <div class="rt-v81-feedback"><h3>Devolutiva ao cliente</h3><p>${esc(chosen.feedback||'Nenhuma devolutiva registrada.')}</p><small>${chosen.feedbackVisibility==='compartilhado'?'Disponibilizada em Minha Jornada.':'Privada no Professional (não compartilhada).'}</small>
 <div class="rt-v81-actions">${btn('Redigir / editar devolutiva','disc-feedback',chosen.id,'btn-primary')}${chosen.feedback?btn(chosen.feedbackVisibility==='compartilhado'?'Restringir devolutiva':'Liberar devolutiva','toggle-disc-feedback',chosen.id,'btn-secondary'):''}</div></div></section>`:''}
 <details class="card rt-v81-legacy"><summary>Acervo original de relatórios, gráficos e histórico (dados antigos)</summary><p class="inline-note">O motor original permanece disponível aqui para consulta dos resultados locais legados. Dados deste acervo não se misturam automaticamente com os resultados vinculados do novo fluxo.</p><div class="rt-v8-tabs rt-v8-subtabs" aria-label="Exibição do acervo">${[['relatorio','Relatório'],['graficos','Gráficos anteriores'],['dashboard','Histórico anterior']].map((x,i)=>`<button type="button" data-rt-view="${x[0]}" aria-selected="${i===0}">${x[1]}</button>`).join('')}</div>${moduleFrame('disc','../disc-engine.html?rtEmbed=1&rtView=relatorio','Acervo original de resultados DISC')}</details>
 ${linkableHistory()}${linkedResults()}`;
}

// V9.5 — o Plano de ação agora usa registros vinculados aos processos, não o HTML legado.
function actionState(a){
 if(a.status==='concluido')return 'concluido';
 if(a.due && a.due<today())return 'atrasado';
 return 'pendente';
}
const actionLabels={pendente:'Pendente',atrasado:'Prazo vencido',concluido:'Concluída'};
function actionBadge(k){return `<span class="rt-v95-pill rt-v95-${k}"><span aria-hidden="true" class="rt-v95-dot"></span>${actionLabels[k]}</span>`;}
function showActionPlan(){
 const qs=new URLSearchParams((location.hash.split('?')[1]||''));
 const allowed=['abertas','atrasadas','concluidas','todas'];
 const filter=allowed.includes(qs.get('filter'))?qs.get('filter'):'abertas';
 const programFilter=db.programs.some(p=>p.id===qs.get('program'))?qs.get('program'):'todos';
 const qsTo=(f=filter,p=programFilter)=>`#plano-acao?filter=${encodeURIComponent(f)}&program=${encodeURIComponent(p)}`;
 const all=db.actions.filter(a=>program(a.programId));
 const scope=all.filter(a=>programFilter==='todos'||a.programId===programFilter);
 const pending=scope.filter(a=>a.status!=='concluido');
 const overdue=pending.filter(a=>actionState(a)==='atrasado');
 const finished=scope.filter(a=>a.status==='concluido');
 let visible=scope.filter(a=>{
  const st=actionState(a);
  return filter==='todas'||(filter==='abertas'&&st!=='concluido')||(filter==='atrasadas'&&st==='atrasado')||(filter==='concluidas'&&st==='concluido');
 });
 visible=visible.sort((a,b)=>{
  const rank={atrasado:0,pendente:1,concluido:2};
  return rank[actionState(a)]-rank[actionState(b)]||String(a.due||'9999-99-99').localeCompare(b.due||'9999-99-99')||a.title.localeCompare(b.title);
 });
 const filters=[['abertas','Em aberto'],['atrasadas','Atrasadas'],['concluidas','Concluídas'],['todas','Todas']];
 const countBy={abertas:pending.length,atrasadas:overdue.length,concluidas:finished.length,todas:scope.length};
 const rows=visible.map(a=>{
  const p=program(a.programId);if(!p)return '';
  const st=actionState(a),goal=db.goals.find(g=>g.id===a.goalId&&g.programId===a.programId),source=db.sessions.find(s=>s.id===a.sessionId&&s.programId===a.programId);
  return `<article class="rt-v95-action" data-action-id="${esc(a.id)}">
   <div class="rt-v95-action-info"><div class="rt-v95-action-top">${actionBadge(st)}<span class="rt-v95-visibility">${a.visibility==='compartilhado'?'◉ Visível na Minha Jornada':'◌ Somente profissional'}</span></div>
   <h3>${esc(a.title)}</h3>
   <p><strong>${esc(clientOf(p))}</strong><span aria-hidden="true"> · </span>${esc(p.goal)}</p>
   <div class="rt-v95-action-meta"><span>${a.due?'Prazo: '+dateFmt(a.due):'Sem prazo'}</span><span>Objetivo: ${esc(goal?.title||'Não relacionado')}</span>${source?`<a href="${wsUrl(p.clientId,'sessoes',p.id,'session='+encodeURIComponent(source.id))}">Sessão de origem: ${dateFmt(source.date)} →</a>`:''}${a.resource&&a.resource!=='Nenhum'?`<span>Recurso: ${esc(a.resource)}</span>`:''}</div></div>
   <div class="rt-v95-action-buttons">${btn('Editar','edit-action',a.id,'btn-secondary')}${btn(st==='concluido'?'Reabrir':'Concluir','toggle-action',a.id,'btn-primary')}${workspaceButton('Ver cliente →',p.clientId,'desenvolvimento',p.id,'line-button')}</div>
  </article>`;
 }).join('');
 const legend=`<section class="rt-v95-legend" aria-label="Legenda do plano de ação"><h2>Legenda</h2>
 <span>${actionBadge('pendente')}<small>Compromisso em aberto</small></span><span>${actionBadge('atrasado')}<small>Prazo já ultrapassado</small></span>
 <span>${actionBadge('concluido')}<small>Execução registrada</small></span><span class="rt-v95-legend-share"><b>◉ Compartilhada</b><small>Disponível na Minha Jornada; ações internas não aparecem ao cliente.</small></span></section>`;
 return head('ACOMPANHAMENTO','Plano de ação','Acompanhe os compromissos concretos de cada processo: responsáveis, prazos e execução.',db.programs.some(p=>p.status!=='finalizado')?btn('+ Nova ação','new-action','','btn-primary'):'<a class="btn-primary" href="#processos">+ Criar processo</a>')+
 `<section class="rt-v95-context" aria-label="Diferença entre planos"><div><small>PLANO DE DESENVOLVIMENTO</small><strong>O que queremos desenvolver?</strong><p>Objetivos e evolução do processo.</p><a href="#plano-desenvolvimento">Ver objetivos →</a></div><span class="rt-v95-context-arrow" aria-hidden="true">→</span><div class="rt-v95-context-current"><small>PLANO DE AÇÃO · ESTA ABA</small><strong>O que vamos fazer e até quando?</strong><p>Ações acordadas, prazos e acompanhamento da execução.</p></div></section>`+
 `<section class="rt-v95-summary" aria-label="Resumo dos compromissos"><div><span>Em aberto</span><strong>${pending.length}</strong><small>Ações a executar</small></div><div><span>Com prazo vencido</span><strong>${overdue.length}</strong><small>Requerem acompanhamento</small></div><div><span>Concluídas</span><strong>${finished.length}</strong><small>Execução registrada</small></div></section>`+
 legend+
 `<section class="rt-v95-board" aria-label="Ações do processo"><div class="rt-v95-board-top"><div><h2>Ações registradas</h2><p>Prioridade para os prazos vencidos e os compromissos em aberto.</p></div><label for="rt-v95-process">Processo <select id="rt-v95-process" aria-label="Filtrar ações por processo">`+
 `<option value="todos">Todos os clientes e processos</option>${db.programs.map(p=>`<option value="${esc(p.id)}" ${programFilter===p.id?'selected':''}>${esc(clientOf(p))} — ${esc(p.goal)}</option>`).join('')}</select></label></div>`+
 `<nav class="rt-v95-filters" aria-label="Filtrar ações por situação">${filters.map(([k,label])=>`<a class="rt-v95-filter ${filter===k?'selected':''}" href="${qsTo(k)}" ${filter===k?'aria-current="page"':''}>${label}<span>${countBy[k]}</span></a>`).join('')}</nav>`+
 `<div class="rt-v95-list">${rows||empty('Nenhuma ação neste filtro',scope.length?'Experimente outro filtro ou selecione outro processo.':'Crie um processo e registre o primeiro compromisso concreto.')}</div></section>`+
 `<p class="rt-v95-disclaimer">Marcar uma ação como concluída registra a execução do compromisso. Não representa, isoladamente, melhora psicológica nem validação do DISC/ACER. Nesta demonstração, as alterações ficam somente no navegador.</p>`;
}
function showMethodPage(page){
 if(page==='mapeamento')return showDiscAssignments();
 if(page==='relatorios')return showDiscReports();
 return showActionPlan();
}
function showTools(){
 const activeView=(new URLSearchParams(location.hash.split('?')[1]||'').get('view')||'inicio');
 const allowedViews=['inicio','conhecimento','ferramentas','laboratorio','aprender','referencias'];
 const view=allowedViews.includes(activeView)?activeView:'inicio';
 return head('MATERIAIS E PRÁTICAS','Biblioteca','Conhecimento, perfis, referências e simulações integrados ao espaço profissional.')+
 `<div class="rt-v8-tabs rt-v8-subtabs" role="tablist" aria-label="Seções da biblioteca">${[['inicio','Visão geral'],['conhecimento','Conhecimento'],['ferramentas','Ferramentas'],['laboratorio','Communication Lab'],['aprender','Trilhas'],['referencias','Referências']].map(([key,title],i)=>`<button type="button" data-lib-view="${key}" aria-selected="${key===view}">${title}</button>`).join('')}</div>`+
 moduleFrame('library','../biblioteca/index.html?embedded=1#view='+view,'Biblioteca e Communication Lab')+
 `<p class="inline-note">Biblioteca educacional com recursos contextualizados. O profissional continua responsável por selecionar o que é adequado à sua atuação.</p>`;
}
// V9.6 — central de ferramentas NATIVA. Os registros DISC são os mesmos do
// workspace individual e do portal demonstrativo, sem outro estado duplicado.
function rt96Params(){return new URLSearchParams(location.hash.split('?')[1]||'');}
function rt96Href(tab,extra=''){return '#ferramentas?tab='+encodeURIComponent(tab)+(extra?'&'+extra:'');}
function rt96Status(t){return t.status==='cancelado'?'Cancelada':t.status==='respondido'?'Respondido':t.visibility!=='compartilhado'?'Rascunho interno':t.startedAt?'Em andamento':'Aguardando resposta';}
function rt96DiscTab(){return ['visao','aplicar','aplicacoes','resultados'].includes(rt96Params().get('tab'))?rt96Params().get('tab'):'visao';}
function rt96ProgressLine(t){
 const p=program(t.programId),c=client(p?.clientId);
 if(!p||!c)return '';
 return `<div class="rt-v96-entry"><div class="rt-v96-entry-main"><span class="rt-v96-kicker">${esc(c.name)} · ${esc(p.stage||'Processo')}</span><strong>${esc(p.goal)}</strong><small>${t.status==='respondido'?'Respondido em '+new Date(t.completedAt||t.assignedAt).toLocaleDateString('pt-BR'):'Atribuído em '+new Date(t.assignedAt).toLocaleDateString('pt-BR')} · ${t.visibility==='compartilhado'?'Visível em Minha Jornada':'Restrito ao profissional'}</small></div><span class="rt-v96-pill ${t.status==='respondido'?'done':t.visibility==='compartilhado'?'waiting':''}">${rt96Status(t)}</span><div class="rt-v96-entry-actions">${t.status==='respondido'?`<a class="btn-secondary" href="${rt96Href('resultados','result='+encodeURIComponent(t.id))}">Ver resultados</a>`:t.status==='cancelado'?'':btn(t.visibility==='compartilhado'?'Recolher':'Disponibilizar','toggle-disc',t.id,'btn-secondary')+btn('Cancelar aplicação','cancel-disc',t.id,'btn-secondary rt-v97-cancel')}<a class="rt-v96-inline" href="${wsUrl(p.clientId,'atividades',p.id)}">Abrir cliente →</a></div></div>`;
}
function showInstrumentsCenter(){
 const active=rt96Params().get('tab')||'visao';
 const choice='<nav class="rt-v911-chooser rt-v912-tool-nav" aria-label="Tipos de ferramentas">'+[
  ['kit','Kit de atendimento'],['perguntas','Perguntas de Coaching'],['temporizador','Temporizador'],['roda','Roda da Vida'],['5w2h','Matriz 5W2H'],['visao','DISC / ACER']
 ].map(([key,label])=>'<a href="'+rt96Href(key)+'"'+((key==='visao'?!['kit','perguntas','temporizador','roda','5w2h'].includes(active):key===active)?' aria-current="page"':'')+'>'+label+'</a>').join('')+'</nav>';
 if(active==='perguntas'){
  return head('APOIO À CONDUÇÃO','Banco de Perguntas','Perguntas abertas por etapa para apoiar sessões de coaching e desenvolvimento.')+
    choice+RTSessionAssist.renderQuestions(db,rt96Params().get('session')||'',rt96Params().get('phase')||'todas',{esc,dateFmt,wsUrl,today});
 }
 if(active==='temporizador'){
  return head('CONDUÇÃO DO ENCONTRO','Temporizador de Sessão','Controle de tempo opcional, com etapas configuráveis e avanço manual.')+
    choice+RTSessionAssist.renderTimer(db,rt96Params().get('session')||'',{esc,dateFmt,wsUrl,today});
 }
 if(active==='roda'){
  return head('REFLEXÃO CONTEXTUAL','Roda da Vida','Autoavaliação subjetiva, histórica e vinculada a um único processo.')+
    choice+RTDevelopmentToolkit.renderWheel(db,rt96Params().get('program')||'',{esc,dateFmt,wsUrl,today});
 }
 if(active==='5w2h'){
  return head('PLANEJAMENTO DE AÇÕES','Matriz 5W2H','Converta uma decisão concreta em uma ação do Plano de Ação existente.')+
    choice+RTDevelopmentToolkit.renderFive(db,rt96Params().get('program')||'',rt96Params().get('action')||'',{esc,dateFmt,wsUrl,today});
 }
 if(rt96Params().get('tab')==='kit'){
   return head('APOIO À CONDUÇÃO','Kit do profissional','Prepare encontros, recupere compromissos e organize perguntas de coaching sem duplicar registros.')+
     choice+RTProfessionalKit.render(db,rt96Params().get('session')||'',{esc,dateFmt,wsUrl,today});
 }
 const tab=rt96DiscTab(),tasks=db.discAssignments.filter(t=>program(t.programId));
 const responded=tasks.filter(t=>t.status==='respondido'&&t.scores);
 const open=tasks.filter(t=>t.status==='atribuido');
 const pendingReview=responded.filter(t=>!t.feedback);
 const n=[['visao','Visão geral'],['aplicar','Aplicar'],['aplicacoes','Aplicações'],['resultados','Resultados']];
 const tabs=`<nav class="rt-v96-tabs" aria-label="DISC/ACER — seções">${n.map(([k,title])=>`<a href="${rt96Href(k)}" ${k===tab?'aria-current="page"':''}>${title}</a>`).join('')}</nav>`;
 let content='';
 if(tab==='visao'){
   content=`<div class="rt-v96-kpis"><a href="${rt96Href('aplicacoes')}" class="rt-v96-kpi"><span>Aplicações</span><strong>${tasks.length}</strong><small>Consultar histórico →</small></a><a href="${rt96Href('aplicacoes','status=pendentes')}" class="rt-v96-kpi"><span>Aguardando resposta</span><strong>${open.filter(t=>t.visibility==='compartilhado').length}</strong><small>Ver pendências →</small></a><a href="${rt96Href('resultados')}" class="rt-v96-kpi"><span>Resultados disponíveis</span><strong>${responded.length}</strong><small>Analisar →</small></a><a href="${rt96Href('resultados')}" class="rt-v96-kpi"><span>Sem devolutiva</span><strong>${pendingReview.length}</strong><small>Revisar →</small></a></div>
 <div class="rt-v96-layout"><section class="rt-v96-surface"><div class="rt-v96-section-title"><div><h2>Como funciona</h2><p>Um fluxo único, vinculado ao acompanhamento individual.</p></div></div><ol class="rt-v96-flow"><li><b>Selecione um processo</b><span>O profissional define a quem atribuir.</span></li><li><b>Disponibilize a atividade</b><span>O participante responde às perguntas em Minha Jornada.</span></li><li><b>Revise as respostas</b><span>Os gráficos são exclusivos do Professional.</span></li><li><b>Prepare a devolutiva</b><span>O compartilhamento é explícito e restrito ao conteúdo liberado.</span></li></ol><a class="btn-primary rt-v96-cta" href="${rt96Href('aplicar')}">Atribuir DISC/ACER →</a></section>
 <aside class="rt-v96-surface rt-v96-side"><h2>Aplicações recentes</h2>${tasks.slice(-3).reverse().map(rt96ProgressLine).join('')||empty('Sem aplicações','Atribua o instrumento a um processo demonstrativo.')}<a class="rt-v96-inline" href="${rt96Href('aplicacoes')}">Ver todas as aplicações →</a></aside></div>`;
 }else if(tab==='aplicar'){
   const opts=pgOpts();
   content=`<div class="rt-v96-layout"><section class="rt-v96-surface"><div class="rt-v96-section-title"><div><h2>Nova aplicação</h2><p>O questionário aparece no portal somente quando você autoriza.</p></div></div>${opts.length?`<form class="rt-v96-form" id="rt-v96-assign-disc"><label for="rt-v96-program">Cliente e processo<select id="rt-v96-program" name="programId" required><option value="">Selecione um processo...</option>${opts.map(([id,text])=>`<option value="${esc(id)}">${esc(text)}</option>`).join('')}</select></label><label for="rt-v96-visibility">Disponibilização<select id="rt-v96-visibility" name="visibility"><option value="privado">Rascunho interno — não aparece ao cliente</option><option value="compartilhado">Liberar na Minha Jornada</option></select></label><div class="rt-v96-form-actions"><button class="btn-primary" type="submit">Atribuir DISC/ACER</button><p id="rt-v96-form-error" role="alert" class="rt-v96-error" hidden></p></div></form>`:empty('Cadastre um processo primeiro','Vá até Clientes, crie um processo demonstrativo e retorne para atribuir.')}<p class="rt-v96-note">Uma aplicação pendente por processo. Para reaplicar, conclua ou cancele uma atribuição anterior.</p></section><aside class="rt-v96-surface rt-v96-side"><h2>O que o participante recebe?</h2><p>Um questionário educativo com as 20 perguntas e as duas etapas de adjetivos já utilizadas na Minha Jornada.</p><p>O participante acompanha a conclusão, mas não recebe automaticamente os escores ou gráficos.</p><a class="rt-v96-inline" href="../cliente/index.html">Ver prévia da Minha Jornada →</a></aside></div>`;
 }else if(tab==='aplicacoes'){
   const f=rt96Params().get('status')||'todas';
   const choose=t=>f==='pendentes'?t.status==='atribuido'&&t.visibility==='compartilhado':f==='andamento'?t.status==='atribuido'&&!!t.startedAt:f==='respondidas'?t.status==='respondido':f==='rascunhos'?t.status==='atribuido'&&t.visibility!=='compartilhado':f==='canceladas'?t.status==='cancelado':true;
   const listed=tasks.filter(choose).slice().reverse();
   content=`<section class="rt-v96-surface"><div class="rt-v96-section-title"><div><h2>Acompanhamento das aplicações</h2><p>Visualização de todas as atribuições vinculadas aos processos.</p></div><a class="btn-primary" href="${rt96Href('aplicar')}">+ Nova aplicação</a></div><div class="rt-v96-filters">${[['todas','Todas'],['pendentes','Pendentes'],['andamento','Em andamento'],['respondidas','Respondidas'],['rascunhos','Restritas'],['canceladas','Canceladas']].map(([key,label])=>`<a href="${rt96Href('aplicacoes','status='+key)}" ${key===f?'aria-current="true"':''}>${label}</a>`).join('')}</div><div class="rt-v96-entries">${listed.map(rt96ProgressLine).join('')||empty('Nenhuma aplicação neste filtro','Experimente outro filtro ou atribua um novo instrumento.')}</div></section>`;
 }else{
   const selectedId=rt96Params().get('result'),chosen=responded.find(t=>t.id===selectedId)||responded[responded.length-1];
   content=`<section class="rt-v96-surface"><div class="rt-v96-section-title"><div><h2>Resultados por cliente</h2><p>Selecione uma resposta para visualizar gráficos e elaborar a devolutiva.</p></div><a class="btn-secondary" href="#graficos-relatorios">Abrir central de relatórios →</a></div>${responded.length?`<div class="rt-v96-result-picker">${responded.slice().reverse().map(t=>`<a href="${rt96Href('resultados','result='+encodeURIComponent(t.id))}" class="rt-v96-result-choice" ${chosen?.id===t.id?'aria-current="true"':''}><span>${discTaskLabel(t)}</span><small>${new Date(t.completedAt||t.assignedAt).toLocaleDateString('pt-BR')}</small></a>`).join('')}</div>`:empty('Nenhum resultado disponível','A resposta aparece aqui depois que o participante conclui a atividade.')}</section>`;
   if(chosen){const p=program(chosen.programId);content+=`<section class="rt-v96-surface rt-v96-results"><div class="rt-v96-section-title"><div><span class="rt-v96-kicker">${esc(clientOf(p))}</span><h2>Distribuição das respostas</h2><p>Gráficos ilustrativos dos quatro fatores — ${esc(p?.goal||'processo')}</p></div><a class="rt-v96-inline" href="${wsUrl(p.clientId,'resultados',p.id)}">Abrir no cliente →</a></div><div class="rt-v81-analysis"><div class="rt-v81-bars">${['D','I','S','C'].map(k=>`<div class="rt-v81-factor"><div><strong>${k} · ${discNames[k]}</strong><span>${Number(chosen.scores[k])||0} de 20</span></div><div class="rt-v81-track"><span style="width:${Math.max(0,Math.min(100,Number(chosen.scores[k])*5))}%"></span></div></div>`).join('')}</div>${discRadar(chosen.scores)}</div><div class="rt-v96-feedback"><div><h3>Devolutiva profissional</h3><p>${esc(chosen.feedback||'Ainda não foi preparada uma devolutiva.')}</p><small>${chosen.feedbackVisibility==='compartilhado'?'Compartilhada na Minha Jornada':'Acesso restrito ao profissional'}</small></div><div class="rt-v96-entry-actions">${btn(chosen.feedback?'Editar devolutiva':'Redigir devolutiva','disc-feedback',chosen.id,'btn-primary')}${chosen.feedback?btn(chosen.feedbackVisibility==='compartilhado'?'Restringir':'Compartilhar','toggle-disc-feedback',chosen.id,'btn-secondary'):''}</div></div></section>`;}
   content+=`<p class="rt-v96-note">Os números descrevem respostas ao instrumento educativo; não representam diagnóstico, teste psicológico validado ou medida clínica.</p>`;
 }
 return head('RECURSOS · METODOLOGIAS','Ferramentas','Aplique instrumentos, acompanhe respostas e consulte resultados sem sair do ambiente profissional.')+choice+
 `<section class="rt-v96-hero"><div class="rt-v96-icon" aria-hidden="true">◇</div><div><span class="rt-v96-kicker">INSTRUMENTO DISPONÍVEL</span><h2>DISC / ACER</h2><p>Mapeamento comportamental educativo vinculado aos processos de desenvolvimento.</p></div><span class="rt-v96-status">Disponível</span></section>`+tabs+`<div class="rt-v96-content">${content}</div>`+
 `<section class="rt-v96-more"><div class="rt-v96-section-title"><div><h2>Outros recursos</h2><p>Instrumentos complementares sem duplicar a Biblioteca.</p></div></div><div class="rt-v96-resource-grid"><article class="rt-v96-resource"><span>✧</span><h3>Reflexão guiada</h3><p>Atribua um exercício de reflexão ao processo do cliente.</p>${btn('Atribuir reflexão','new-instrument','','btn-secondary')}</article><article class="rt-v96-resource"><span>◈</span><h3>Communication Lab</h3><p>Exercícios de comunicação disponíveis na Biblioteca.</p><a class="btn-secondary" href="#biblioteca?view=laboratorio">Abrir Communication Lab →</a></article></div></section>`+
 `<p class="rt-v96-note">Uso educativo. O RealTalent não fornece comprovação de validação psicométrica do DISC/ACER, nem autoriza seu uso como teste psicológico regulamentado.</p>`;
}
function showSettings(){const role=db.professionalRole==='consultor'?'consultor':'psicologo';return head('ÁREA PROFISSIONAL','Configurações','Os dois perfis usam o mesmo workspace, com informações adaptadas à atuação declarada. Esta seleção local não é verificação profissional.')+badgeWarn+`<div class="grid2"><div class="card"><h2>Qual experiência deseja demonstrar?</h2><div class="role-cards"><button type="button" data-act="set-role" data-id="psicologo" class="role-card ${role==='psicologo'?'selected':''}"><strong>Psicólogo(a)</strong><span>Atuação profissional em Psicologia, com exigências técnicas e éticas próprias.</span></button><button type="button" data-act="set-role" data-id="consultor" class="role-card ${role==='consultor'?'selected':''}"><strong>Consultor(a)</strong><span>Desenvolvimento, mentoria e coaching, dentro da qualificação profissional.</span></button></div></div><div class="card"><h2>Limites e responsabilidades</h2><p class="inline-note">Nenhuma escolha aqui habilita testes psicológicos, avaliações reguladas, diagnósticos ou armazenamento de registros profissionais. Instrumentos específicos exigem análise de habilitação, adequação e regulamentação antes de serem disponibilizados.</p><a class="row-link" href="#diretrizes">Consultar diretrizes →</a></div></div>`;}
function showPolicy(){return head('PROPÓSITO & LIMITES','Diretrizes profissionais','O RealTalent oferece apoio à organização do trabalho, sem substituir julgamento técnico, ética e responsabilidade profissional.')+
 `<div class="warning"><strong>Esta versão é um protótipo local, não um prontuário ou ambiente clínico.</strong>Não insira nomes reais, informações de saúde, históricos de atendimento ou registros sigilosos. Há apenas armazenamento local não protegido; não há autenticação, criptografia de registros, segregação de usuários ou controle de acesso profissional nesta demonstração.</div>
 <div class="policy-grid"><section class="card"><div class="eyebrow">01 · MISSÃO</div><h2>Desenvolvimento humano com responsabilidade</h2><p>Organizar sessões, objetivos e recursos para profissionais da Psicologia ou consultoria, respeitando a habilitação e os limites de cada atividade.</p></section>
 <section class="card"><div class="eyebrow">02 · AUTONOMIA</div><h2>O profissional decide</h2><p>Não automatizar intervenções, identificação de perfil, prognósticos ou decisões de RH. Recursos são de apoio e interpretação contextual.</p></section>
 <section class="card"><div class="eyebrow">03 · DIFERENCIAÇÃO</div><h2>Coaching não é diagnóstico</h2><p>Coaching, psicoterapia e avaliação psicológica têm finalidades e exigências próprias. A plataforma não deve confundi-las.</p></section>
 <section class="card"><div class="eyebrow">04 · CONFIDENCIALIDADE</div><h2>Proteção de dados como requisito</h2><p>Uma versão apta a dados reais exigirá autenticação, segregação por profissional, autorização, auditoria, consentimentos e políticas de retenção e exclusão.</p></section>
 <section class="card"><div class="eyebrow">05 · METODOLOGIA</div><h2>DISC/ACER como recurso educacional</h2><p>O instrumento atual não possui comprovação psicométrica apresentada neste pacote. Não deve ser descrito como teste psicológico validado.</p></section>
 <section class="card"><div class="eyebrow">06 · EVOLUÇÃO</div><h2>Roadmap técnico seguro</h2><p>Próximos passos: login profissional, banco protegido com RLS, gestão de organizações, políticas de acesso, logs, exportação controlada e implantação piloto revisada.</p></section></div>`;}
function inp(n,label,val='',type='text',required=true,extra=''){return `<div class="form-field"><label for="f-${n}">${label}</label><input id="f-${n}" name="${n}" type="${type}" ${required?'required':''} ${extra} value="${esc(val)}" /></div>`;}
function textArea(n,label,val='',max=250){return `<div class="form-field"><label for="f-${n}">${label}</label><textarea id="f-${n}" name="${n}" required maxlength="${max}">${esc(val)}</textarea></div>`;}
function sel(n,label,opts,selected=''){return `<div class="form-field"><label for="f-${n}">${label}</label><select id="f-${n}" name="${n}" required>${opts.map(o=>`<option value="${esc(o[0])}" ${o[0]===selected?'selected':''}>${esc(o[1])}</option>`).join('')}</select></div>`;}
const pgOpts=()=>db.programs.filter(x=>x.status!=='finalizado').map(p=>[p.id,`${clientOf(p)} — ${p.goal}`]);
const goalOptions=pid=>RTDemoStore.goalsOf(db,pid).map(g=>[g.id,g.title]);

function openModal(kind,id,preferredGoal=''){
 if(kind==='new-action'&&!pgOpts().length){toast('Crie primeiro um processo de desenvolvimento ativo.');location.hash='#processos';return;}
 if(kind==='new-session'&&!pgOpts().length){toast('Crie primeiro um processo de desenvolvimento ativo.');location.hash='#clientes';return;}
 if(kind==='new-process'&&!db.clients.length){toast('Cadastre primeiro um cliente fictício.');openModal('new-client','');return;}
 const m=$('#modal');const field=$('#modal-fields');const form=$('#modal-form');let name='';let html='';let save='Salvar';
 switch(kind){
  case 'new-client':name='Cadastrar cliente fictício';html='<p class="inline-note">Cadastre apenas o essencial. O processo pode ser criado depois. Não utilize dados pessoais reais.</p>'+inp('name','Identificação fictícia','','text',true,'maxlength="70" placeholder="Ex.: Cliente demonstrativo 04"')+inp('focus','Objetivo inicial (opcional)','','text',false,'maxlength="140"')+sel('contact','Modalidade',[['Atendimento individual','Atendimento individual'],['Grupo demonstrativo','Grupo demonstrativo'],['A definir','A definir']]);break;
  case 'edit-client':{const c=client(id);if(!c)return;name='Editar cliente demonstrativo';html='<p class="inline-note">Atualize dados fictícios. Pausar, encerrar ou arquivar mantém o histórico local existente.</p>'+inp('name','Identificação fictícia',c.name,'text',true,'maxlength="70"')+inp('focus','Objetivo inicial (opcional)',c.focus||'','text',false,'maxlength="140"')+sel('contact','Modalidade',[['Atendimento individual','Atendimento individual'],['Grupo demonstrativo','Grupo demonstrativo'],['A definir','A definir']],c.contact||'A definir')+sel('status','Situação do cliente',clientStates.map(([k,v])=>[k,v]),c.status||'ativo');break;}
  case 'new-process':name='Novo processo de desenvolvimento';html=sel('clientId','Cliente',db.clients.map(c=>[c.id,c.name]),id||'')+textArea('goal','Objetivo de desenvolvimento acordado')+sel('stage','Etapa inicial',[['Acordo inicial','Acordo inicial'],['Avaliação inicial','Avaliação inicial'],['Exploração de objetivos','Exploração de objetivos'],['Plano de ação','Plano de ação'],['Revisão','Revisão']]);break;
  case 'new-goal':name='Novo objetivo do processo';html='<p class="inline-note">Defina um objetivo observável. Não é medida automática de evolução psicológica.</p>'+inp('title','Objetivo combinado','','text',true,'maxlength="160"');break;
  case 'edit-goal':{const g=db.goals.find(x=>x.id===id);if(!g||program(g.programId)?.status==='finalizado')return;name='Editar objetivo acordado';html='<p class="inline-note">Atualizar o texto mantém os compromissos já relacionados a este objetivo.</p>'+inp('title','Objetivo combinado',g.title,'text',true,'maxlength="160"');save='Salvar objetivo';break;}
  case 'new-session':name='Agendar sessão';html=sel('programId','Processo',pgOpts(),id||'')+inp('date','Data',plus(1),'date')+inp('time','Horário','10:00','time')+inp('focus','Objetivo ou pauta INTERNA do profissional','Revisar objetivos','text',true,'maxlength="150"')+inp('clientTopic','Título visível ao participante','Encontro de acompanhamento','text',true,'maxlength="100"')+sel('visibility','Compartilhar horário?', [['compartilhado','Sim, mostrar na Minha Jornada'],['privado','Não, apenas no workspace']]);break;
  case 'edit-action':{const a=db.actions.find(x=>x.id===id);if(!a)return;name='Editar ação do plano';html='<p class="inline-note">Edite o compromisso demonstrativo e seu prazo. O compartilhamento com Minha Jornada é explícito.</p>'+textArea('title','Ação concreta acordada',a.title,500)+inp('due','Prazo',a.due||plus(7),'date')+sel('resource','Recurso de apoio',[['Nenhum','Nenhum'],['Biblioteca DISC/ACER','Biblioteca DISC/ACER'],['Communication Lab','Communication Lab'],['Plano de desenvolvimento','Plano de desenvolvimento']],a.resource||'Nenhum')+sel('goalId','Objetivo relacionado',goalOptions(a.programId),a.goalId||'')+sel('visibility','Disponibilidade',[['privado','Somente profissional (interna)'],['compartilhado','Mostrar na Minha Jornada']],a.visibility||'privado');save='Salvar alterações';break;}
  case 'new-session-action':{
    const s=db.sessions.find(s=>s.id===id),p=program(s?.programId);if(!p)return;
    name='Acordo do encontro';
    html='<p class="inline-note">Compromisso do processo associado a esta sessão. Compartilhar é uma decisão explícita.</p>'+
      `<p class="rt-v910-modal-context"><strong>${esc(p.goal)}</strong><br>${dateFmt(s.date)} · ${esc(s.clientTopic||'Encontro')}</p>`+
      sel('goalId','Objetivo relacionado',goalOptions(p.id),goalOptions(p.id)?.[0]?.[0]||'')+
      textArea('title','Compromisso acordado', '',500)+inp('due','Prazo combinado',plus(7),'date')+
      sel('visibility','Disponibilidade',[['privado','Somente profissional (padrão)'],['compartilhado','Mostrar na Minha Jornada']]);
    save='Criar compromisso';break;
  }
  case 'edit-session-recap':{
    const s=db.sessions.find(s=>s.id===id);if(!s||s.status!=='concluida')return;
    name='Resumo compartilhável do encontro';
    html='<p class="inline-note">Não copie registros internos ou informações clínicas. O resumo é privado por padrão, e só aparece na Minha Jornada quando o encontro é compartilhado.</p>'+
      textArea('clientRecap','Acordos e orientações para o participante',s.clientRecap||'',800)+
      sel('recapVisibility','Disponibilizar resumo',[['privado','Manter restrito (padrão)'],['compartilhado','Compartilhar na Minha Jornada']],s.recapVisibility||'privado');
    break;
  }
  case 'new-action':{const pid=pgOpts().some(x=>x[0]===id)?id:pgOpts()[0]?.[0]||'';const gs=goalOptions(pid);const selected=gs.some(g=>g[0]===preferredGoal)?preferredGoal:gs.some(g=>g[0]===ws94Query().get('goal'))?ws94Query().get('goal'):gs[0]?.[0]||'';name='Criar ação de desenvolvimento';html='<p class="inline-note">O compromisso é privado por padrão. Escolha o objetivo e compartilhe apenas quando desejar.</p>'+sel('programId','Processo',pgOpts(),pid)+sel('goalId','Objetivo relacionado',gs,selected)+textArea('title','Ação concreta acordada')+inp('due','Prazo',plus(7),'date')+sel('resource','Recurso de apoio',[['Nenhum','Nenhum'],['Biblioteca DISC/ACER','Biblioteca DISC/ACER'],['Communication Lab','Communication Lab'],['Plano de desenvolvimento','Plano de desenvolvimento']])+sel('visibility','Disponibilidade',[['privado','Somente profissional (padrão)'],['compartilhado','Compartilhar na Minha Jornada']]);break;}
  case 'new-disc':name='Atribuir mapeamento DISC/ACER';html='<p class="inline-note">Questionário educativo original de 20 perguntas. O participante verá a atividade após o compartilhamento explícito.</p>'+sel('programId','Processo do cliente',pgOpts(),id||'')+sel('visibility','Disponibilização',[['privado','Manter rascunho interno'],['compartilhado','Liberar na Minha Jornada']]);break;
  case 'disc-feedback':{const t=db.discAssignments.find(x=>x.id===id&&x.status==='respondido');if(!t)return;name='Devolutiva DISC/ACER';html='<p class="inline-note">A devolutiva é privada por padrão. Evite diagnósticos e interpretações sem respaldo.</p>'+textArea('feedback','Comentário profissional',t.feedback||'',1600)+sel('feedbackVisibility','Disponibilizar ao participante?', [['privado','Não, manter privado'],['compartilhado','Sim, compartilhar devolutiva']],t.feedbackVisibility||'privado');break;}
  case 'new-instrument':{const pid=pgOpts().some(p=>p[0]===id)?id:pgOpts()[0]?.[0]||'';if(!pid){toast('Crie primeiro um processo de desenvolvimento ativo.');return;}name='Atribuir reflexão guiada';html='<p class="inline-note">Vincule a atividade a um objetivo do processo. Privada por padrão; não é avaliação psicológica.</p>'+sel('programId','Processo de desenvolvimento',pgOpts(),pid)+sel('goalId','Objetivo relacionado',goalOptions(pid))+inp('title','Título da atividade','Meu estilo de comunicação','text',true,'maxlength="110"')+textArea('instructions','Orientação ao participante')+sel('visibility','Disponibilização',[['privado','Manter como rascunho interno (padrão)'],['compartilhado','Liberar para Minha Jornada']]);break;}
  case 'review-instrument':{const i=db.instruments.find(x=>x.id===id);if(!i||!i.responses)return;name='Revisar resposta';html='<p class="inline-note">Uma devolutiva só aparecerá no portal se for expressamente liberada. Evite interpretações automáticas.</p>'+textArea('feedback','Devolutiva contextualizada',i.feedback||'')+sel('feedbackVisibility','Visibilidade da devolutiva',[['privado','Somente para profissional'],['compartilhado','Liberar no portal']],i.feedbackVisibility||'privado');break;}
  case 'new-guidance':name='Compartilhar orientação com o cliente';html='<p class="inline-note">Esta orientação será visível no portal do cliente deste processo. Use somente dados inventados.</p>'+sel('goalId','Objetivo relacionado',goalOptions(id),goalOptions(id)?.[0]?.[0]||'')+textArea('text','Orientação compartilhada');break;
  case 'edit-stage':name='Atualizar etapa do processo';html=sel('stage','Etapa',[['Acordo inicial','Acordo inicial'],['Avaliação inicial','Avaliação inicial'],['Exploração de objetivos','Exploração de objetivos'],['Plano de ação','Plano de ação'],['Revisão','Revisão']],program(id)?.stage);break;
  case 'close-session':name='Concluir sessão demonstrativa';html='<p class="inline-note">Registre somente um acordo fictício e não clínico. O registro permanece somente no armazenamento local deste navegador e não aparece no portal do cliente.</p>'+textArea('summary','Síntese de ações combinadas');save='Concluir';break;
  default:return;
 }
 $('#modal-title').textContent=name;field.innerHTML=html;$('#modal-save').textContent=save;form.dataset.kind=kind;form.dataset.id=id||'';m.showModal();
 const first=field.querySelector('input,select,textarea');if(first)first.focus();
}
function saveModal(e){e.preventDefault();let f=e.target;let d=new FormData(f);let get=n=>(d.get(n)||'').toString().trim();let kind=f.dataset.kind,id=f.dataset.id;
 if(kind==='new-client'){db.clients.push({id:newid('c'),name:get('name'),focus:get('focus'),status:'ativo',contact:get('contact'),created:today(),updatedAt:today()});location.hash=wsUrl(db.clients[db.clients.length-1].id);}
 if(kind==='edit-client'){const c=client(id);if(c){c.name=get('name').slice(0,70);c.focus=get('focus').slice(0,140);c.contact=get('contact');c.status=clientStates.some(x=>x[0]===get('status'))?get('status'):'ativo';c.updatedAt=today();}}
 if(kind==='new-process'){db.programs.push({id:newid('p'),clientId:get('clientId'),goal:get('goal'),stage:get('stage'),status:'em andamento',start:today()});location.hash=wsUrl(get('clientId'),'geral',db.programs[db.programs.length-1].id);}
 if(kind==='new-goal'){if(!RTDemoStore.createGoal(db,id,get('title'))){toast('Objetivo inválido.');return;}location.hash=wsUrl(program(id)?.clientId||'','desenvolvimento',id);}
 if(kind==='edit-goal'){if(!RTDemoStore.updateGoal(db,id,get('title'))){toast('Objetivo inválido ou processo encerrado.');return;}}
 if(kind==='new-session'){const p=program(get('programId'));if(!p||p.status==='finalizado'){toast('Escolha um processo de desenvolvimento ativo.');return;}const s={id:newid('s'),programId:p.id,date:get('date'),time:get('time'),focus:get('focus'),status:'agendada',summary:'',clientTopic:get('clientTopic'),visibility:get('visibility')};db.sessions.push(s);location.hash=wsUrl(p.clientId,'sessoes',p.id,'session='+encodeURIComponent(s.id)+'&moment=antes');}
 if(kind==='new-session-action'){
   const a=RTDemoStore.createSessionAgreement(db,id,{title:get('title'),goalId:get('goalId'),due:get('due'),visibility:get('visibility')});
   if(!a){toast('Informe um objetivo, compromisso e prazo válidos.');return;}
   const s=db.sessions.find(s=>s.id===id),p=program(s?.programId);
   if(p)location.hash=wsUrl(p.clientId,'sessoes',p.id,'session='+encodeURIComponent(id)+(ws94Query().get('moment')?'&moment='+encodeURIComponent(ws94Query().get('moment')):''));
 }
 if(kind==='edit-session-recap'){
   if(!RTDemoStore.updateSessionRecap(db,id,get('clientRecap'),get('recapVisibility'))){toast('Não foi possível salvar o resumo.');return;}
   const s=db.sessions.find(s=>s.id===id),p=program(s?.programId);
   if(p)location.hash=wsUrl(p.clientId,'sessoes',p.id,'session='+encodeURIComponent(id)+(ws94Query().get('moment')?'&moment='+encodeURIComponent(ws94Query().get('moment')):''));
 }
 if(kind==='new-action'){const onBoard=location.hash.startsWith('#plano-acao');const p=program(get('programId')),g=db.goals.find(x=>x.id===get('goalId')&&x.programId===p?.id),title=get('title');if(!p||p.status==='finalizado'||!g||title.length<4||!get('due')){toast('Selecione um processo e objetivo válidos, com compromisso e prazo.');return;}db.actions.push({id:newid('a'),programId:p.id,goalId:g.id,title:title.slice(0,500),due:get('due'),resource:get('resource'),status:'pendente',visibility:get('visibility')==='compartilhado'?'compartilhado':'privado',createdAt:new Date().toISOString()});if(!onBoard)location.hash=wsUrl(p.clientId,'desenvolvimento',p.id,'view=pendentes&goal='+encodeURIComponent(g.id));else location.hash='#plano-acao?filter=abertas&program='+encodeURIComponent(p.id);}
 if(kind==='edit-action'){const a=db.actions.find(x=>x.id===id);if(a){a.title=get('title').slice(0,500);a.due=get('due');a.resource=get('resource');RTDemoStore.linkActionGoal(db,a.id,get('goalId'));a.visibility=get('visibility')==='compartilhado'?'compartilhado':'privado';a.updatedAt=new Date().toISOString();}}
 if(kind==='new-disc'){if(!RTDemoStore.assignDisc(db,get('programId'),get('visibility'))){toast('Já existe um questionário pendente neste processo.');return;}location.hash=location.hash.startsWith('#ferramentas')?rt96Href('aplicacoes'):wsUrl(program(get('programId'))?.clientId||'', 'atividades',get('programId'));}
 if(kind==='disc-feedback'){const t=db.discAssignments.find(x=>x.id===id&&x.status==='respondido');if(t){t.feedback=get('feedback').slice(0,1600);t.feedbackVisibility=t.feedback&&get('feedbackVisibility')==='compartilhado'?'compartilhado':'privado';}location.hash=location.hash.startsWith('#ferramentas')?rt96Href('resultados','result='+encodeURIComponent(id)):wsUrl(program(t?.programId)?.clientId||'', 'resultados',t?.programId||'');}
 if(kind==='new-instrument'){const i=RTDemoStore.assignGuidedActivity(db,{programId:get('programId'),goalId:get('goalId'),title:get('title'),instructions:get('instructions'),visibility:get('visibility')});if(!i){toast('Selecione um processo ativo, um objetivo e um título válidos.');return;}location.hash=wsUrl(program(i.programId).clientId,'atividades',i.programId);}
 if(kind==='review-instrument'){const i=db.instruments.find(x=>x.id===id);if(!RTDemoStore.reviewGuidedActivity(db,id,get('feedback'),get('feedbackVisibility'))){toast('Devolutiva inválida ou atividade sem resposta.');return;}location.hash=wsUrl(program(i.programId).clientId,'atividades',i.programId);}
 if(kind==='new-guidance'){db.guidance.push({id:RTDemoStore.freshId('g'),programId:id,goalId:db.goals.find(g=>g.id===get('goalId')&&g.programId===id)?.id||null,text:get('text'),visibility:'compartilhado',created:today()});location.hash=wsUrl(program(id)?.clientId||'', 'desenvolvimento',id);}
 if(kind==='edit-stage'){let p=program(id);if(p)p.stage=get('stage');}
 if(kind==='close-session'){let s=db.sessions.find(x=>x.id===id);if(s){s.status='concluida';s.summary=get('summary');s.completedAt=new Date().toISOString();}}
 persist('profissional',kind,id);$('#modal').close();render();toast('Alteração salva neste navegador · demonstração local.');
}
let toastTimer;function toast(t){let el=$('#toast');el.textContent=t;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3600)}
function render(){
 const raw=decodeURIComponent(location.hash.slice(1)||'inicio');const key=raw.split(/[=?&]/)[0];
 const cid=key==='cliente'?(raw.split('&')[0].split('=')[1]||''):'';
 const legacyRoutes={agenda:'sessoes',instrumentos:'ferramentas',mapeamento:'ferramentas',relatorios:'graficos-relatorios','plano-disc':'plano-acao',planos:'plano-desenvolvimento',diretrizes:'configuracoes'};
 if(legacyRoutes[key]){location.replace('#'+legacyRoutes[key]);return;}
 if(key==='processo'){const p=program(raw.split('=')[1]);if(p){location.replace(wsUrl(p.clientId,'geral',p.id));return;}}
 if(key==='sessao'){const s=db.sessions.find(x=>x.id===raw.split('=')[1]);const p=program(s?.programId);if(p){location.replace(wsUrl(p.clientId,'sessoes',p.id,'session='+encodeURIComponent(s.id)));return;}}
 const page=pages[key]?key:(key==='cliente'?'cliente':'inicio');
 const views={inicio:showHome,clientes:showClients,processos:showProcesses,'atividades-guiadas':showGuidedActivities,'graficos-relatorios':showDiscReports,sessoes:showAgenda,'plano-desenvolvimento':showDevelopmentPlans,'plano-acao':showActionPlan,ferramentas:showInstrumentsCenter,biblioteca:showTools,configuracoes:()=>showSettings()+`<div class="rt-v9-settings-actions">${btn('Restaurar dados fictícios','reset','','btn-secondary')}</div><details class="card rt-v9-legacy"><summary>Diretrizes profissionais e limites de uso</summary>${showPolicy()}</details>`};
 let output=views[page]?.();
 if(page==='cliente')output=showClientWorkspace(cid,new URLSearchParams(raw.slice(raw.indexOf('&')+1)).get('tab')||'geral',new URLSearchParams(raw.slice(raw.indexOf('&')+1)).get('program')||'',new URLSearchParams(raw.slice(raw.indexOf('&')+1)).get('session')||'');
 $('#content').innerHTML='<div class="demo-strip"><strong>Modo demonstrativo</strong> · Somente dados fictícios neste navegador. Não há autenticação nem proteção para uso profissional real.</div>'+(output||showHome());
 $('#crumb').textContent=page==='cliente'?`Clientes / ${client(cid)?.name||'Cliente'}`:(pages[page]||'Visão geral');
 const sessionId=page==='cliente'?ws94Query().get('session'):rt96Params().get('session');
 const useTimer=page==='ferramentas'&&rt96Params().get('tab')==='temporizador'||
   page==='cliente'&&ws94Query().get('tab')==='sessoes'&&ws94Query().get('moment')==='durante';
 if(useTimer)RTSessionAssist.armTimerSession(RTSessionAssist.choose(db,sessionId||'',today()).s);
 else RTSessionAssist.armTimerSession(null);
 document.querySelectorAll('[data-page]').forEach(a=>{const active=a.dataset.page===(page==='cliente'?'clientes':page);a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $('#side').classList.remove('open');$('#shade').classList.remove('open');$('#menu-btn').setAttribute('aria-expanded','false');
}
function runAction(act,id){
   if(act==='rt-v913-toggle-question'){
     if(!RTSessionAssist.questions.some(q=>q.id===id))return;
     const activeId=location.hash.startsWith('#cliente=')?ws94Query().get('session'):rt96Params().get('session');
     const s=RTSessionAssist.choose(db,activeId||'',today()).s;
     if(!s)return;
     const selected=(s.coachingQuestionIds||[]).slice();
     const next=selected.includes(id)?selected.filter(x=>x!==id):selected.concat(id);
     if(next.length>12){toast('Selecione no máximo 12 perguntas por sessão.');return;}
     if(!RTDemoStore.setSessionQuestionIds(db,s.id,next)){toast('Seleção inválida para esta sessão.');return;}
     persist('profissional','select-coaching-question',s.id);
     if(!location.hash.startsWith('#cliente='))location.hash=rt96Href('perguntas','session='+encodeURIComponent(s.id)+'&phase='+encodeURIComponent(rt96Params().get('phase')||'todas'));
     render();toast(next.includes(id)?'Pergunta associada à sessão.':'Pergunta removida da sessão.');
     return;
   }
   if(act==='rt-v913-timer'){
     const activeId=location.hash.startsWith('#cliente=')?ws94Query().get('session'):rt96Params().get('session');
     const s=RTSessionAssist.choose(db,activeId||'',today()).s;
     if(s&&RTSessionAssist.timerCommand(s,id)){render();}
     return;
   }
   if(act==='rt-v912-wheel-delete'){
     const pid=rt96Params().get('program')||db.programs.find(p=>p.status==='em andamento')?.id||db.programs[0]?.id;
     if(!db.wheelAssessments?.some(x=>x.id===id&&x.programId===pid))return;
     if(!confirm('Excluir este registro fictício da Roda da Vida? Esta ação não pode ser desfeita.'))return;
     if(RTDemoStore.deleteWheelSnapshot(db,id,pid)){persist('profissional','delete-wheel',id);render();toast('Registro demonstrativo excluído.');}
     return;
   }
   if(act==='select-disc'){window.rtDiscSelected=id;render();return;}
   if(act==='cancel-disc'){
     const t=db.discAssignments.find(x=>x.id===id&&x.status==='atribuido');
     if(!t)return;
     if(!confirm('Cancelar esta aplicação demonstrativa? O participante perderá o acesso; o histórico da atribuição será preservado.'))return;
     if(RTDemoStore.cancelDisc(db,id)){persist('profissional','cancel-disc',id);render();toast('Aplicação cancelada. É possível atribuir novamente ao processo.');}
     return;
   }
   if(act==='toggle-disc'){const t=db.discAssignments.find(x=>x.id===id&&x.status==='atribuido');if(t){t.visibility=t.visibility==='compartilhado'?'privado':'compartilhado';persist('profissional',act,id);render();}return;}
   if(act==='toggle-disc-feedback'){const t=db.discAssignments.find(x=>x.id===id&&x.feedback);if(t){t.feedbackVisibility=t.feedbackVisibility==='compartilhado'?'privado':'compartilhado';persist('profissional',act,id);render();}return;}
   if(act==='unlink-disc'){
     if(!confirm('Desvincular este mapeamento fictício do processo?'))return;
     db.discLinks=db.discLinks.filter(x=>x.id!==id);persist('profissional',act,id);render();toast('Associação demonstrativa removida.');return;
   }

 if(act==='go'){location.hash=({'agenda':'#sessoes','instrumentos':'#atividades-guiadas','mapeamento':'#atividades-guiadas','relatorios':'#graficos-relatorios','planos':'#plano-desenvolvimento','plano-disc':'#plano-acao','ferramentas':'#ferramentas','diretrizes':'#configuracoes'}[id]||'#'+id);return;}
 if(act==='set-role'&&['consultor','psicologo'].includes(id)){db.professionalRole=id;persist('profissional','set-role',id);render();toast('Perfil demonstrativo atualizado.');return;}
 if(act==='client-detail'){location.hash=wsUrl(id);return;}
 if(act==='process-detail'){const p=program(id);if(p)location.hash=wsUrl(p.clientId,'geral',p.id);return;}
 if(act==='session-detail'){const s=db.sessions.find(x=>x.id===id),p=program(s?.programId);if(p)location.hash=wsUrl(p.clientId,'sessoes',p.id,'session='+encodeURIComponent(id));return;}
 if(act==='new-process-for'){openModal('new-process',id);return;}
 if(act==='new-session-for'){openModal('new-session',id);return;}
 if(act==='new-action-for'){openModal('new-action',id);return;}
 if(act==='new-action-goal'){const g=db.goals.find(x=>x.id===id);if(g)openModal('new-action',g.programId,g.id);return;}
 if(['new-client','edit-client','new-process','new-goal','edit-goal','new-session','new-action','edit-action','edit-stage','close-session','new-guidance','new-instrument','review-instrument','new-disc','disc-feedback','new-session-action','edit-session-recap'].includes(act)){openModal(act,id);return;}
 if(act==='toggle-instrument'){const i=db.instruments.find(x=>x.id===id);if(i){i.visibility=i.visibility==='compartilhado'?'privado':'compartilhado';persist('profissional',act,id);render();toast('Compartilhamento atualizado (somente nesta demonstração).')}return;}
 if(act==='new-instrument-for'){openModal('new-instrument',id);return;}
 if(act==='toggle-share-action'){let x=db.actions.find(a=>a.id===id);if(x){x.visibility=x.visibility==='privado'?'compartilhado':'privado';persist('profissional',act,id);render();toast('Visibilidade atualizada na demonstração.')}return;}
 if(act==='toggle-action'){let x=db.actions.find(a=>a.id===id);if(x){x.status=x.status==='pendente'?'concluido':'pendente';x.completedAt=x.status==='concluido'?new Date().toISOString():null;persist('profissional',act,id);render();toast('Atividade atualizada no navegador.')}return;}
 if(act==='finish-process'||act==='reopen-process'){let p=program(id);if(p){p.status=act==='finish-process'?'finalizado':'em andamento';persist('profissional',act,id);render();toast('Processo atualizado no navegador.')}return;}
 if(act==='reset'){if(window.confirm('Reiniciar todos os dados fictícios desta demonstração?')){db=RTDemoStore.reset();location.hash='#inicio';render();toast('Dados fictícios restaurados neste navegador.')}return;}
}
document.addEventListener('submit',e=>{
 const f=e.target.closest('#rt-v914-live-form');if(!f)return;
 e.preventDefault();
 const data=new FormData(f),sid=String(data.get('sessionId')||''),notes=String(data.get('liveNotes')||'');
 const focused=db.sessions.find(x=>x.id===sid);
 if(!focused||!location.hash.startsWith('#cliente=')||ws94Query().get('session')!==sid){toast('Abra a sessão correta para salvar.');return;}
 if(!RTDemoStore.updateSessionLiveNotes(db,sid,notes)){toast('Notas inválidas ou excedem 1.600 caracteres.');return;}
 persist('profissional','save-session-live-notes',sid);render();toast('Anotações internas salvas nesta demonstração.');
});
document.addEventListener('submit',e=>{
 const f=e.target.closest('#rt-v913-timer-form');if(!f)return;
 e.preventDefault();const data=new FormData(f),sid=String(data.get('sessionId')||'');
 const ids=['abertura','exploracao','pratica','fechamento'];
 const plan=ids.map(id=>({id,label:String(data.get('label-'+id)||''),minutes:Number(data.get('minutes-'+id))}));
 if(!RTDemoStore.setSessionTimerPlan(db,sid,plan)){toast('Verifique os tempos (1–90 min; até 240 min no total) e os nomes das etapas.');return;}
 persist('profissional','configure-session-timer',sid);
 const s=db.sessions.find(x=>x.id===sid);
 if(s)RTSessionAssist.timerCommand(s,'reset');
 if(!location.hash.startsWith('#cliente='))location.hash=rt96Href('temporizador','session='+encodeURIComponent(sid));render();
 toast('Etapas salvas. Temporizador reiniciado nesta aba.');
});
document.addEventListener('submit',e=>{
 const f=e.target.closest('#rt-v912-wheel-form');if(!f)return;
 e.preventDefault();
 const data=new FormData(f),areas=[];
 for(let i=0;i<10;i++){
  if(data.get('name-'+i)===null)break;
  areas.push({name:data.get('name-'+i),score:data.get('score-'+i)});
 }
 const saved=RTDemoStore.createWheelSnapshot(db,String(data.get('programId')||''),{areas,date:String(data.get('date')||''),note:data.get('note')});
 if(!saved){toast('Confira as dimensões, as notas de 0 a 10 e a data da reflexão.');return;}
 persist('profissional','save-wheel',saved.id);
 location.hash=rt96Href('roda','program='+encodeURIComponent(saved.programId));
 render();toast('Roda da Vida salva no histórico demonstrativo.');
});
document.addEventListener('submit',e=>{
 const f=e.target.closest('#rt-v912-five-form');if(!f)return;
 e.preventDefault();
 const data=new FormData(f),programId=String(data.get('programId')||''),actionId=String(data.get('actionId')||'');
 const input={goalId:data.get('goalId')};
 for(const key of ['what','why','where','when','who','how','howMuch'])input[key]=String(data.get(key)||'');
 const saved=RTDemoStore.upsertFiveWTwoH(db,programId,input,actionId);
 if(!saved){toast('Confira o objetivo, o prazo e os campos obrigatórios da Matriz 5W2H.');return;}
 persist('profissional','save-5w2h',saved.id);
 location.hash=rt96Href('5w2h','program='+encodeURIComponent(programId)+'&action='+encodeURIComponent(saved.id));
 render();toast('Matriz integrada ao Plano de Ação demonstrativo.');
});
document.addEventListener('submit',e=>{
 const f=e.target.closest('#rt-v911-prep-form');if(!f)return;
 e.preventDefault();
 const data=new FormData(f),sessionId=String(data.get('sessionId')||'');
 const input={goal:data.get('goal'),reality:data.get('reality'),options:data.get('options'),wayForward:data.get('wayForward')};
 if(!RTDemoStore.updateSessionPreparation(db,sessionId,input)){toast('Sessão não encontrada.');return;}
 persist('profissional','save-session-preparation',sessionId);
 render();toast('Preparação interna salva somente nesta demonstração.');
});
document.addEventListener('submit',e=>{
 const f=e.target.closest('#rt-v96-assign-disc');if(!f)return;
 e.preventDefault();const data=new FormData(f);const id=String(data.get('programId')||'');
 const error=f.querySelector('#rt-v96-form-error');
 if(!db.programs.some(p=>p.id===id&&p.status!=='finalizado')){error.textContent='Escolha um processo válido.';error.hidden=false;return;}
 if(!RTDemoStore.assignDisc(db,id,data.get('visibility'))){error.textContent='Já existe uma aplicação ativa neste processo. Conclua-a ou cancele-a antes de criar outra.';error.hidden=false;return;}
 persist('profissional','new-disc',id);location.hash=rt96Href('aplicacoes');render();toast('DISC/ACER atribuído ao processo demonstrativo.');
});
document.addEventListener('click',e=>{
 const view=e.target.closest('[data-rt-view]');
 if(view){const frame=document.querySelector('[data-rt-module="disc"]');if(frame?.contentWindow){frame.contentWindow.postMessage({type:'rt:disc-view',view:view.dataset.rtView},location.origin);document.querySelectorAll('[data-rt-view]').forEach(b=>b.setAttribute('aria-selected',String(b===view)));}return;}
 const lib=e.target.closest('[data-lib-view]');
 if(lib){const frame=document.querySelector('[data-rt-module="library"]');if(frame?.contentWindow){frame.contentWindow.postMessage({type:'rt:library-view',view:lib.dataset.libView},location.origin);document.querySelectorAll('[data-lib-view]').forEach(b=>b.setAttribute('aria-selected',String(b===lib)));}return;}
 let b=e.target.closest('[data-act]');if(b){e.preventDefault();runAction(b.dataset.act,b.dataset.id||'')}});
document.addEventListener('input',e=>{
 if(e.target.id==='rt-v913-question-search'){RTSessionAssist.filterQuestions(e.target.value);return;}
 const wheel=e.target.closest('#rt-v912-wheel-form');
 if(wheel&&/^(name|score)-\d+$/.test(e.target.name)){
  const items=[];for(let i=0;i<10;i++){
    const name=wheel.elements.namedItem('name-'+i),score=wheel.elements.namedItem('score-'+i);
    if(!name||!score)break;
    items.push({name:name.value,score:Number(score.value)});
    const output=wheel.querySelector('[data-wheel-output="'+i+'"]');
    if(output)output.textContent=score.value+'/10';
  }
  const chart=document.querySelector('#rt-v912-chart');
  if(chart){
    const pid=String(wheel.elements.namedItem('programId')?.value||'');
    const history=(db.wheelAssessments||[]).filter(x=>x.programId===pid).slice().sort((a,b)=>(b.date+'T'+(b.createdAt||'')).localeCompare(a.date+'T'+(a.createdAt||'')));
    chart.innerHTML=RTDevelopmentToolkit.wheelSvg(items,history[1]?.areas);
  }
 }
 if(e.target.id==='client-search'){
   const term=e.target.value.trim().toLocaleLowerCase('pt-BR');let visible=0;
   document.querySelectorAll('[data-v92-client-row]').forEach(tr=>{const show=tr.textContent.toLocaleLowerCase('pt-BR').includes(term);tr.hidden=!show;if(show)visible++});
   const count=$('#rt-v92-visible-count');if(count)count.textContent=visible+' cliente'+(visible===1?'':'s')+' exibido'+(visible===1?'':'s');
 }
 if(e.target.id==='home-search'){
  const term=e.target.value.trim().toLowerCase();const target=$('#home-search-results');if(!target)return;
  target.innerHTML=term?db.clients.filter(c=>c.name.toLowerCase().includes(term)||c.focus.toLowerCase().includes(term)).slice(0,5).map(c=>`<a class="rt-v9-search-result" href="${wsUrl(c.id)}">${esc(c.name)}<small>${esc(c.focus)}</small></a>`).join('')||'<span class="muted">Nenhum cliente encontrado.</span>':'';
 }
});
document.addEventListener('change',e=>{
 if(e.target.id==='rt-v913-session-select'){
   const tab=e.target.dataset.tab==='temporizador'?'temporizador':'perguntas';
   const extra=tab==='perguntas'?'phase='+encodeURIComponent(rt96Params().get('phase')||'todas'):'';
   location.hash=RTSessionAssist.href(tab,e.target.value,extra);render();return;
 }
 if(e.target.id==='rt-v912-program'){
  location.hash=rt96Href(rt96Params().get('tab')==='5w2h'?'5w2h':'roda','program='+encodeURIComponent(e.target.value));render();return;
 }
 if(e.target.id==='rt-v912-action-select'){
  const pid=rt96Params().get('program')||db.programs.find(p=>p.status==='em andamento')?.id||db.programs[0]?.id;
  location.hash=rt96Href('5w2h','program='+encodeURIComponent(pid)+(e.target.value?'&action='+encodeURIComponent(e.target.value):''));
  render();return;
 }
 if(e.target.id==='rt-v911-session-select'){location.hash=rt96Href('kit','session='+encodeURIComponent(e.target.value));render();return;}
 if(e.target.name==='programId'&&['new-action','new-instrument'].includes(e.target.closest('#modal-form')?.dataset.kind)){const goalField=document.querySelector('#f-goalId');if(goalField)goalField.innerHTML=goalOptions(e.target.value).map(([id,title])=>`<option value="${esc(id)}">${esc(title)}</option>`).join('');}
 if(e.target.id==='rt-v95-process'){const current=new URLSearchParams(location.hash.split('?')[1]||'');location.hash='#plano-acao?filter='+encodeURIComponent(current.get('filter')||'abertas')+'&program='+encodeURIComponent(e.target.value);return;}
 if(e.target.id==='ws-process-select')location.hash=wsUrl(e.target.dataset.clientId,e.target.dataset.tab,e.target.value);
 if(e.target.id==='rt-v916-goal-filter')location.hash=wsUrl(e.target.dataset.clientId,'desenvolvimento',e.target.dataset.programId,'view='+encodeURIComponent(e.target.dataset.view||'pendentes')+(e.target.value==='todos'?'':'&goal='+encodeURIComponent(e.target.value)));
 if(e.target.id==='rt-v92-client-sort'){const q=clientsQuery();location.hash='#clientes?filter='+encodeURIComponent(q.get('filter')||'todos')+'&sort='+encodeURIComponent(e.target.value);render();}
 if(e.target.id==='rt-v92-period')location.hash=wsUrl(e.target.dataset.clientId,'geral',e.target.dataset.programId,'events='+encodeURIComponent(e.target.dataset.eventKind)+'&period='+encodeURIComponent(e.target.value));
});
$('#modal-form').addEventListener('submit',saveModal);$('#modal-x').addEventListener('click',()=>$('#modal').close());$('#modal-cancel').addEventListener('click',()=>$('#modal').close());
$('#menu-btn').addEventListener('click',()=>{let opened=$('#side').classList.toggle('open');$('#shade').classList.toggle('open',opened);$('#menu-btn').setAttribute('aria-expanded',String(opened))});$('#shade').addEventListener('click',()=>{$('#side').classList.remove('open');$('#shade').classList.remove('open')});
window.addEventListener('hashchange',render);window.addEventListener('storage',e=>{if(e.key===RTDemoStore.KEY){db=RTDemoStore.load();render();}});render();

// V8: sem acesso privilegiado: todo vínculo é explícito e apenas demonstrativo.
document.addEventListener('submit', e=>{
 const form=e.target.closest('.rt-v8-link-form'); if(!form)return;
 e.preventDefault();
 const ts=Number(form.dataset.discTs);const selected=form.elements.programId.value;
 const item=historyEntries().find(x=>Number(x.ts)===ts);
 if(!item){toast('Resultado local não localizado.');return;}
 if(!RTDemoStore.addDiscLink(db,{programId:selected,ts,scores:item.scores})){toast('Vínculo inválido ou já existente neste processo.');return;}
 persist('profissional','link-disc',selected);render();toast('Mapeamento fictício vinculado ao processo.');
});
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.data?.type!=='rt:module-height')return;
 const frame=[...document.querySelectorAll('[data-rt-module]')].find(el=>el.dataset.rtModule===e.data.module && el.contentWindow===e.source);
 if(!frame)return;
 const h=Number(e.data.height);if(Number.isFinite(h))frame.style.height=Math.max(430,Math.min(16000,h))+'px';
});
