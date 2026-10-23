/* RealTalent V5 – núcleo compartilhado EXCLUSIVAMENTE DEMONSTRATIVO.
   LocalStorage não oferece autenticação, RBAC, criptografia nem segregação de dados.
   Nunca utilizar com nomes, registros clínicos ou dados de clientes reais. */
(function (root) {
  'use strict';
  const KEY = 'rt-disc-v5-demo-20261020';
  const VERSION = 11;
  const iso = (offset=0) => {const d=new Date();d.setDate(d.getDate()+offset);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const clone=x=>JSON.parse(JSON.stringify(x));
  function seed() { return {
    version:VERSION,
    professionalRole:'psicologo',
    clients:[
      {id:'c1',name:'Cliente demonstrativo 01',focus:'Comunicação e alinhamento de expectativas',status:'ativo',contact:'Atendimento individual',created:iso(-12)},
      {id:'c2',name:'Cliente demonstrativo 02',focus:'Desenvolvimento de liderança',status:'ativo',contact:'Atendimento individual',created:iso(-20)},
      {id:'c3',name:'Cliente demonstrativo 03',focus:'Planejamento de carreira',status:'ativo',contact:'Atendimento individual',created:iso(-26)}
    ],
    programs:[
      {id:'p1',clientId:'c1',goal:'Aprimorar conversas difíceis e acordos de comunicação',stage:'Exploração de objetivos',status:'em andamento',start:iso(-12)},
      {id:'p2',clientId:'c2',goal:'Desenvolver delegação, feedback e autonomia da equipe',stage:'Plano de ação',status:'em andamento',start:iso(-20)},
      {id:'p3',clientId:'c3',goal:'Definir critérios pessoais para os próximos passos profissionais',stage:'Avaliação inicial',status:'em andamento',start:iso(-26)}
    ],
    sessions:[
      {id:'s1',visibility:'compartilhado',clientTopic:'Encontro de acompanhamento',programId:'p1',date:iso(1),time:'10:00',focus:'Alinhar objetivos e situações de comunicação',status:'agendada',summary:''},
      {id:'s2',visibility:'compartilhado',clientTopic:'Encontro de acompanhamento',programId:'p2',date:iso(2),time:'14:30',focus:'Revisar experimentos de delegação',status:'agendada',summary:''},
      {id:'s3',visibility:'compartilhado',clientTopic:'Encontro de acompanhamento',programId:'p3',date:iso(4),time:'09:00',focus:'Explorar critérios para tomada de decisão',status:'agendada',summary:''},
      {id:'s4',visibility:'privado',clientTopic:'Encontro de acompanhamento',programId:'p2',date:iso(-4),time:'15:00',focus:'Construir um plano de ação observável',status:'concluida',summary:'Exemplo fictício de encerramento: revisados próximos passos e acordos.'}
    ],
    goals:[
      {id:'goal-p1',programId:'p1',title:'Aprimorar conversas difíceis e acordos de comunicação',status:'ativo',createdAt:iso(-12)},
      {id:'goal-p2',programId:'p2',title:'Desenvolver delegação, feedback e autonomia da equipe',status:'ativo',createdAt:iso(-20)},
      {id:'goal-p3',programId:'p3',title:'Definir critérios pessoais para os próximos passos profissionais',status:'ativo',createdAt:iso(-26)}
    ],
    actions:[
      {id:'a1',goalId:'goal-p1',visibility:'compartilhado',programId:'p1',title:'Praticar uma pergunta aberta em uma conversa de rotina',due:iso(3),status:'pendente',resource:'Communication Lab'},
      {id:'a2',goalId:'goal-p2',visibility:'compartilhado',programId:'p2',title:'Definir critérios de delegação e revisar com a equipe',due:iso(5),status:'pendente',resource:'Guia de comunicação'},
      {id:'a3',goalId:'goal-p3',visibility:'compartilhado',programId:'p3',title:'Listar opções e critérios profissionais',due:iso(-2),status:'concluido',resource:'Roteiro de coaching'}
    ],
    // Compartilhamentos explícitos do profissional. O cliente só vê registros com visibilidade compartilhada.
    guidance:[
      {id:'g1',programId:'p1',goalId:'goal-p1',text:'Nesta semana, observe uma situação em que uma pergunta aberta possa melhorar o diálogo.',visibility:'compartilhado',created:iso(-1)}
    ],
    reflections:[],
    instruments:[
      {id:'i-seed-1',programId:'p1',kind:'reflexao-guiada',title:'Meu estilo de comunicação',instructions:'Registre uma situação fictícia de comunicação. Não é um teste psicológico nem produz perfil DISC.',visibility:'compartilhado',status:'atribuido',responses:null,feedback:'',feedbackVisibility:'privado',assignedAt:iso(-1)}
    ],
    discLinks:[],
    discAssignments:[{id:'disc-seed-1',programId:'p1',clientId:'c1',visibility:'compartilhado',status:'atribuido',assignedAt:iso(-1),completedAt:null,answers:null,scores:null,selfAdjectives:null,perceivedAdjectives:null,selfScores:null,perceivedScores:null,feedback:'',feedbackVisibility:'privado'}],
    audit:[]
  };}
  function valid(d) {return d && d.version===VERSION && ['clients','programs','goals','sessions','actions','guidance','reflections','instruments','discLinks','discAssignments','audit'].every(k=>Array.isArray(d[k]));}
  // Preparação de sessão: estrutura interna, opcional, nunca compartilhada no portal.
  const PREP_FIELDS=['goal','reality','options','wayForward'];
  function normalizeSessionPreparation(input){
    if(!input||typeof input!=='object'||Array.isArray(input))return null;
    const normalized={};
    for(const key of PREP_FIELDS)normalized[key]=String(input[key]??'').trim().slice(0,650);
    return PREP_FIELDS.some(key=>normalized[key])?normalized:null;
  }
  function updateSessionPreparation(d,sessionId,input){
    const s=d.sessions.find(s=>s.id===sessionId);
    if(!s||!d.programs.some(p=>p.id===s.programId))return false;
    if(!input||typeof input!=='object'||Array.isArray(input))return false;
    s.preparation=normalizeSessionPreparation(input);
    s.preparationUpdatedAt=new Date().toISOString();
    return true;
  }
  // Migração somente do protótipo local; dados sem visibilidade explícita tornam-se privados.
  function upgrade(raw) {
    if(!raw || ![5,7,8,9,10,11].includes(raw.version))return null;
    const d=clone(raw);
    d.version=VERSION;
    if(!Array.isArray(d.goals))d.goals=[];
    for(const p of d.programs){
      if(!d.goals.some(g=>g.programId===p.id))d.goals.push({id:'goal-'+p.id,programId:p.id,title:p.goal,status:'ativo',createdAt:p.start||iso()});
    }
    for(const a of d.actions){
      if(!d.goals.some(g=>g.id===a.goalId&&g.programId===a.programId))a.goalId=d.goals.find(g=>g.programId===a.programId)?.id||null;
      if(!d.sessions.some(s=>s.id===a.sessionId&&s.programId===a.programId))a.sessionId=null;
    }
    for(const s of d.sessions){
      s.preparation=normalizeSessionPreparation(s.preparation);
      s.clientRecap=String(s.clientRecap||'').slice(0,800);
      if(s.recapVisibility!=='compartilhado'||s.visibility!=='compartilhado'||s.status!=='concluida'||!s.clientRecap)s.recapVisibility='privado';
    }
    if(!Array.isArray(d.instruments))d.instruments=[];
    if(!Array.isArray(d.discLinks))d.discLinks=[];
    if(!Array.isArray(d.discAssignments))d.discAssignments=[];
    for(const task of d.discAssignments)if(task.visibility!=='compartilhado')task.visibility='privado';
    for(const kind of ['sessions','actions','guidance']) {
      if(!Array.isArray(d[kind]))return null;
      for(const row of d[kind])if(row.visibility!=='compartilhado')row.visibility='privado';
    }
    return valid(d)?d:null;
  }
  function load() {
    try {const raw=localStorage.getItem(KEY);if(raw){const d=upgrade(JSON.parse(raw));if(d){if(d.version===VERSION)save(d);return d;}}}catch(e){}
    const d=seed();save(d);return d;
  }
  function save(d) {const normalized=upgrade(d);if(!normalized)throw new Error('Esquema demonstrativo inválido');Object.assign(d,normalized);localStorage.setItem(KEY,JSON.stringify(d));return d;}
  function reset(){
    try{for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key&&key.startsWith('rt-v97-disc-draft:'))localStorage.removeItem(key);}}catch(e){}
    const d=seed();save(d);return d;
  }
  function addDiscLink(d,input){
    const p=d.programs.find(p=>p.id===input.programId);
    if(!p||!d.clients.some(c=>c.id===p.clientId))return false;
    const ts=Number(input.ts);
    if(!Number.isFinite(ts)||ts<=0)return false;
    const scores={};
    for(const k of ['D','I','S','C']){
      const n=Number(input.scores?.[k]);if(!Number.isFinite(n)||n<0||n>10000)return false;
      scores[k]=n;
    }
    if(d.discLinks.some(l=>l.programId===p.id&&l.sourceTs===ts))return false;
    d.discLinks.push({id:freshId('disc'),programId:p.id,clientId:p.clientId,sourceTs:ts,scores,visibility:'privado',linkedAt:new Date().toISOString()});
    return true;
  }
  function assignDisc(d,programId,visibility='privado') {
    const p=d.programs.find(x=>x.id===programId);
    if(!p||!d.clients.some(c=>c.id===p.clientId))return false;
    if(d.discAssignments.some(x=>x.programId===programId&&x.status==='atribuido'))return false;
    d.discAssignments.push({id:freshId('disc-task'),programId,clientId:p.clientId,
      visibility:visibility==='compartilhado'?'compartilhado':'privado',status:'atribuido',
      assignedAt:new Date().toISOString(),startedAt:null,completedAt:null,cancelledAt:null,answers:null,scores:null,selfAdjectives:null,perceivedAdjectives:null,selfScores:null,perceivedScores:null,
      feedback:'',feedbackVisibility:'privado'});
    return true;
  }
  function submitDisc(d,clientId,id,answers,selfAdjectives,perceivedAdjectives) {
    const q=root.RTDiscQuestions;
    const scores=q?.tally(answers);
    const selfScores=q?.tallyAdjs(selfAdjectives),perceivedScores=q?.tallyAdjs(perceivedAdjectives);
    const task=d.discAssignments.find(x=>x.id===id&&x.clientId===clientId&&
      x.status==='atribuido'&&x.visibility==='compartilhado'&&
      d.programs.some(p=>p.id===x.programId&&p.clientId===clientId));
    if(!task||!scores||!selfScores||!perceivedScores)return false;
    task.selfAdjectives=selfAdjectives.slice();task.perceivedAdjectives=perceivedAdjectives.slice();
    task.selfScores=selfScores;task.perceivedScores=perceivedScores;
    task.answers=answers.slice();task.scores=scores;task.status='respondido';task.completedAt=new Date().toISOString();
    return true;
  }
  // Changes are recorded only as demonstrative client-independent metadata; no draft answers in the professional view.
  function markDiscStarted(d,clientId,id){
    const task=d.discAssignments.find(x=>x.id===id&&x.clientId===clientId&&x.status==='atribuido'&&x.visibility==='compartilhado'&&d.programs.some(p=>p.id===x.programId&&p.clientId===clientId));
    if(!task)return false;
    if(!task.startedAt)task.startedAt=new Date().toISOString();
    return true;
  }
  function cancelDisc(d,id){
    const task=d.discAssignments.find(x=>x.id===id&&x.status==='atribuido');
    if(!task)return false;
    task.status='cancelado';task.cancelledAt=new Date().toISOString();task.visibility='privado';
    task.feedback='';task.feedbackVisibility='privado';
    return true;
  }
  function freshId(prefix) {
    if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')return prefix+'-'+crypto.randomUUID();
    return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,13);
  }
  function clientView(d,clientId){
    const c=d.clients.find(x=>x.id===clientId);if(!c)return null;
    const ps=d.programs.filter(p=>p.clientId===c.id),ids=new Set(ps.map(p=>p.id));
    return clone({client:c,programs:ps,goals:d.goals.filter(g=>ids.has(g.programId)),
      sessions:d.sessions.filter(x=>ids.has(x.programId)&&x.visibility==='compartilhado').map(({summary,focus,clientRecap,recapVisibility,preparation,preparationUpdatedAt,...s})=>({...s,focus:s.clientTopic||'Encontro de acompanhamento',clientRecap:s.status==='concluida'&&recapVisibility==='compartilhado'?clientRecap:''})),
      actions:d.actions.filter(x=>ids.has(x.programId)&&x.visibility==='compartilhado').map(a=>({...a,sessionId:d.sessions.some(s=>s.id===a.sessionId&&s.visibility==='compartilhado')?a.sessionId:null})),
      guidance:d.guidance.filter(x=>ids.has(x.programId)&&x.visibility==='compartilhado'),
      instruments:d.instruments.filter(x=>ids.has(x.programId)&&x.visibility==='compartilhado').map(({feedback,feedbackVisibility,...item})=>({...item,feedback:feedbackVisibility==='compartilhado'?feedback:''})),
      // Tela cliente não recebe respostas nem gráficos pelo contrato de visualização.
      discAssignments:d.discAssignments.filter(x=>ids.has(x.programId)&&x.clientId===clientId&&x.visibility==='compartilhado')
       .map(({answers,scores,selfAdjectives,perceivedAdjectives,selfScores,perceivedScores,feedbackVisibility,feedback,...item})=>({...item,feedback:feedbackVisibility==='compartilhado'?feedback:''})),
      reflections:d.reflections.filter(x=>x.clientId===clientId),
    });
  }
  // Confere vínculo e estado. Exemplo ilustrativo no mesmo navegador; NÃO É uma autorização de servidor.
  function submitInstrument(d,clientId,instrumentId,answers) {
    const v=clientView(d,clientId),entry=v?.instruments.find(x=>x.id===instrumentId);
    if(!entry||entry.status!=='atribuido'||!Array.isArray(answers)||answers.length!==3)return false;
    const response=answers.map(x=>String(x||'').trim().slice(0,600));
    if(response.some(x=>!x))return false;
    const target=d.instruments.find(x=>x.id===instrumentId);
    target.responses=response;target.status='respondido';target.answeredAt=new Date().toISOString();
    return true;
  }
  function goalsOf(d,programId){return (d.goals||[]).filter(g=>g.programId===programId);}
  function createGoal(d,programId,title){
    const p=d.programs.find(p=>p.id===programId&&p.status!=='finalizado');
    title=String(title||'').trim().slice(0,160);
    if(!p||title.length<4)return false;
    d.goals.push({id:freshId('goal'),programId,title,status:'ativo',createdAt:new Date().toISOString()});return true;
  }
  function linkActionGoal(d,actionId,goalId){
    const a=d.actions.find(a=>a.id===actionId),g=d.goals.find(g=>g.id===goalId);
    if(!a||!g||a.programId!==g.programId)return false;
    a.goalId=g.id;return true;
  }
  function recordExperience(d,clientId,actionId,outcome,note){
    const v=clientView(d,clientId),a=v?.actions.find(a=>a.id===actionId&&a.status==='pendente');
    if(!a||!['realizada','tentada'].includes(outcome))return false;
    note=String(note||'').trim().slice(0,600);
    const target=d.actions.find(x=>x.id===actionId);
    target.experience={outcome,note,submittedAt:new Date().toISOString()};target.status='concluido';target.completedAt=target.experience.submittedAt;
    return true;
  }
  // V9.10: compromissos ligados a encontros; sempre com objetivo e processo do mesmo cliente.
  function createSessionAgreement(d,sessionId,input){
    const s=d.sessions.find(s=>s.id===sessionId),p=d.programs.find(p=>p.id===s?.programId&&p.status!=='finalizado');
    const title=String(input?.title||'').trim().slice(0,500),due=String(input?.due||'');
    const goal=d.goals.find(g=>g.id===input?.goalId&&g.programId===s?.programId);
    if(!s||!p||!goal||title.length<4||!/^(20\d{2})-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(due))return null;
    const a={id:freshId('a'),programId:p.id,sessionId:s.id,goalId:goal.id,title,due,resource:'Acordo de sessão',status:'pendente',visibility:input.visibility==='compartilhado'?'compartilhado':'privado',createdAt:new Date().toISOString()};
    d.actions.push(a);return a;
  }
  function updateSessionRecap(d,sessionId,text,visibility){
    const s=d.sessions.find(s=>s.id===sessionId);
    if(!s||s.status!=='concluida')return false;
    s.clientRecap=String(text||'').trim().slice(0,800);
    s.recapVisibility=s.clientRecap&&visibility==='compartilhado'&&s.visibility==='compartilhado'?'compartilhado':'privado';
    s.recapUpdatedAt=new Date().toISOString();return true;
  }
  function publicReflections(d,clientId){return d.reflections.filter(r=>r.clientId===clientId&&r.visibility==='compartilhado');}
  function log(d,actor,action,entityId) {d.audit.push({id:freshId('ev'),actor,action,entityId,at:new Date().toISOString()});if(d.audit.length>150)d.audit=d.audit.slice(-150);}
  root.RTDemoStore=Object.freeze({KEY,VERSION,load,save,reset,freshId,clientView,publicReflections,goalsOf,createGoal,linkActionGoal,updateSessionPreparation,createSessionAgreement,updateSessionRecap,recordExperience,log,seed,submitInstrument,upgrade,addDiscLink,assignDisc,submitDisc,markDiscStarted,cancelDisc});
})(window);
