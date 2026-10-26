// RealTalent V10 Secure Beta — isolamento pelo banco, nunca pela UI.
// Chaves de serviço e segredos jamais entram neste arquivo ou no navegador.
const byId = id => document.getElementById(id);
const config = window.REALTALENT_SECURE_CONFIG || {};
const requiredTables = Object.freeze({
  profiles:'rt_secure_profiles', cases:'rt_secure_cases',
  records:'rt_secure_records', responses:'rt_secure_responses'
});
let db = null, currentUser = null, currentProfile = null, selectedCase = null;
let cases = [];
function notice(message, error=false){
  const el=byId('status');el.textContent=message;el.className=error?'error':'';
}
function visible(id,yes){byId(id).hidden=!yes;}
function make(tag, text='', cls=''){
  const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;
}
function button(title,onClick,secondary=false){
  const b=make('button',title,secondary?'secondary':'');b.type='button';b.addEventListener('click',onClick);return b;
}
function renderEmpty(target,message){target.replaceChildren(make('p',message,'hint'));}
function humanError(error){
  // Mostrar erros esperados sem despejar sessões, JWTs ou objetos internos.
  return error?.message || 'Não foi possível concluir a operação.';
}
async function readProfile(user){
  const {data,error}=await db.from(requiredTables.profiles)
    .select('user_id,role,display_name').eq('user_id',user.id).maybeSingle();
  if(error)throw error;
  return data;
}
async function hydrate(){
  const {data,error}=await db.auth.getUser();
  if(error&&error.name!=='AuthSessionMissingError'){notice(humanError(error),true);}
  const user=data?.user||null;
  currentUser=user;
  visible('logout',!!user);
  if(!user){
    currentProfile=null;selectedCase=null;visible('auth',true);
    visible('workspace',false);return;
  }
  visible('auth',false);visible('workspace',true);
  try{
    currentProfile=await readProfile(user);
    if(!currentProfile){visible('professional',false);visible('participant',false);
      notice('Conta autenticada, mas não provisionada. Um administrador deve atribuir o perfil profissional ou participante.',true);return;}
    if(currentProfile.role!=='professional'&&currentProfile.role!=='participant')
      throw new Error('Perfil inválido para este ambiente.');
    byId('profile-title').textContent=currentProfile.role==='professional'?'Área profissional':'Minha Jornada';
    byId('profile-subtitle').textContent='Acesso individual confirmado · '+(currentProfile.display_name||user.email||'usuário');
    visible('professional',currentProfile.role==='professional');
    visible('participant',currentProfile.role==='participant');
    notice('Sessão autenticada. As regras de acesso são aplicadas no banco de dados.');
    await loadCases();
  }catch(err){notice(humanError(err),true);}
}
async function loadCases(){
  const {data,error}=await db.from(requiredTables.cases)
    .select('id,label,status,created_at').order('created_at',{ascending:false});
  if(error)throw error;
  cases=data||[];
  if(currentProfile.role==='professional'){
    if(!cases.some(c=>c.id===selectedCase))selectedCase=cases[0]?.id||null;
    renderCases();await loadRecords();
  }else{await loadParticipant();}
}
function renderCases(){
  const container=byId('case-list');container.replaceChildren();
  if(!cases.length)return renderEmpty(container,'Nenhum processo nesta conta.');
  for(const row of cases){
    const wrap=make('div','','entry');
    const select=button(row.label,async()=>{
      selectedCase=row.id;renderCases();await loadRecords();
    },true);
    select.setAttribute('aria-pressed',String(row.id===selectedCase));
    wrap.append(select,make('small',row.status==='closed'?'Encerrado':'Ativo'));
    container.append(wrap);
  }
}
async function loadRecords(){
  const out=byId('record-list'),form=byId('record-form');
  const row=cases.find(c=>c.id===selectedCase);visible('record-form',!!row&&row.status==='active');
  byId('record-heading').textContent=row?'Registros · '+row.label:'Registros do processo';
  if(!row)return renderEmpty(out,'Selecione ou crie um processo.');
  const {data,error}=await db.from(requiredTables.records)
    .select('id,case_id,record_type,title,body,visibility,status,created_at')
    .eq('case_id',row.id).order('created_at',{ascending:false});
  if(error){notice(humanError(error),true);return;}
  out.replaceChildren();
  if(!data?.length)return renderEmpty(out,'Ainda não há registros neste processo.');
  const types={goal:'Objetivo',session:'Sessão',action:'Compromisso',activity:'Atividade guiada',feedback:'Devolutiva',note:'Nota interna'};
  for(const rec of data){
    const card=make('article','','entry');
    card.append(make('small',(types[rec.record_type]||rec.record_type)+' · '+(rec.visibility==='shared'?'Compartilhado':'Privado')),
      make('strong',rec.title),make('p',rec.body));
    if(row.status==='active'&&rec.record_type!=='note'){
      const target=rec.visibility==='shared'?'private':'shared';
      card.append(button(target==='shared'?'Compartilhar com participante':'Tornar privado',async()=>{
        if(target==='shared'&&!window.confirm('Confirmar liberação deste conteúdo ao participante vinculado?'))return;
        const {error}=await db.from(requiredTables.records).update({visibility:target}).eq('id',rec.id);
        if(error){notice(humanError(error),true);return;}
        notice(target==='shared'?'Compartilhamento autorizado.':'Registro mantido privado.');
        await loadRecords();
      },true));
    }
    if(rec.record_type==='activity'){
      const {data:answers,error:answerError}=await db.from(requiredTables.responses)
        .select('body,created_at').eq('activity_id',rec.id);
      if(answerError){notice(humanError(answerError),true);}
      else for(const answer of answers||[]){
        const block=make('div','','response');block.append(make('small','Resposta do participante'),make('p',answer.body));card.append(block);
      }
    }
    out.append(card);
  }
}
async function loadParticipant(){
  const root=byId('participant-list');root.replaceChildren();
  if(!cases.length)return renderEmpty(root,'Não existe processo vinculado à sua conta. Solicite o convite ao profissional.');
  for(const c of cases){
    const section=make('section','','case');
    section.append(make('h4',c.label));
    const {data:records,error}=await db.from(requiredTables.records)
      .select('id,record_type,title,body,status').eq('case_id',c.id).order('created_at',{ascending:false});
    if(error){notice(humanError(error),true);continue;}
    if(!records?.length)section.append(make('p','Nenhum conteúdo compartilhado até agora.','hint'));
    for(const rec of records||[]){
      const card=make('article','','entry');
      card.append(make('small',rec.record_type==='activity'?'Atividade guiada':rec.record_type==='feedback'?'Devolutiva':rec.record_type),
        make('strong',rec.title),make('p',rec.body));
      if(rec.record_type==='activity'){
        const {data:past,error:responseError}=await db.from(requiredTables.responses)
          .select('body').eq('activity_id',rec.id);
        if(responseError){notice(humanError(responseError),true);}
        else if(past?.length){
          card.append(make('small','Resposta registrada'),make('p',past[0].body,'response'));
        }else if(rec.status==='open'&&c.status==='active'){
          const form=make('form');form.className='response-form';
          const label=make('label','Sua reflexão (exemplo fictício)');
          const input=make('textarea');input.required=true;input.maxLength=4000;input.minLength=4;input.rows=3;
          label.append(input);const submit=make('button','Enviar resposta');submit.type='submit';
          form.append(label,submit);
          form.addEventListener('submit',async event=>{
            event.preventDefault();submit.disabled=true;
            const {error:sendError}=await db.from(requiredTables.responses).insert({
              case_id:c.id,activity_id:rec.id,participant_user_id:currentUser.id,body:input.value.trim()
            });
            if(sendError){notice(humanError(sendError),true);submit.disabled=false;return;}
            notice('Resposta recebida. O profissional poderá analisá-la.');
            await loadParticipant();
          });
          card.append(form);
        }
      }
      section.append(card);
    }
    root.append(section);
  }
}
byId('email-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!db)return;
  const email=new FormData(event.currentTarget).get('email').toString().trim().toLowerCase();
  const {error}=await db.auth.signInWithOtp({email,options:{
    shouldCreateUser:false,emailRedirectTo:location.origin+location.pathname
  }});
  if(error){notice(humanError(error),true);return;}
  visible('otp-form',true);notice('Confira seu e-mail e informe o código de acesso.'); 
});
byId('otp-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!db)return;
  const email=new FormData(byId('email-form')).get('email').toString().trim().toLowerCase();
  const token=new FormData(event.currentTarget).get('token').toString().trim();
  const {error}=await db.auth.verifyOtp({email,token,type:'email'});
  if(error){notice(humanError(error),true);return;}await hydrate();
});
byId('logout').addEventListener('click',async()=>{
  if(!db)return;const {error}=await db.auth.signOut();
  if(error){notice(humanError(error),true);return;}
  notice('Sessão encerrada.');await hydrate();
});
byId('case-form').addEventListener('submit',async event=>{
  event.preventDefault();if(currentProfile?.role!=='professional')return;
  const label=new FormData(event.currentTarget).get('label').toString().trim();
  const {error}=await db.from(requiredTables.cases).insert({
    label,professional_user_id:currentUser.id,status:'active'
  });
  if(error){notice(humanError(error),true);return;}
  event.currentTarget.reset();await loadCases();notice('Processo criado na conta autenticada.');
});
byId('record-form').addEventListener('submit',async event=>{
  event.preventDefault();if(currentProfile?.role!=='professional'||!selectedCase)return;
  const form=event.currentTarget,v=new FormData(form),record_type=v.get('record_type');
  const visibility=record_type==='note'?'private':v.get('share')?'shared':'private';
  if(visibility==='shared'&&!window.confirm('Compartilhar agora este registro com o participante vinculado?'))return;
  const {error}=await db.from(requiredTables.records).insert({
    case_id:selectedCase,author_user_id:currentUser.id,record_type,
    title:v.get('title').toString().trim(),body:v.get('body').toString().trim(),
    visibility,status:'open'
  });
  if(error){notice(humanError(error),true);return;}
  form.reset();await loadRecords();notice('Registro salvo no banco com controle de acesso.');
});
async function start(){
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.url||'') ||
    !/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey||'')){
    visible('auth',false);visible('workspace',false);
    notice('Ambiente seguro ainda não configurado. É necessário criar um Supabase dedicado, aplicar as políticas RLS e informar somente URL/chave publicável.',true);
    return;
  }
  try{
    const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.110.0');
    db=createClient(config.url,config.publishableKey,{auth:{
      storage:sessionStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true
    }});
    db.auth.onAuthStateChange(()=>{queueMicrotask(()=>{void hydrate();});});
    await hydrate();
  }catch(err){notice('Falha ao inicializar o acesso seguro: '+humanError(err),true);}
}
void start();
