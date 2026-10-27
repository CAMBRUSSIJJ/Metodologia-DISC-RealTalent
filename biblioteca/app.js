'use strict';
/* RealTalent Biblioteca DISC/ACER 3.2 · Communication Lab, conteúdo educacional local. */
const DATA = JSON.parse(document.getElementById('library-data').textContent);
const PROFILES = JSON.parse(document.getElementById('profile-data').textContent);
const ADVANCED = JSON.parse(document.getElementById('advanced-data').textContent);
const LAB = JSON.parse(document.getElementById('lab-data').textContent);
const BY_ID = new Map(DATA.records.map(r=>[r.id,r]));
const $ = id=>document.getElementById(id);
const qs = new URLSearchParams(location.search);
const embedded = qs.get('embedded')==='1';
const KEY = 'rt-disc-acer-library-v2'; // mantém progresso do v2
const VIEWS = [
 ['inicio','⌂','Início'], ['conhecimento','▤','Conhecimento'], ['ferramentas','◇','Ferramentas'],
 ['laboratorio','✦','Communication Lab'], ['aprender','◈','Aprender'], ['arquivos','▣','Meus arquivos'], ['minha','☆','Minha biblioteca'], ['referencias','⌘','Referências']
];
const GROUPS = [
 ['Todos','Tudo'],['Perfis','Perfis'],['Combinações','Combinações'],['conceitos','Fundamentos'],
 ['interpretacao','Interpretação'],['comunicacao','Comunicação'],['lideranca','Liderança'],
 ['vendas','Vendas'],['servicos','Serviços'],['desenvolvimento','Desenvolvimento'],
 ['governanca','Ética'],['Casos','Casos práticos'],['Coaching','Coaching'],['Glossário','Glossário']
];
const FACTORS = ['D','I','S','C'];
const COLOR = {D:'#e77a78',I:'#e6b65d',S:'#55baa2',C:'#7d9ceb'};
const SCENARIOS = {
 feedback:'Dar feedback',reuniao:'Conduzir uma reunião',vendas:'Apresentar uma proposta',mudanca:'Comunicar uma mudança'
};
const valid = new Set(BY_ID.keys());
const safeSet = items=>new Set(Array.isArray(items)?items.filter(id=>valid.has(id)):[]);
function readStorage(){try {return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
const store=readStorage();
function sharedTheme(){try{const v=localStorage.getItem('rt_theme');return v==='light'||v==='dark'?v:null}catch{return null}}
const local={favorites:safeSet(store.favorites),read:safeSet(store.read),recent:(store.recent||[]).filter(x=>valid.has(x)).slice(0,15),
 theme:sharedTheme()||(['dark','light'].includes(store.theme)?store.theme:'dark'), notes:typeof store.notes==='object'&&store.notes?store.notes:{},
 practices:store.practices&&typeof store.practices==='object'&&!Array.isArray(store.practices)?store.practices:{},
 plans:store.plans&&typeof store.plans==='object'&&!Array.isArray(store.plans)?store.plans:{},
 lab:{finished:store.lab?.finished&&typeof store.lab.finished==='object'&&!Array.isArray(store.lab.finished)?store.lab.finished:{},writing:store.lab?.writing&&typeof store.lab.writing==='object'&&!Array.isArray(store.lab.writing)?store.lab.writing:{},lastDraft:store.lab?.lastDraft||null}};
const state={view:'inicio',group:'Todos',type:'Todos',query:'',selected:null,reader:false,profileTab:'visao',
 compare:['D','S'],scenario:'feedback',matrix:['D','S'],practiceId:null,labTab:'simulacoes',labScene:null,labArea:'Todas',labStep:0,labPick:null,labAnswers:[],labFinished:false,labFactor:'D',labExercise:null,
 labDraft:{message:'',goal:'',next:'',when:'',context:'Feedback',...(local.lab.lastDraft||{})},labVariants:null,labEdited:{}};
function persist(){try{localStorage.setItem(KEY,JSON.stringify({favorites:[...local.favorites],read:[...local.read],recent:local.recent,theme:local.theme,notes:local.notes,practices:local.practices,plans:local.plans,lab:local.lab}));}catch{}}
function el(tag,cls='',txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;}
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function node(tag,cls,children=[]){let n=el(tag,cls);children.forEach(x=>n.append(x));return n}
function action(text,fn,cls=''){const n=el('button',cls,text);n.type='button';n.addEventListener('click',fn);return n}
function paragraph(text,cls=''){return el('p',cls,text)}
function title(text,level=2,cls=''){return el('h'+level,cls,text)}
function badge(text,cls=''){return el('span','badge '+cls,text)}
function notice(msg){$('toast').textContent=msg;clearTimeout(notice.timer);$('toast').classList.add('show');notice.timer=setTimeout(()=>$('toast').classList.remove('show'),2900)}
function hashUpdate(){try{const frag=state.reader&&state.selected?'item='+encodeURIComponent(state.selected):'view='+state.view;history.replaceState(null,'','#'+frag)}catch{}}
function hideMenu(){$('sidebar').classList.remove('open');$('mobile-menu').setAttribute('aria-expanded','false');$('mobile-shade').hidden=true;}
function showMenu(){const open=$('sidebar').classList.toggle('open');$('mobile-menu').setAttribute('aria-expanded',String(open));$('mobile-shade').hidden=!open;}
function openView(view,update=true){if(!VIEWS.some(x=>x[0]===view))view='inicio';state.view=view;state.selected=null;state.reader=false;
 if(view!=='conhecimento'){state.query='';$('query').value='';} if(update)hashUpdate();render();hideMenu();$('screen').scrollTop=0;}
function openRecord(id){if(!valid.has(id))return;state.selected=id;state.reader=true;state.view='conhecimento';state.profileTab='visao';state.practiceId=null;
 local.recent=[id,...local.recent.filter(x=>x!==id)].slice(0,15);persist();hashUpdate();render();hideMenu();$('screen').scrollTop=0;}
function drawNav(){const root=$('navigation');root.replaceChildren();for(const [key,icon,label] of VIEWS){let b=action(label,()=>openView(key),'nav-item'+(key===state.view?' current':''));b.prepend(el('span','nav-icon',icon));if(key===state.view)b.setAttribute('aria-current','page');root.append(b)}}
function setTheme(theme){local.theme=theme==='dark'?'dark':'light';document.documentElement.dataset.theme=local.theme;
 $('theme-switch').textContent=local.theme==='dark'?'☀':'☾';$('theme-switch').setAttribute('aria-label',local.theme==='dark'?'Ativar modo claro':'Ativar modo escuro');if(!embedded){persist();try{localStorage.setItem('rt_theme',local.theme)}catch{}}}
function pageHead(kicker,heading,desc){let h=el('div','page-heading');h.append(el('p','eyebrow',kicker),title(heading,1),paragraph(desc,'page-intro'));return h}
function sectionLabel(kicker,heading,right=null){let n=el('div','section-title');let a=el('div');a.append(el('span','eyebrow',kicker),title(heading,2));n.append(a);if(right)n.append(right);return n}
function getRecord(id){return BY_ID.get(id)}
function card(record,kind='record'){const b=action('',()=>openRecord(record.id),'content-card '+kind);
 const meta=node('div','card-meta',[el('span','eyebrow',record.kind),el('span','card-arrow','↗')]);
 b.append(meta,title(record.title,3),paragraph(record.subtitle||record.body||'','clamp2'));
 if(local.read.has(record.id))b.append(el('span','card-done','✓ Estudado'));
 else if(local.favorites.has(record.id))b.append(el('span','card-favorite','★ Favorito'));
 return b;}
function showCollection(root,records,cls='content-grid'){let grid=el('div',cls);records.forEach(r=>grid.append(card(r)));root.append(grid);return grid;}
function simpleLink(txt,cb){return action(txt+'  →',cb,'text-link')}
function stat(value,label){let n=el('div','stat');n.append(el('strong','',value),el('span','',label));return n}
function progressBar(value,total){const wrap=el('div','progress-track');let fill=el('div','progress-fill');fill.style.width=(total?Math.min(100,Math.round(value/total*100)):0)+'%';wrap.append(fill);return wrap}
function profileCard(p){let b=action('',()=>openRecord('perfil:'+p.sigla),'profile-card');b.style.setProperty('--factor-color',COLOR[p.sigla]);
 b.append(el('div','profile-glyph',p.sigla),el('div','profile-name',p.nome),paragraph(p.rotulo,'profile-sub'),el('span','profile-more','Explorar perfil  ↗'));
 let n=Object.keys(local.practices).filter(k=>k.startsWith(p.sigla+':')&&local.practices[k]?.done).length;
 b.append(el('span','profile-practice-progress',`${n}/3 práticas exploradas`));return b;}
function drawHome(root){let wrap=el('div','page-layout home');let hero=el('div','hero');let left=el('div','hero-copy');left.append(badge('CENTRO DE CONHECIMENTO · V3.2','hero-badge'),title('Conhecer melhor.\nComunicar melhor.',1,'hero-title'),paragraph('Explore a metodologia DISC/ACER, compreenda diferentes formas de agir e coloque o aprendizado em prática.','hero-subtitle'));
 let actions=el('div','hero-actions');actions.append(action('Explorar conteúdos  ↗',()=>openView('conhecimento'),'btn primary'),action('Comparar perfis  ◇',()=>openView('ferramentas'),'btn ghost'));left.append(actions);hero.append(left);
 let visual=el('div','hero-visual');let orbit=el('div','orbit');PROFILES.forEach(p=>{let n=el('span','orbit-item factor-'+p.sigla,p.sigla);orbit.append(n)});orbit.append(el('div','orbit-center','DISC\nACER'));visual.append(orbit);hero.append(visual);wrap.append(hero);
 let experience=el('div','practice-home-banner');experience.append(node('div','',[el('span','eyebrow','NOVIDADE · LABORATÓRIO'),title('Aprenda fazendo, não apenas lendo',2),paragraph('12 cenários de liderança, comunicação e vendas com devolutivas e planos de desenvolvimento.')]));experience.append(action('Iniciar uma prática  ↗',()=>{openRecord('perfil:D');state.profileTab='praticar';render()},'btn primary'));wrap.append(experience);
 let overview=el('div','overview-row');let p=el('div','panel learning-panel');p.append(el('p','eyebrow','SUA JORNADA'),title('Continue de onde parou',2));let latest=local.recent.map(getRecord).find(Boolean);
 if(latest){p.append(paragraph(latest.title,'learning-title'),paragraph(latest.subtitle||'Abra o conteúdo para continuar.','muted'));p.append(simpleLink('Retomar leitura',()=>openRecord(latest.id)));}
 else {p.append(paragraph('Sua jornada começa aqui','learning-title'),paragraph('Abra um artigo ou perfil para registrar seu histórico.','muted'));p.append(simpleLink('Começar pelos fundamentos',()=>{state.group='conceitos';openView('conhecimento')}));}
 let q=el('div','panel progress-panel');let pct=Math.round(local.read.size/DATA.records.length*100);
 q.append(el('p','eyebrow','PROGRESSO DE LEITURA'),el('div','big-progress',pct+'%'),progressBar(local.read.size,DATA.records.length),paragraph(local.read.size+' de '+DATA.records.length+' conteúdos estudados','muted'));
 overview.append(p,q);wrap.append(overview);
 let n=practiceCompletion();let small=el('div','practice-mini-progress');small.append(el('span','',`Laboratório: ${n} de 12 cenários explorados`),progressBar(n,12));wrap.append(small);
 wrap.append(sectionLabel('EXPLORE','Os quatro fatores',simpleLink('Conheça todos',()=>{state.group='Perfis';openView('conhecimento')})));
 let pg=el('div','profile-grid');PROFILES.forEach(p=>pg.append(profileCard(p)));wrap.append(pg);
 wrap.append(sectionLabel('NA PRÁTICA','O que você quer fazer hoje?'));
 let paths=el('div','path-grid');[
 ['◈','Aprender o essencial','Conheça os fundamentos, conceitos e diferenças entre os fatores.',()=>{state.group='conceitos';openView('conhecimento')}],
 ['⇄','Melhorar a comunicação','Simule conversas, adapte mensagens e pratique situações reais.',()=>openView('laboratorio')],
 ['▣','Explorar treinamentos','Percorra os dez módulos de aprendizagem disponíveis.',()=>openView('aprender')]
 ].forEach(([ico,h,sub,cb])=>{let b=action('',cb,'path-card');b.append(el('span','path-icon',ico),title(h,3),paragraph(sub),el('span','path-more','Acessar  ↗'));paths.append(b)});wrap.append(paths);
 let feature=DATA.records.filter(r=>r.kind==='Artigos').slice(0,3);wrap.append(sectionLabel('LEITURAS RECOMENDADAS','Comece por aqui'));showCollection(wrap,feature);root.append(wrap);
}
function match(r){if(state.group!=='Todos'&&r.group!==state.group&&r.kind!==state.group)return false;if(state.type!=='Todos'&&r.kind!==state.type)return false;
 const parts=norm(state.query.trim()).split(/\s+/).filter(Boolean);if(!parts.length)return true;
 let text=norm([r.title,r.subtitle,r.body,r.keywords,r.alert,...(r.points||[]),...(r.details||[]).map(d=>d.head+' '+(Array.isArray(d.text)?d.text.join(' '):d.text))].join(' '));return parts.every(w=>text.includes(w));}
function drawKnowledge(root){let w=el('div','page-layout');w.append(pageHead('CONHECIMENTO','Explore o conhecimento','Uma base organizada para consultar conceitos, perfis, combinações e aplicações do DISC/ACER.'));
 let bar=el('div','filter-wrap');let groupBar=el('div','filter-scroller');for(const [id,name] of GROUPS){let b=action(name,()=>{state.group=id;render()},'filter-pill'+(state.group===id?' selected':''));b.setAttribute('aria-pressed',String(state.group===id));groupBar.append(b)}bar.append(groupBar);
 let types=el('div','type-filters');types.append(el('span','','Tipo:'));
 ['Todos','Artigos','Perfis','Combinações','Casos','Coaching','Glossário','Matriz','Cursos'].forEach(kind=>{let b=action(kind,()=>{state.type=kind;render()},'type-chip'+(state.type===kind?' chosen':''));types.append(b)});bar.append(types);w.append(bar);
 const matches=DATA.records.filter(match);let label=sectionLabel('ACERVO',`${matches.length} ${matches.length===1?'conteúdo':'conteúdos'}`);w.append(label);
 if(matches.length)showCollection(w,matches);
 else{let empty=el('div','empty-state');empty.append(title('Nenhum resultado encontrado',2),paragraph('Experimente outra palavra ou remova os filtros.'),action('Limpar filtros',()=>{state.group='Todos';state.type='Todos';state.query='';$('query').value='';render()},'btn primary'));w.append(empty)}
 root.append(w);
}
function listBlock(heading,contents,cls=''){const section=el('section','reader-section '+cls);section.append(title(heading,2));if(Array.isArray(contents)){let ul=el('ul','editorial-list');contents.forEach(x=>ul.append(el('li','',x)));section.append(ul)}else section.append(paragraph(contents));return section;}
function addProfile(reader,p){reader.append(el('div','profile-banner factor-'+p.sigla));let tabs=el('div','reader-tabs');let tabList=[['visao','Visão geral'],['comunicacao','Comunicação'],['aplicacoes','No trabalho'],['desenvolvimento','Desenvolvimento'],['praticar','Praticar'],['plano','Meu plano']];
 for(const [id,name] of tabList){const b=action(name,()=>{state.profileTab=id;render()},'reader-tab'+(state.profileTab===id?' selected':''));b.setAttribute('aria-pressed',String(state.profileTab===id));tabs.append(b)}reader.append(tabs);
 const s=state.profileTab;
 if(s==='visao'){reader.append(listBlock('Essência',p.essencia),listBlock('Quando pode aparecer',p.contexto),listBlock('Possíveis forças',p.forcas),listBlock('Pontos de atenção',p.riscos));}
 if(s==='comunicacao'){reader.append(listBlock('Orientações para comunicação',p.comunicacao),listBlock('Motivadores possíveis',p.motivadores),listBlock('Necessidades de contexto',p.necessidades),listBlock('Feedback',p.feedback));}
 if(s==='aplicacoes'){reader.append(listBlock('Na liderança',p.lideranca),listBlock('Em vendas',p.vendas),listBlock('Sob pressão (hipóteses)',p.sob_pressao));}
 if(s==='desenvolvimento'){reader.append(listBlock('Exercícios de desenvolvimento',p.desenvolvimento),listBlock('Perguntas de reflexão',p.perguntas_coaching),listBlock('Não inferir',p.nao_inferir));}
 if(s==='aplicacoes'){reader.append(profileExamples(p));}
 if(s==='comunicacao'){reader.append(profileDialogue(p));}
 if(s==='praticar'){reader.append(profilePractice(p));}
 if(s==='plano'){reader.append(profilePlan(p));}
 reader.append(action('Comparar este perfil  →',()=>{state.compare[0]=p.sigla;openView('ferramentas')},'btn subtle'));
}

// V3.1: exemplos e experiências situacionais. Alternativas não calculam nem atribuem perfis.
function profileDialogue(p){
 const d=ADVANCED[p.sigla].dialogo,box=el('section','dialogue-example');
 box.append(el('span','eyebrow','EXEMPLO DE CONVERSA'),title(d.contexto,2));
 const rows=el('div','dialogue-grid');
 for(const [label,content,cls] of [['Formulação menos útil',d.menos_util,'contrast-muted'],['Formulação mais clara',d.mais_util,'contrast-good']]){
  const item=el('div','dialogue-quote '+cls);item.append(el('span','eyebrow',label),paragraph('“'+content+'”'));rows.append(item)}
 box.append(rows,paragraph('São alternativas ilustrativas: contexto e preferência declarada da pessoa sempre prevalecem.','muted'));return box;
}
function profileExamples(p){
 const adv=ADVANCED[p.sigla],box=el('section','profile-advanced');
 box.append(el('span','eyebrow','APLICAÇÃO CONTEXTUAL'),title(adv.slogan,2));
 const cards=el('div','example-grid');for(const ex of adv.situacoes){const c=action('',()=>{state.profileTab='praticar';state.practiceId=ex.id;render()},'example-card');c.append(el('span','eyebrow',ex.area),title(ex.titulo,3),paragraph(ex.cenario),el('span','example-cta','Explorar cenário  ↗'));cards.append(c)}
 box.append(cards,listBlock('Evite interpretações precipitadas',adv.mitos));return box;
}
function practiceKey(p,id){return p.sigla+':'+id}
function practiceCompletion(){let n=0;for(const p of PROFILES)for(const x of ADVANCED[p.sigla].situacoes){if(local.practices[practiceKey(p,x.id)]?.done)n++}return n}
function profilePractice(p){
 const adv=ADVANCED[p.sigla],box=el('section','practice-workbench');
 box.append(el('span','eyebrow','LABORATÓRIO COMPORTAMENTAL'),title('Pratique em situações reais',2),paragraph('Escolha uma resposta e reflita sobre seu efeito. Não há nota de personalidade: o objetivo é analisar decisões no contexto.','muted'));
 const done=adv.situacoes.filter(x=>local.practices[practiceKey(p,x.id)]?.done).length;
 box.append(node('div','practice-progress',[el('strong','',done+' de 3 práticas exploradas'),progressBar(done,3)]));
 const pick=el('div','scenario-picks');for(const ex of adv.situacoes){const active=(state.practiceId||adv.situacoes[0].id)===ex.id;let b=action(ex.area+' · '+ex.titulo+(local.practices[practiceKey(p,ex.id)]?.done?'  ✓':''),()=>{state.practiceId=ex.id;render()},'scenario-pick'+(active?' active':''));b.setAttribute('aria-pressed',String(active));pick.append(b)}box.append(pick);
 const ex=adv.situacoes.find(x=>x.id===(state.practiceId||adv.situacoes[0].id))||adv.situacoes[0],key=practiceKey(p,ex.id),record=local.practices[key]||{};
 const casebox=el('div','practice-case');casebox.append(el('span','eyebrow','CENÁRIO · '+ex.area),title(ex.titulo,3),paragraph(ex.cenario,'practice-story'),title(ex.pergunta,3,'practice-question'));
 const choices=el('div','practice-choices');ex.alternativas.forEach((choice,index)=>{let b=action('',()=>{local.practices[key]={...record,choice:index,done:false};persist();render()},'practice-choice'+(record.choice===index?' selected':''));b.setAttribute('aria-pressed',String(record.choice===index));b.append(el('span','choice-letter',String.fromCharCode(65+index)),el('span','',choice.texto));choices.append(b)});casebox.append(choices);
 if(Number.isInteger(record.choice)&&ex.alternativas[record.choice]){
  const feedback=el('div','practice-feedback');feedback.append(el('span','eyebrow','PARA REFLETIR'),title('O que essa escolha pode produzir?',3),paragraph(ex.alternativas[record.choice].feedback),paragraph('Outras alternativas podem ser adequadas quando as condições são diferentes.','muted'));
  casebox.append(feedback);
  if(!record.done)casebox.append(action('✓ Registrar prática explorada',()=>{local.practices[key]={...local.practices[key],done:true,completedAt:new Date().toISOString()};persist();render();notice('Prática registrada neste navegador.')},'btn primary'));
  else casebox.append(badge('✓ Prática explorada','success'));
 }
 const reflection=el('div','practice-reflection');reflection.append(title('Pense na aplicação',3),paragraph(ex.reflexao,'muted'));let area=el('textarea','notes-input');area.placeholder='Escreva sua reflexão (opcional)...';area.maxLength=700;area.value=record.reflection||'';area.setAttribute('aria-label','Minha reflexão sobre '+ex.titulo);reflection.append(area);
 reflection.append(action('Salvar reflexão',()=>{const latest=local.practices[key]||{};local.practices[key]={...latest,reflection:area.value.trim()};persist();notice('Reflexão salva apenas neste navegador.')},'btn small'));
 reflection.append(node('div','micro-action',[el('strong','','Microação sugerida'),paragraph(ex.microacao)]));casebox.append(reflection);box.append(casebox);return box;
}
function profilePlan(p){
 const a=ADVANCED[p.sigla],old=local.plans[p.sigla]||{},box=el('section','action-workbench');
 box.append(el('span','eyebrow','PLANO DE DESENVOLVIMENTO'),title('Da intenção à ação',2),paragraph('Escolha um experimento observável, combine contexto e revisão. Este é um plano de prática, não uma avaliação individual.','muted'));
 const form=el('div','action-form');
 const focus=el('label','plan-label');focus.append(el('span','','Experimento para testar'));const sel=el('select','tool-select');sel.setAttribute('aria-label','Experimento para testar');for(const x of a.experimentos){let op=el('option','',x);op.value=x;sel.append(op)}sel.value=a.experimentos.includes(old.focus)?old.focus:a.experimentos[0];focus.append(sel);form.append(focus);
 function field(label,name,value,placeholder,multi=false){let row=el('label','plan-label');row.append(el('span','',label));let input=el(multi?'textarea':'input','plan-input');if(!multi)input.type='text';input.value=value||'';input.placeholder=placeholder;input.maxLength=multi?800:180;input.setAttribute('aria-label',label);row.append(input);form.append(row);return input;}
 let where=field('Quando e em qual situação?', 'when',old.when,'Ex.: próxima reunião de segunda-feira');
 let evidence=field('Que sinal observável indicará avanço?', 'evidence',old.evidence,'Ex.: registrei os riscos antes da decisão');
 let review=field('O que aprendi na prática?', 'review',old.review,'Registre o que funcionou, limites e ajustes...',true);
 const actions=el('div','plan-actions');actions.append(action('Salvar plano',()=>{
  local.plans[p.sigla]={focus:sel.value,when:where.value.trim(),evidence:evidence.value.trim(),review:review.value.trim(),done:Boolean(old.done),updatedAt:new Date().toISOString()};persist();notice('Plano salvo neste navegador.');render();
 },'btn primary'));
 if(old.focus){actions.append(action(old.done?'↶ Reabrir plano':'✓ Marcar como praticado',()=>{local.plans[p.sigla]={focus:sel.value,when:where.value.trim(),evidence:evidence.value.trim(),review:review.value.trim(),done:!Boolean(old.done),updatedAt:new Date().toISOString()};persist();render();notice('Status do plano atualizado.')},'btn'))}
 form.append(actions);box.append(form);
 if(old.focus){let s=el('div','plan-summary');s.append(badge(old.done?'✓ Experimentado':'Em andamento',old.done?'success':''),paragraph('Última atualização: '+(old.updatedAt?new Date(old.updatedAt).toLocaleDateString('pt-BR'):'sem data'),'muted'));box.append(s)}
 box.append(paragraph('Privacidade: o plano é pessoal e fica apenas neste navegador, podendo ser acessado por outras pessoas que usem o mesmo dispositivo.','reader-disclaimer'));
 return box;
}

async function copyText(text){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return true;}let t=el('textarea');t.value=text;t.style.position='fixed';t.style.left='-9999px';document.body.append(t);t.select();let ok=document.execCommand('copy');t.remove();return ok}catch{return false}}
function notesBlock(root,r){const wrap=el('section','notes-box');wrap.append(title('Minhas anotações',2),paragraph('Registre o que pretende colocar em prática. As notas ficam salvas apenas neste navegador.','muted'));
 let textarea=el('textarea','notes-input');textarea.value=local.notes[r.id]||'';textarea.placeholder='Ex.: usar perguntas abertas na próxima reunião...';textarea.maxLength=3000;textarea.setAttribute('aria-label','Anotações sobre '+r.title);
 let status=el('div','notes-actions');let feedback=el('span','notes-hint','Até 3.000 caracteres');status.append(feedback,action('Salvar anotação',()=>{let v=textarea.value.trim();if(v)local.notes[r.id]=v;else delete local.notes[r.id];persist();notice('Anotação salva neste navegador.');},'btn small primary'));wrap.append(textarea,status);root.append(wrap);}
function drawReader(root){let r=getRecord(state.selected);if(!r){openView('conhecimento');return;}let w=el('div','reader-layout');w.append(action('← Voltar ao acervo',()=>{state.reader=false;state.selected=null;hashUpdate();render()},'back-link'));
 let doc=el('article','reader-article');let head=el('div','reader-head');head.append(el('span','eyebrow',r.kind+'  /  DISC · ACER'),title(r.title,1),paragraph(r.subtitle||'','reader-sub'));
 let t=((r.body||'')+' '+JSON.stringify(r.details||[])).trim().split(/\s+/).length;
 head.append(node('div','reader-meta',[el('span','','◷ '+Math.max(1,Math.ceil(t/190))+' min de leitura'),el('span','','• Conteúdo educacional')]));
 doc.append(head);
 let buttons=el('div','reader-actions');let fav=local.favorites.has(r.id),read=local.read.has(r.id);
 buttons.append(action(fav?'★ Favorito':'☆ Favoritar',()=>{fav?local.favorites.delete(r.id):local.favorites.add(r.id);persist();render();notice(fav?'Removido dos favoritos':'Adicionado aos favoritos')},'btn small '+(fav?'active':'')));
 buttons.append(action(read?'✓ Estudado':'✓ Marcar como estudado',()=>{read?local.read.delete(r.id):local.read.add(r.id);persist();render();notice(read?'Marcação desfeita':'Progresso atualizado')},'btn small '+(read?'active':'')));
 buttons.append(action('↗ Compartilhar',async()=>{let url=new URL(location.href);url.searchParams.delete('embedded');url.hash='item='+encodeURIComponent(r.id);notice(await copyText(url.toString())?'Link copiado':'Não foi possível copiar o link')},'btn small'));
 buttons.append(el('span','action-divider','|'));buttons.append(action('A−',()=>scaleFont(-1),'btn small font-action'),action('A+',()=>scaleFont(1),'btn small font-action'));
 buttons.append(action('▶ Apresentar',()=>openPresenter({record:r.id}),'btn small primary'));
  buttons.append(action('↔ Modo leitura',()=>{document.body.classList.toggle('focus-reading');notice(document.body.classList.contains('focus-reading')?'Modo leitura ativado':'Modo leitura desativado')},'btn small'));
 doc.append(buttons);
 if(r.kind==='Perfis'){let p=PROFILES.find(x=>'perfil:'+x.sigla===r.id);if(p)addProfile(doc,p);}
 else {doc.append(paragraph(r.body||'','reader-lead'));(r.details||[]).forEach(d=>doc.append(listBlock(d.head,d.text)));if(r.points?.length)doc.append(listBlock('Como aplicar',r.points));}
 if(r.alert)doc.append(el('div','caution','Atenção · '+r.alert));
 if(r.url){const link=el('a','source-link','Consultar referência externa  ↗');link.href=r.url;link.target='_blank';link.rel='noopener noreferrer';doc.append(link)}
 notesBlock(doc,r);
 doc.append(paragraph('Uso educacional: tendências comportamentais não definem competência, caráter ou diagnóstico, e não fundamentam decisões automáticas sobre pessoas.','reader-disclaimer'));
 let related=DATA.records.filter(item=>item.id!==r.id&&(item.group===r.group||item.kind===r.kind)).slice(0,3);
 if(related.length){doc.append(sectionLabel('RECOMENDADOS','Continue aprendendo'));showCollection(doc,related)}
 w.append(doc);root.append(w);
}
function scaleFont(step){let now=Number(document.documentElement.style.getPropertyValue('--reader-scale'))||1;let value=Math.max(.85,Math.min(1.35,Number((now+step*.1).toFixed(2))));document.documentElement.style.setProperty('--reader-scale',value)}
function selector(items,val,onChange,label){let box=el('label','select-wrap');box.append(el('span','select-label',label));let s=el('select','tool-select');s.setAttribute('aria-label',label);items.forEach(([value,text])=>{let o=el('option','',text);o.value=value;s.append(o)});s.value=val;s.addEventListener('change',e=>{onChange(e.target.value);render()});box.append(s);return box;}
function compareField(label,a,b){let row=el('div','compare-row');row.append(el('div','compare-row-label',label));for(const data of [a,b]){let col=el('div','compare-value');if(Array.isArray(data)){let ul=el('ul','compact-list');data.slice(0,4).forEach(x=>ul.append(el('li','',x)));col.append(ul)}else col.append(paragraph(data));row.append(col)}return row;}
function scenarioAdvice(p,scenario){return {
 feedback:p.feedback,reuniao:p.comunicacao.slice(0,2),vendas:p.vendas,mudanca:[p.contexto,p.necessidades[0]]
 }[scenario]}
function drawTools(root){let w=el('div','page-layout');w.append(pageHead('FERRAMENTAS INTERATIVAS','Aprenda comparando','Explore perspectivas comportamentais e orientações práticas sem rotular pessoas.'));
 let labcta=el('div','learn-lab');labcta.append(title('Communication Lab · Novidade',2),paragraph('Simule conversas com devolutivas, adapte mensagens e treine a escrita com exercícios.','muted'),action('Abrir laboratório →',()=>openView('laboratorio'),'btn primary'));w.append(labcta);
 let selectrow=el('div','tool-controls');selectrow.append(selector(PROFILES.map(p=>[p.sigla,p.sigla+' · '+p.nome]),state.compare[0],v=>state.compare[0]=v,'Perfil A'));
 selectrow.append(action('⇄',()=>{state.compare.reverse();render()},'swap-btn'));
 selectrow.append(selector(PROFILES.map(p=>[p.sigla,p.sigla+' · '+p.nome]),state.compare[1],v=>state.compare[1]=v,'Perfil B'));
 let panel=el('section','tool-panel');panel.append(node('div','tool-panel-header',[el('div','tool-title-group'),selectrow]));panel.querySelector('.tool-title-group').append(el('p','eyebrow','COMPARADOR DE PERFIS'),title('Duas perspectivas, lado a lado',2));
 const [a,b]=state.compare.map(k=>PROFILES.find(x=>x.sigla===k));let cmp=el('div','comparison');let heads=el('div','compare-headers');heads.append(el('div','compare-row-label','DIMENSÃO'));
 for(const p of [a,b]){let h=el('div','compare-factor');h.append(el('span','mini-factor factor-'+p.sigla,p.sigla),node('span','compare-factor-text',[el('strong','',p.nome),el('small','',p.rotulo)]));heads.append(h)}cmp.append(heads);
 [['Essência',a.essencia,b.essencia],['Possíveis forças',a.forcas,b.forcas],['Comunicação',a.comunicacao,b.comunicacao],['Pontos de atenção',a.riscos,b.riscos],['Desenvolvimento',a.desenvolvimento,b.desenvolvimento]].forEach(([name,x,y])=>cmp.append(compareField(name,x,y)));
 panel.append(cmp,paragraph('Comparações apresentam hipóteses contextuais. Pessoas podem agir de formas diferentes conforme situação, experiência e preferência declarada.','tool-caution'));w.append(panel);
 let matrix=el('section','tool-panel matrix-panel');matrix.append(el('p','eyebrow','MATRIZ DE COMUNICAÇÃO'),title('Como conversar melhor?',2),paragraph('Selecione quem comunica e a perspectiva usada para a pessoa interlocutora. Confirme sempre as preferências reais.','muted'));
 let ctrls=el('div','matrix-controls');ctrls.append(selector(PROFILES.map(p=>[p.sigla,p.sigla+' · '+p.nome]),state.matrix[0],v=>state.matrix[0]=v,'Quem comunica'));
 ctrls.append(selector(PROFILES.map(p=>[p.sigla,p.sigla+' · '+p.nome]),state.matrix[1],v=>state.matrix[1]=v,'Interlocutor'));
 ctrls.append(selector(Object.entries(SCENARIOS),state.scenario,v=>state.scenario=v,'Situação'));matrix.append(ctrls);
 const rec=getRecord('matriz:'+state.matrix[0]+'-'+state.matrix[1]);
 let tip=el('div','matrix-tip');tip.append(el('span','eyebrow','ORIENTAÇÃO INICIAL'),title(rec?rec.body:'Converse com clareza e valide o entendimento.',3));
 if(rec?.details)rec.details.forEach(d=>tip.append(listBlock(d.head,d.text,'compact')));
 let target=PROFILES.find(p=>p.sigla===state.matrix[1]);
 tip.append(listBlock('Aplicação na situação: '+SCENARIOS[state.scenario],scenarioAdvice(target,state.scenario)));
 tip.append(paragraph('Exemplo para reflexão, não uma regra baseada no perfil presumido de alguém.','tool-caution'));matrix.append(tip);w.append(matrix);
 root.append(w);
}
function drawLearn(root){let w=el('div','page-layout');w.append(pageHead('APRENDER','Trilhas de aprendizagem','Dez módulos com objetivos, atividades e exercícios de reflexão. Esta etapa é uma trilha de leitura, não um curso certificado.'));
 let lab=el('div','learn-lab');lab.append(title('Treine com 12 situações reais',2),paragraph('Explore comunicação, liderança e vendas para cada fator, sem testes ou diagnósticos.','muted'));let start=el('div','learn-lab-actions');for(const p of PROFILES){start.append(action('Praticar '+p.sigla,()=>{openRecord('perfil:'+p.sigla);state.profileTab='praticar';render()},'btn small'))}lab.append(start);lab.append(action('Explorar 8 conversas guiadas →',()=>openView('laboratorio'),'btn subtle'));w.append(lab);
 let courses=DATA.records.filter(x=>x.kind==='Cursos');let completed=courses.filter(x=>local.read.has(x.id)).length;
 let sum=el('div','learning-overview');sum.append(stat('10','Módulos de estudo'),stat(completed,'Módulos estudados'));let bar=el('div','learn-track');bar.append(el('strong','','Seu progresso'),progressBar(completed,courses.length),paragraph(completed+' de '+courses.length+' módulos marcados como estudados','muted'));sum.append(bar);w.append(sum);
 let grid=el('div','course-grid');courses.forEach((r,i)=>{let b=action('',()=>openRecord(r.id),'course-card');b.append(el('span','course-num',String(i+1).padStart(2,'0')),badge(local.read.has(r.id)?'✓ Estudado':'Módulo de estudo',local.read.has(r.id)?'success':''),title(r.title.replace(/^Módulo \d+ · /,''),3),paragraph(r.subtitle||r.body),el('span','course-open','Acessar módulo  ↗'));grid.append(b)});w.append(grid);root.append(w);
}
function drawMine(root){let w=el('div','page-layout');w.append(pageHead('MINHA BIBLIOTECA','Seu espaço de aprendizagem','Acompanhe leituras, favoritos e anotações armazenados neste navegador.'));
 w.append(node('div','three-stats',[stat(String(local.favorites.size),'Favoritos'),stat(String(local.read.size),'Estudados'),stat(String(practiceCompletion())+'/12','Práticas exploradas'),stat(String(completedLabCount())+'/8','Conversas do Lab')]));
 w.append(action('Acessar minhas práticas no Communication Lab →',()=>openView('laboratorio'),'btn subtle'));
 w.append(sectionLabel('PLANEJE E EXPERIMENTE','Planos de desenvolvimento'));let planGrid=el('div','plans-grid');for(const factor of PROFILES){let plan=local.plans[factor.sigla];let c=action('',()=>{openRecord('perfil:'+factor.sigla);state.profileTab='plano';render()},'plan-card');c.append(el('span','mini-factor factor-'+factor.sigla,factor.sigla),title(factor.nome,3),paragraph(plan?.focus||'Defina um experimento para colocar o aprendizado em prática.','muted'),badge(plan?.done?'✓ Praticado':plan?.focus?'Em andamento':'Criar plano',plan?.done?'success':''));planGrid.append(c)}w.append(planGrid);
 w.append(sectionLabel('EXERCÍCIOS','Práticas situacionais'));let mini=el('div','practice-links');for(const factor of PROFILES){let done=ADVANCED[factor.sigla].situacoes.filter(x=>local.practices[practiceKey(factor,x.id)]?.done).length;mini.append(action(factor.sigla+' · '+factor.nome+'  '+done+'/3',()=>{openRecord('perfil:'+factor.sigla);state.profileTab='praticar';render()},'scenario-pick'))}w.append(mini);
 for(const [subtitle,head,ids,empty] of [
 ['SALVOS','Meus favoritos',[...local.favorites],'Seus conteúdos favoritos aparecerão aqui.'],
 ['HISTÓRICO','Leituras recentes',local.recent,'Explore um conteúdo para começar seu histórico.'],
 ['PROGRESSO','Já estudados',[...local.read],'Marque um material como estudado para acompanhar seu progresso.']]){
 w.append(sectionLabel(subtitle,head));let records=ids.map(getRecord).filter(Boolean);
 if(records.length)showCollection(w,records.slice(0,12));else w.append(paragraph(empty,'placeholder-message'));}
 w.append(el('div','privacy-note','Privacidade: dados locais não são enviados à RealTalent nem sincronizados entre dispositivos. Em navegadores compartilhados, outras pessoas podem ter acesso a esse histórico.'));root.append(w);
}
function drawRefs(root){let w=el('div','page-layout');w.append(pageHead('REFERÊNCIAS','Fundamentos e fontes','Explore a origem do conteúdo, limitações metodológicas e diretrizes de uso responsável.'));
 let call=el('div','reference-note');call.append(title('DISC e ACER: um único conjunto de conceitos',2),paragraph('Nesta biblioteca, ACER é a designação institucional em português para a metodologia DISC. As equivalências específicas das letras A, C, E e R ainda aguardam definição formal. As dimensões são exibidas como D, I, S e C para evitar uma correspondência não confirmada.'));w.append(call);
 w.append(sectionLabel('CONSULTE','Referências externas'));showCollection(w,DATA.records.filter(r=>r.kind==='Fontes'));
 w.append(sectionLabel('LEITURA RESPONSÁVEL','Boas práticas de uso'));
 w.append(listBlock('O que é e o que não é','A biblioteca oferece explicações educacionais e cenários de reflexão. Isso não substitui validação psicométrica, diagnóstico, avaliação profissional ou evidências observáveis.'));
 w.append(listBlock('Privacidade e contexto','Use informações comportamentais com finalidade clara, acesso restrito e consentimento ou outra base legal adequada ao contexto. Não use perfis como critério isolado para contratar, promover ou desligar.'));
 root.append(w);
}
// Communication Lab V3.2: atividades educacionais locais, sem diagnósticos ou chamadas externas.
function completedLabCount(){return LAB.cenarios.filter(s=>local.lab.finished[s.id]).length}
function completedWritingCount(){return LAB.exercicios.filter(s=>local.lab.writing[s.id]?.done).length}
function launchLabScene(id){
 if(!LAB.cenarios.some(s=>s.id===id))return;
 state.labScene=id;state.labStep=0;state.labPick=null;state.labAnswers=[];state.labFinished=false;state.labTab='simulacoes';openView('laboratorio');
}
function labTabs(root){
 const tabs=el('div','lab-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Áreas do laboratório');
 for(const [id,label] of [['simulacoes','Simulações'],['mensagens','Adaptar mensagens'],['exercicios','Exercícios de escrita']]){
  const tab=action(label,()=>{state.labTab=id;state.labScene=null;state.labExercise=null;render()},'lab-tab'+(state.labTab===id?' active':''));
  tab.setAttribute('aria-pressed',String(state.labTab===id));tabs.append(tab);
 }root.append(tabs);
}
function labPerspective(root){
 const box=el('div','lab-perspective');
 box.append(selector(PROFILES.map(p=>[p.sigla,p.sigla+' · '+p.nome]),state.labFactor,v=>state.labFactor=v,'Perspectiva que deseja explorar'));
 const text=el('div','lab-perspective-body');text.append(title('Pistas de comunicação para reflexão',3));
 let ul=el('ul','compact-list');LAB.dicas_fatores[state.labFactor].forEach(d=>ul.append(el('li','',d)));text.append(ul);box.append(text);
 box.append(paragraph('Escolher uma perspectiva não significa identificar a personalidade da outra pessoa. Prefira perguntar como ela deseja conversar.','tool-caution'));
 root.append(box);
}
function labSceneList(root){
 const row=el('div','lab-filter');row.append(selector([['Todas','Todas as áreas'],...['Liderança','Vendas','Comunicação','Atendimento'].map(x=>[x,x])],state.labArea,v=>state.labArea=v,'Filtrar situações'));root.append(row);
 const cards=el('div','lab-card-grid');
 LAB.cenarios.filter(s=>state.labArea==='Todas'||s.area===state.labArea).forEach(s=>{
  const b=action('',()=>launchLabScene(s.id),'lab-scene-card');
  b.append(node('div','lab-card-top',[el('span','eyebrow',s.area),badge(local.lab.finished[s.id]?'✓ Concluída':'3 etapas',local.lab.finished[s.id]?'success':'')]));
  b.append(title(s.titulo,3),paragraph(s.contexto,'muted'),el('span','lab-card-cta',local.lab.finished[s.id]?'Praticar novamente →':'Iniciar conversa →'));
  cards.append(b);
 });root.append(cards);
}
function labSceneEngine(root){
 const s=LAB.cenarios.find(x=>x.id===state.labScene);if(!s){state.labScene=null;labSceneList(root);return;}
 const w=el('div','lab-conversation');
 w.append(action('← Todos os cenários',()=>{state.labScene=null;state.labPick=null;render()},'back-link'));
 let head=el('div','lab-scene-head');head.append(el('span','eyebrow','SIMULAÇÃO · '+s.area),title(s.titulo,2),paragraph(s.contexto,'muted'));w.append(head);
 const complete=state.labFinished;
 const pos=complete?s.etapas.length:state.labStep;
 let track=el('div','lab-step-indicator');track.append(el('strong','',complete?'Cenário concluído':'Etapa '+(pos+1)+' de '+s.etapas.length),progressBar(pos+(complete?0:1),s.etapas.length));w.append(track);
 const transcript=el('div','lab-transcript');transcript.setAttribute('aria-label','Conversa simulada');
 function bubble(role,message,cls){let n=el('div','lab-bubble '+cls);n.append(el('span','lab-bubble-role',role),paragraph(message));transcript.append(n)}
 for(let i=0;i<Math.min(pos,s.etapas.length);i++){
   const turn=s.etapas[i],choice=s.etapas[i].alternativas[state.labAnswers[i]];
   bubble(s.interlocutor,turn.fala,'other');if(choice){bubble('Você',choice.texto,'self');bubble(s.interlocutor,choice.resposta,'other');}
 }
 if(!complete){const turn=s.etapas[pos];bubble(s.interlocutor,turn.fala,'other');
   if(state.labPick!==null){const choice=turn.alternativas[state.labPick];bubble('Você',choice.texto,'self');bubble(s.interlocutor,choice.resposta,'other');}
 }
 w.append(transcript);
 if(!complete){const turn=s.etapas[pos],panel=el('section','lab-choice-panel');panel.append(title(turn.pergunta,3));
   const choices=el('div','lab-choice-list');turn.alternativas.forEach((option,i)=>{
    const b=action('',()=>{state.labPick=i;render()},'lab-choice'+(state.labPick===i?' selected':''));
    b.setAttribute('aria-pressed',String(state.labPick===i));b.append(el('span','choice-letter',String.fromCharCode(65+i)),el('span','',option.texto));choices.append(b);
   });panel.append(choices);
   if(state.labPick!==null){const option=turn.alternativas[state.labPick];let feedback=el('div','lab-feedback');feedback.setAttribute('role','status');feedback.append(el('span','eyebrow','DEVOLUTIVA DA ESCOLHA'),paragraph(option.feedback));
    panel.append(feedback,action(pos===s.etapas.length-1?'Concluir cenário ✓':'Continuar conversa →',()=>{
     state.labAnswers.push(state.labPick);state.labPick=null;
     if(state.labStep===s.etapas.length-1){state.labFinished=true;local.lab.finished[s.id]={...local.lab.finished[s.id],date:new Date().toISOString(),answers:[...state.labAnswers]};persist();notice('Simulação concluída neste navegador.');}
     else state.labStep++;
     render();
    },'btn primary'));
   }w.append(panel);
 }else{
   let result=el('div','lab-finish');result.append(el('span','eyebrow','FIM DA SIMULAÇÃO'),title('Conversa explorada',2),paragraph('Você analisou três decisões e suas consequências ilustrativas. Não existe uma pontuação de personalidade nem uma resposta universal.','muted'));
   let reflection=el('label','plan-label');reflection.append(el('span','','O que você aplicaria em uma conversa real?'));
   let input=el('textarea','plan-input');input.maxLength=1800;input.value=local.lab.finished[s.id]?.reflection||'';input.placeholder='Escreva uma ação observável para a próxima conversa...';reflection.append(input);result.append(reflection);
   let actions=el('div','lab-actions');actions.append(action('Salvar reflexão',()=>{local.lab.finished[s.id].reflection=input.value.trim().slice(0,1800);persist();notice('Reflexão salva localmente.');},'btn primary'));
   actions.append(action('Reiniciar cenário',()=>launchLabScene(s.id),'btn'));
   result.append(actions);w.append(result);
 }root.append(w);
}
function drawLabSimulations(root){
 let intro=el('div','lab-intro');intro.append(title('Conversas para experimentar',2),paragraph('Oito situações fictícias, com três decisões cada e devolutivas de aprendizagem. Suas escolhas não geram um perfil DISC/ACER.','muted'));
 root.append(intro);labPerspective(root);if(state.labScene)labSceneEngine(root);else labSceneList(root);
}
function labInput(label,value,placeholder,maxLen=800,multi=false){
 let wrap=el('label','plan-label');wrap.append(el('span','',label));let n=el(multi?'textarea':'input','plan-input');
 if(!multi)n.type='text';n.maxLength=maxLen;n.placeholder=placeholder;n.value=value||'';wrap.append(n);return [wrap,n];
}
function labDraftVariants(d){
 const message=d.message.replace(/\s+/g,' ').trim().slice(0,800);
 const goal=(d.goal||'alinhar expectativas').replace(/\s+/g,' ').trim().slice(0,200);
 const next=(d.next||'confirmar o próximo passo').replace(/\s+/g,' ').trim().slice(0,200);
 const deadline=d.when?.trim()?` Prazo ou retorno: ${d.when.trim().slice(0,120)}.`:'';
 const context=(d.context||'Reunião').toLowerCase();
 return {
 D:`Sobre ${context}: ${message}\nObjetivo: ${goal}.\nPróximo passo proposto: ${next}.${deadline}\nHá algum impedimento que precisamos resolver?`,
 I:`Olá! Quero alinhar um ponto sobre ${context}: ${message}\nA ideia é ${goal}. Podemos construir juntos o próximo passo: ${next}?${deadline}\nO que você acha?`,
 S:`Quero conversar com clareza sobre ${context}, respeitando o contexto de todos. ${message}\nNosso objetivo é ${goal}. Minha sugestão é ${next}.${deadline}\nQue apoio ou ajuste facilitaria esse caminho?`,
 C:`Assunto: ${context}.\nInformação de partida: ${message}\nObjetivo: ${goal}.\nEncaminhamento a verificar: ${next}.${deadline}\nQuais critérios ou informações faltam para confirmar o acordo?`
 };
}
function drawLabMessages(root){
 root.append(title('Adaptador de mensagens',2),paragraph('Crie quatro versões orientativas da mesma comunicação. Os modelos reorganizam o seu texto; não interpretam o significado com IA e não enviam mensagens. Revise fatos, destinatário e tom antes de usar.','muted'));
 const form=el('div','lab-message-form');const d=state.labDraft;
 let [orig,origInput]=labInput('Mensagem original *',d.message,'Ex.: Precisamos revisar o prazo da entrega.',800,true);origInput.addEventListener('input',e=>d.message=e.target.value);form.append(orig);
 let [goal,goalInput]=labInput('Objetivo da conversa',d.goal,'Ex.: Definir um prazo realista.',200);goalInput.addEventListener('input',e=>d.goal=e.target.value);form.append(goal);
 let [next,nextInput]=labInput('Próximo passo desejado',d.next,'Ex.: Confirmar prioridades com a equipe.',200);nextInput.addEventListener('input',e=>d.next=e.target.value);form.append(next);
 let [when,whenInput]=labInput('Prazo ou momento (opcional)',d.when,'Ex.: Até sexta-feira.',120);whenInput.addEventListener('input',e=>d.when=e.target.value);form.append(when);
 form.append(selector(LAB.contextos.map(x=>[x,x]),d.context,v=>{d.context=v;state.labVariants=null;},'Contexto profissional'));
 const buttons=el('div','lab-actions');buttons.append(action('Gerar quatro propostas →',()=>{
   if(d.message.trim().length<10){notice('Descreva a mensagem original com pelo menos 10 caracteres.');origInput.focus();return;}
   state.labVariants=labDraftVariants(d);state.labEdited={...state.labVariants};local.lab.lastDraft={...d};persist();render();notice('Quatro modelos orientativos preparados.');
 },'btn primary'));
 buttons.append(action('Limpar campos',()=>{state.labDraft={message:'',goal:'',next:'',when:'',context:'Feedback'};state.labVariants=null;state.labEdited={};delete local.lab.lastDraft;persist();render()},'btn'));
 form.append(buttons);root.append(form);
 if(state.labVariants){let out=el('section','lab-variants');out.append(sectionLabel('MODELOS REVISÁVEIS','Quatro perspectivas de comunicação'));
  let grid=el('div','lab-variants-grid');for(const p of PROFILES){let box=el('div','lab-variant');box.append(el('span','mini-factor factor-'+p.sigla,p.sigla),title(p.nome,3),paragraph(LAB.dicas_fatores[p.sigla][0],'muted'));
    let area=el('textarea','lab-variant-text');area.value=state.labEdited[p.sigla]||state.labVariants[p.sigla];area.maxLength=2100;area.setAttribute('aria-label','Texto sugerido para '+p.nome);area.addEventListener('input',e=>state.labEdited[p.sigla]=e.target.value);box.append(area);
    box.append(action('Copiar texto',async()=>notice(await copyText(area.value)?'Mensagem copiada.':'Selecione o texto e copie manualmente.'),'btn small'));grid.append(box);
  }out.append(grid,paragraph('Estas versões são estruturas didáticas, não previsões de reação de indivíduos. Confirme as preferências de quem receberá a mensagem.','tool-caution'));root.append(out);
 }
}
function drawLabExercises(root){
 root.append(title('Exercícios de escrita',2),paragraph('Escreva uma resposta contextualizada e use a lista de verificação para revisar o próprio texto. Não há correção automática nem nota de personalidade.','muted'));
 let overview=el('div','lab-writing-progress');overview.append(el('strong','',completedWritingCount()+' de '+LAB.exercicios.length+' exercícios concluídos'),progressBar(completedWritingCount(),LAB.exercicios.length));root.append(overview);
 let picks=el('div','lab-exercise-grid');LAB.exercicios.forEach(ex=>{const active=state.labExercise===ex.id;let b=action('',()=>{state.labExercise=ex.id;render()},'lab-exercise-card'+(active?' active':''));b.append(el('span','eyebrow',ex.area),title(ex.titulo,3),badge(local.lab.writing[ex.id]?.done?'✓ Concluído':'Escrever',local.lab.writing[ex.id]?.done?'success':''));picks.append(b)});root.append(picks);
 const ex=LAB.exercicios.find(x=>x.id===state.labExercise)||LAB.exercicios[0];
 if(!state.labExercise)state.labExercise=ex.id;
 let form=el('section','lab-write-workbench');form.append(el('span','eyebrow','SITUAÇÃO · '+ex.area),title(ex.titulo,2),paragraph(ex.situacao,'lab-situation'),title('Sua tarefa',3),paragraph(ex.tarefa));
 let [wrap,input]=labInput('Sua resposta',local.lab.writing[ex.id]?.text||'','Escreva sua versão aqui. Inclua fatos, tom e próximo passo.',2500,true);form.append(wrap);
 form.append(title('Checklist de revisão',3));let checklist=el('ul','lab-checklist');ex.criterios.forEach(s=>{let li=el('li','');li.append(el('span','lab-check-icon','○'),el('span','',s));checklist.append(li)});form.append(checklist);
 let buttons=el('div','lab-actions');buttons.append(action('Salvar rascunho',()=>{local.lab.writing[ex.id]={...(local.lab.writing[ex.id]||{}),text:input.value.slice(0,2500)};persist();notice('Rascunho salvo neste navegador.')},'btn'));
 buttons.append(action(local.lab.writing[ex.id]?.done?'Atualizar exercício concluído':'Marcar como concluído',()=>{
   if(input.value.trim().length<20){notice('Escreva ao menos 20 caracteres antes de concluir.');input.focus();return;}
   local.lab.writing[ex.id]={text:input.value.slice(0,2500),done:true,date:new Date().toISOString()};persist();render();notice('Exercício concluído e salvo localmente.');
 },'btn primary'));form.append(buttons);root.append(form);
}
function drawLab(root){
 const w=el('div','page-layout lab-page');w.append(pageHead('COMMUNICATION LAB · V3.2','Treine conversas que importam','Experimente decisões, adapte mensagens e pratique comunicação respeitosa em situações de trabalho.'));
 const stats=el('div','lab-overview');stats.append(stat(String(completedLabCount())+' / 8','Conversas concluídas'),stat(String(completedWritingCount())+' / 6','Exercícios realizados'),stat('4','Modelos de mensagem'));w.append(stats);
 labTabs(w);
 if(state.labTab==='simulacoes')drawLabSimulations(w);
 else if(state.labTab==='mensagens')drawLabMessages(w);
 else drawLabExercises(w);
 w.append(el('div','privacy-note','Privacidade: mensagens, respostas e reflexões permanecem neste navegador. Não são enviadas à RealTalent, a um modelo de IA ou ao Supabase. Não inclua dados sensíveis de clientes em dispositivos compartilhados.'));
 const reset=action('Apagar somente meus dados do Communication Lab',()=>{
  if(!window.confirm('Excluir cenários concluídos, exercícios e último rascunho deste navegador? Favoritos e outros dados da biblioteca serão preservados.'))return;
  local.lab={finished:{},writing:{}};state.labScene=null;state.labExercise=null;state.labVariants=null;state.labEdited={};state.labDraft={message:'',goal:'',next:'',when:'',context:'Feedback'};persist();render();notice('Dados do laboratório apagados deste navegador.');
 },'lab-reset');w.append(reset);root.append(w);
}


/* V11.3 — a Biblioteca guarda materiais; o Apresentador apenas os exibe. */
const presentationStore=window.RTPresentationLibrary;
function openPresenter(selection){
 if(!presentationStore)return notice('Apresentador indisponível. Atualize esta página.');
 const session=qs.get('session')||'';
 const url=presentationStore.presenterURL({...selection,session});
 const w=window.open(url,'_blank','noopener,noreferrer');
 if(!w)notice('Permita a abertura de uma nova aba para apresentar este material.');
}
async function importPresentationFiles(files){
 if(!presentationStore)return notice('Armazenamento indisponível.');
 const {items,errors}=await presentationStore.importFiles(files);
 if(items.length)notice(items.length+' arquivo(s) importado(s) somente neste navegador.');
 if(errors.length)window.alert(errors.join('\n'));
 render();
}
function drawFiles(root){
 const w=el('div','page-layout rt-v113-files');
 w.append(pageHead('ACERVO DO PROFISSIONAL','Meus arquivos','Importe documentos prontos para apresentar. Não é necessário recriar slides ou modificar o arquivo original.'));
 const panel=el('section','rt-v113-upload');
 const intro=el('div');intro.append(title('Trazer materiais para a Biblioteca',2),paragraph('PDF, PNG, JPEG ou WebP · até 25 MB por arquivo · armazenamento somente neste navegador.','muted'));
 const controls=el('div','rt-v113-import-actions');
 const label=el('label','rt-v113-upload-btn','+ Importar materiais');
 const input=el('input');input.type='file';input.multiple=true;input.accept='.pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp';
 input.setAttribute('aria-label','Importar arquivos para apresentar');
 input.addEventListener('change',e=>{const files=[...e.target.files];e.target.value='';void importPresentationFiles(files);});
 label.append(input);controls.append(label);
 panel.append(intro,controls);w.append(panel);
 const noticePanel=el('div','rt-v113-tip');
 noticePanel.append(paragraph('PowerPoint (PPTX): exporte para PDF antes de importar, preservando a diagramação. Arquivos ficam neste dispositivo, sem sincronização ou proteção adequada para dados reais.'));
 w.append(noticePanel);
 const entries=presentationStore?.metadata()||[];
 const heading=sectionLabel('ARQUIVOS IMPORTADOS','Materiais disponíveis',el('span','rt-v113-count',entries.length+' arquivo(s)'));
 w.append(heading);
 if(!entries.length){
  const empty=el('div','rt-v113-empty');
  empty.append(title('Nenhum material importado',3),paragraph('Adicione uma apresentação em PDF ou imagem. Depois clique em Apresentar para abrir o visualizador profissional.'));
  w.append(empty);
 }else{
  const search=el('input','rt-v113-search');search.type='search';search.placeholder='Filtrar materiais...';search.setAttribute('aria-label','Filtrar materiais importados');
  w.append(search);
  const grid=el('div','rt-v113-list');w.append(grid);
  function fill(){
   grid.replaceChildren();
   const q=norm(search.value);
   const matching=entries.filter(x=>norm(x.title+' '+x.fileName).includes(q));
   if(!matching.length){grid.append(paragraph('Nenhum arquivo corresponde à pesquisa.','muted'));return;}
   for(const item of matching){
    const card=el('article','rt-v113-file');
    const ico=el('div','rt-v113-file-icon',item.mime==='application/pdf'?'PDF':'IMG');
    const info=el('div','rt-v113-file-info');
    info.append(title(item.title,3),paragraph(item.fileName+' · '+Math.max(1,Math.round(item.size/1024))+' KB','muted'));
    const actions=el('div','rt-v113-card-actions');
    actions.append(action('▶ Apresentar',()=>openPresenter({file:item.id}),'btn primary'));
    actions.append(action(item.favorite?'★':'☆',()=>{presentationStore.change(item.id,{favorite:!item.favorite});render();},'btn small'));
    actions.append(action('Renomear',()=>{const name=window.prompt('Título do material',item.title);if(name&&name.trim()){presentationStore.change(item.id,{title:name});render();}},'btn small'));
    actions.append(action('Excluir',async()=>{if(!window.confirm('Excluir este arquivo local da Biblioteca? Essa ação não pode ser desfeita.'))return;
      try{await presentationStore.remove(item.id);render();notice('Arquivo excluído do navegador.');}catch{notice('Não foi possível excluir o arquivo.');}},'btn small'));
    card.append(ico,info,actions);grid.append(card);
   }
  }search.addEventListener('input',fill);fill();
 }
 root.append(w);
}

function render(){drawNav();$('location-name').textContent=VIEWS.find(x=>x[0]===state.view)?.[2]||'Início';let root=$('screen');root.replaceChildren();
 if(state.reader&&state.selected){drawReader(root);return}
 ({inicio:drawHome,conhecimento:drawKnowledge,ferramentas:drawTools,aprender:drawLearn,laboratorio:drawLab,arquivos:drawFiles,minha:drawMine,referencias:drawRefs}[state.view]||drawHome)(root);
}
function fromHash(){let h=location.hash.slice(1);if(h.startsWith('item=')){let id;try{id=decodeURIComponent(h.slice(5))}catch{};if(valid.has(id)){state.reader=true;state.view='conhecimento';state.selected=id;return}}
 if(h.startsWith('view=')){let view=h.slice(5);if(VIEWS.some(x=>x[0]===view)){state.view=view;state.reader=false;state.selected=null}}}
$('mobile-menu').addEventListener('click',showMenu);$('mobile-shade').addEventListener('click',hideMenu);
$('brand-home').addEventListener('click',e=>{e.preventDefault();openView('inicio')});
$('theme-switch').addEventListener('click',()=>setTheme(local.theme==='dark'?'light':'dark'));
$('query').addEventListener('input',e=>{state.query=e.target.value;state.view='conhecimento';state.reader=false;hashUpdate();render()});
$('query').addEventListener('keydown',e=>{if(e.key==='Escape'){$('query').value='';state.query='';render()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideMenu();if((e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')){e.preventDefault();$('query').focus();$('query').select()}});
window.addEventListener('hashchange',()=>{fromHash();render()});
fromHash();document.body.classList.toggle('embedded',embedded);setTheme(qs.get('theme')==='dark'?'dark':(sharedTheme()||(embedded?'dark':local.theme)));render();
