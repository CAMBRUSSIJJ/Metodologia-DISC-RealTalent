/* RealTalent V11.2 — Apresentações protegidas por Supabase RLS.
   Sem localStorage, links blob, arquivos, notas privadas ou autenticação simulada.
   Execute apenas na origem isolada do Beta dedicado, após migrations V10 e V11.2. */
const TABLES=Object.freeze({
  decks:'rt_secure_presentations',
  slides:'rt_secure_presentation_slides',
  records:'rt_secure_records'
});
const TYPES=Object.freeze({cover:'Capa',text:'Texto',question:'Pergunta',library:'Biblioteca'});
const THEMES=Object.freeze({ocean:'Azul RealTalent',light:'Claro',dark:'Noturno'});
let openDeckId=null,activeCaseId=null;
function el(tag,value,cls){
  const node=document.createElement(tag);
  if(value!==undefined)node.textContent=String(value);
  if(cls)node.className=cls;
  return node;
}
function button(text,callback,style='secondary'){
  const node=el('button',text,style);node.type='button';node.addEventListener('click',callback);return node;
}
function field(label,input){
  const wrap=el('label',label);
  wrap.append(input);return wrap;
}
function optionSelect(options){
  const node=document.createElement('select');
  for(const [value,text] of options)node.add(new Option(text,value));return node;
}
async function request(query){
  const {data,error}=await query;
  if(error)throw error;
  return data;
}
function clean(text,n){return String(text??'').trim().slice(0,n);}
function announce(report,error){report(error?.message||String(error),true);}
export function sanitizeSlideDraft(raw){
  if(!raw||!Object.hasOwn(TYPES,raw.kind))throw new Error('Tipo de slide não autorizado.');
  const title=clean(raw.title,130);
  if(!title)throw new Error('Título do slide obrigatório.');
  return {kind:raw.kind,title,subtitle:clean(raw.subtitle,280),
    body:clean(raw.body,1200),theme:Object.hasOwn(THEMES,raw.theme)?raw.theme:'ocean'};
}

async function querySlides(db,presentationId,caseId){
  return await request(db.from(TABLES.slides)
    .select('id,position,kind,title,subtitle,body,theme')
    .eq('case_id',caseId).eq('presentation_id',presentationId)
    .order('position',{ascending:true}));
}
export async function showProfessionalPresentations({db,user,caseId,caseStatus,root,report}){
  root.replaceChildren();
  if(!db||!user||!caseId)return root.append(el('p','Escolha primeiro um processo autenticado.','hint'));
  if(activeCaseId!==caseId){activeCaseId=caseId;openDeckId=null;}
  const heading=el('h3','Apresentações seguras · Beta');
  root.append(heading,el('p','Crie slides educativos de texto e relacione-os a uma sessão. Tudo permanece privado até confirmação explícita. Sem importação de arquivos.','hint'));
  let sessions,decks;
  try{
    [sessions,decks]=await Promise.all([
      request(db.from(TABLES.records).select('id,title,visibility')
        .eq('case_id',caseId).eq('record_type','session').order('created_at',{ascending:false})),
      request(db.from(TABLES.decks).select('id,title,visibility,session_record_id')
        .eq('case_id',caseId).order('created_at',{ascending:false}))
    ]);
  }catch(error){announce(report,error);return;}
  if(caseStatus!=='active'){
    root.append(el('p','Processo encerrado: conteúdo somente leitura.','hint'));
  }else{
    const form=el('form',undefined,'secure-present-form');
    const picker=optionSelect((sessions||[]).map(s=>[s.id,s.title]));
    picker.required=true;
    const title=document.createElement('input');title.name='title';title.required=true;title.minLength=3;title.maxLength=100;title.placeholder='Apresentação demonstrativa';
    const submit=el('button','Criar apresentação privada');submit.type='submit';
    form.append(field('Sessão',picker),field('Título',title),submit);
    if(!sessions?.length){submit.disabled=true;root.append(el('p','Crie primeiro um registro do tipo Sessão no processo.','hint'))}
    form.addEventListener('submit',async event=>{
      event.preventDefault();submit.disabled=true;
      try{
        const result=await request(db.from(TABLES.decks).insert({
          case_id:caseId,session_record_id:picker.value,author_user_id:user.id,
          title:clean(title.value,100),visibility:'private'
        }).select('id').single());
        openDeckId=result.id;report('Apresentação privada criada.');await showProfessionalPresentations({db,user,caseId,caseStatus,root,report});
      }catch(err){announce(report,err)}
      finally{submit.disabled=false;}
    });
    root.append(form);
  }
  const list=el('div',undefined,'entries');
  for(const d of decks||[]){
    const row=el('article',undefined,'entry secure-presentation-row');
    row.append(el('strong',d.title),el('small',d.visibility==='shared'?'Compartilhado':'Privado'));
    row.append(button('Abrir roteiro',()=>{openDeckId=d.id;void showProfessionalPresentations({db,user,caseId,caseStatus,root,report})}));
    list.append(row);
  }
  if(!decks?.length)list.append(el('p','Nenhuma apresentação deste processo.','hint'));
  root.append(list);
  const focused=(decks||[]).find(d=>d.id===openDeckId);
  if(focused)await showEditor({db,user,caseId,caseStatus,root,report,deck:focused,sessions});
}
async function showEditor({db,user,caseId,caseStatus,root,report,deck,sessions}){
  const wrap=el('section',undefined,'secure-deck-editor');
  wrap.append(el('h4',deck.title));
  const active=caseStatus==='active',privateDeck=deck.visibility==='private';
  const session=sessions.find(s=>s.id===deck.session_record_id);
  wrap.append(el('p','Sessão: '+(session?.title||'Sessão não encontrada')+' · '+(privateDeck?'Privada':'Compartilhada'),'hint'));
  const slides=await querySlides(db,deck.id,caseId).catch(err=>{announce(report,err);return null});
  if(!slides){root.append(wrap);return;}
  for(const slide of slides){
    const card=el('article',undefined,'entry secure-slide');
    card.append(el('small',(slide.position)+'. '+(TYPES[slide.kind]||slide.kind)),el('strong',slide.title));
    if(slide.subtitle)card.append(el('p',slide.subtitle));
    if(slide.body)card.append(el('p',slide.body,'secure-slide-text'));
    if(active&&privateDeck){
      card.append(button('Remover slide',async()=>{
        if(!confirm('Excluir este slide do roteiro privado?'))return;
        try{await request(db.from(TABLES.slides).delete().eq('case_id',caseId).eq('presentation_id',deck.id).eq('id',slide.id));
          report('Slide removido.');await showProfessionalPresentations({db,user,caseId,caseStatus,root,report});
        }catch(err){announce(report,err)}
      }));
    }
    wrap.append(card);
  }
  if(active&&privateDeck){
    const form=el('form',undefined,'secure-slide-form');
    const kind=optionSelect(Object.entries(TYPES));
    const title=document.createElement('input');title.required=true;title.minLength=1;title.maxLength=130;title.placeholder='Título do slide';
    const subtitle=document.createElement('input');subtitle.maxLength=280;subtitle.placeholder='Subtítulo (opcional)';
    const body=document.createElement('textarea');body.maxLength=1200;body.rows=4;body.placeholder='Texto educativo de demonstração, sem informações de clientes';
    const theme=optionSelect(Object.entries(THEMES));
    const submit=el('button','Adicionar slide');submit.type='submit';
    form.append(field('Tipo',kind),field('Título',title),field('Subtítulo',subtitle),field('Conteúdo',body),field('Tema',theme),submit);
    form.addEventListener('submit',async event=>{
      event.preventDefault();submit.disabled=true;
      try{
        if(slides.length>=40)throw new Error('Limite de 40 slides por apresentação.');
        const position=slides.length?Math.max(...slides.map(x=>x.position))+1:1;
        const draft=sanitizeSlideDraft({kind:kind.value,title:title.value,
          subtitle:subtitle.value,body:body.value,theme:theme.value});
        await request(db.from(TABLES.slides).insert({
          case_id:caseId,presentation_id:deck.id,position,...draft
        }));
        report('Slide salvo no banco.');await showProfessionalPresentations({db,user,caseId,caseStatus,root,report});
      }catch(err){announce(report,err)}
      finally{submit.disabled=false;}
    });
    wrap.append(form);
  }
  if(active){
    const controls=el('div',undefined,'secure-presentation-controls');
    if(privateDeck){
      const share=button('Compartilhar com participante',async()=>{
        if(!slides.length||!session||session.visibility!=='shared')
          return report('É necessário adicionar slides e compartilhar primeiro o registro da sessão.',true);
        if(!confirm('Liberar estes '+slides.length+' slides educativos ao participante vinculado?'))return;
        try{
          const update=await request(db.from(TABLES.decks).update({visibility:'shared'})
            .eq('id',deck.id).eq('case_id',caseId).select('id'));
          if(!update?.length)throw new Error('A publicação foi recusada pelas políticas de acesso.');
          report('Apresentação compartilhada via RLS.');await showProfessionalPresentations({db,user,caseId,caseStatus,root,report});
        }catch(err){announce(report,err)}
      });
      controls.append(share);
    }else{
      controls.append(button('Retirar compartilhamento',async()=>{
        try{
          const updated=await request(db.from(TABLES.decks).update({visibility:'private'})
            .eq('id',deck.id).eq('case_id',caseId).select('id'));
          if(!updated?.length)throw new Error('Não foi possível retirar este material.');
          report('Acesso do participante revogado no banco.');await showProfessionalPresentations({db,user,caseId,caseStatus,root,report});
        }catch(err){announce(report,err)}
      }));
    }
    controls.append(button('Excluir apresentação',async()=>{
      if(!confirm('Excluir este roteiro e seus slides?'))return;
      try{await request(db.from(TABLES.decks).delete().eq('id',deck.id).eq('case_id',caseId));
        openDeckId=null;report('Apresentação excluída.');await showProfessionalPresentations({db,user,caseId,caseStatus,root,report});
      }catch(err){announce(report,err)}
    }));
    wrap.append(controls);
  }
  if(!privateDeck)wrap.append(el('p','Para modificar slides publicados, retire primeiro o compartilhamento.','hint'));
  root.append(wrap);
}
export async function showParticipantPresentations({db,cases,root,report}){
  root.replaceChildren(el('h3','Apresentações compartilhadas'),el('p','Apenas slides educativos vinculados à sua conta, conforme autorização verificada no banco.','hint'));
  if(!db||!cases?.length)return root.append(el('p','Nenhum processo autorizado.','hint'));
  try{
    const decks=await request(db.from(TABLES.decks)
      .select('id,case_id,title,visibility').order('created_at',{ascending:false}));
    for(const d of decks||[]){
      if(!cases.some(c=>c.id===d.case_id))continue; // filtro visual adicional; RLS é obrigatório
      const article=el('article',undefined,'entry secure-presentation-row');
      article.append(el('strong',d.title));
      const slides=await querySlides(db,d.id,d.case_id);
      for(const slide of slides){
        const card=el('section',undefined,'secure-slide');
        card.append(el('small',(slide.position)+'. '+(TYPES[slide.kind]||slide.kind)),el('strong',slide.title));
        if(slide.subtitle)card.append(el('p',slide.subtitle));
        if(slide.body)card.append(el('p',slide.body,'secure-slide-text'));
        article.append(card);
      }
      root.append(article);
    }
    if(!decks?.length)root.append(el('p','Nenhuma apresentação compartilhada com sua conta.','hint'));
  }catch(err){announce(report,err);}
}
