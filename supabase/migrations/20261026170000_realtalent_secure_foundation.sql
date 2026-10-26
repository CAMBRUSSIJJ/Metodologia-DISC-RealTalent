-- RealTalent DISC/ACER V10 — banco isolado. Executar somente em projeto Supabase DEDICADO.
-- Nenhum dado da demo é importado. Nenhum usuário recebe permissão por metadados editáveis.
-- Provisionar perfis por administrador; participantes são vinculados por administrador até haver convites seguros.
begin;

create table public.rt_secure_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('professional','participant')),
  display_name text not null default '' check (char_length(display_name)<=120),
  created_at timestamptz not null default now()
);

create table public.rt_secure_cases (
  id uuid primary key default gen_random_uuid(),
  professional_user_id uuid not null references public.rt_secure_profiles(user_id),
  participant_user_id uuid references public.rt_secure_profiles(user_id),
  label text not null check (char_length(label) between 1 and 160),
  status text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now(),
  constraint rt_secure_case_distinct_users check (participant_user_id is distinct from professional_user_id)
);

create table public.rt_secure_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.rt_secure_cases(id) on delete cascade,
  author_user_id uuid not null references auth.users(id),
  record_type text not null check (record_type in ('goal','session','action','activity','feedback','note')),
  visibility text not null default 'private' check (visibility in ('private','shared')),
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body)<=4000),
  status text not null default 'open' check (status in ('open','done')),
  created_at timestamptz not null default now(),
  unique(case_id,id),
  constraint rt_secure_notes_always_private check (record_type<>'note' or visibility='private')
);

create table public.rt_secure_responses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  activity_id uuid not null,
  participant_user_id uuid not null references auth.users(id),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  constraint rt_secure_response_activity_fk foreign key (case_id,activity_id)
    references public.rt_secure_records(case_id,id) on delete cascade,
  unique(activity_id,participant_user_id)
);

create index rt_secure_cases_prof_idx on public.rt_secure_cases(professional_user_id);
create index rt_secure_cases_part_idx on public.rt_secure_cases(participant_user_id) where participant_user_id is not null;
create index rt_secure_records_case_idx on public.rt_secure_records(case_id,created_at desc);
create index rt_secure_responses_case_idx on public.rt_secure_responses(case_id);

alter table public.rt_secure_profiles enable row level security;
alter table public.rt_secure_cases enable row level security;
alter table public.rt_secure_records enable row level security;
alter table public.rt_secure_responses enable row level security;

revoke all on public.rt_secure_profiles,public.rt_secure_cases,public.rt_secure_records,public.rt_secure_responses from anon,authenticated;
grant select on public.rt_secure_profiles to authenticated;
grant select,insert on public.rt_secure_cases to authenticated;
grant update(label,status) on public.rt_secure_cases to authenticated;
grant select,insert,delete on public.rt_secure_records to authenticated;
grant update(title,body,visibility,status) on public.rt_secure_records to authenticated;
grant select,insert on public.rt_secure_responses to authenticated;

create policy rt_profile_self_read on public.rt_secure_profiles
  for select to authenticated using (user_id=(select auth.uid()));

create policy rt_cases_members_read on public.rt_secure_cases
  for select to authenticated
  using (professional_user_id=(select auth.uid()) or participant_user_id=(select auth.uid()));
create policy rt_cases_professional_create on public.rt_secure_cases
  for insert to authenticated
  with check (
    professional_user_id=(select auth.uid()) and participant_user_id is null
    and exists (select 1 from public.rt_secure_profiles p
      where p.user_id=(select auth.uid()) and p.role='professional')
  );
create policy rt_cases_professional_edit on public.rt_secure_cases
  for update to authenticated
  using (professional_user_id=(select auth.uid())
    and exists(select 1 from public.rt_secure_profiles p where p.user_id=(select auth.uid()) and p.role='professional'))
  with check (professional_user_id=(select auth.uid())
    and exists(select 1 from public.rt_secure_profiles p where p.user_id=(select auth.uid()) and p.role='professional'));

create policy rt_records_members_read on public.rt_secure_records
  for select to authenticated
  using (exists (
    select 1 from public.rt_secure_cases c where c.id=case_id
      and (c.professional_user_id=(select auth.uid())
        or (c.participant_user_id=(select auth.uid()) and visibility='shared' and record_type<>'note'))
  ));
create policy rt_records_professional_create on public.rt_secure_records
  for insert to authenticated
  with check (
    author_user_id=(select auth.uid())
    and exists(select 1 from public.rt_secure_cases c
      join public.rt_secure_profiles p on p.user_id=c.professional_user_id
      where c.id=case_id and c.professional_user_id=(select auth.uid())
        and p.role='professional')
  );
create policy rt_records_professional_edit on public.rt_secure_records
  for update to authenticated
  using (author_user_id=(select auth.uid())
    and exists(select 1 from public.rt_secure_cases c where c.id=case_id and c.professional_user_id=(select auth.uid())))
  with check (author_user_id=(select auth.uid())
    and exists(select 1 from public.rt_secure_cases c where c.id=case_id and c.professional_user_id=(select auth.uid())));
create policy rt_records_professional_delete on public.rt_secure_records
  for delete to authenticated
  using (author_user_id=(select auth.uid())
    and exists(select 1 from public.rt_secure_cases c where c.id=case_id and c.professional_user_id=(select auth.uid())));

create policy rt_responses_member_read on public.rt_secure_responses
  for select to authenticated
  using (
    (participant_user_id=(select auth.uid())
      and exists(select 1 from public.rt_secure_cases c
        where c.id=case_id and c.participant_user_id=(select auth.uid())))
    or exists(select 1 from public.rt_secure_cases c
      where c.id=case_id and c.professional_user_id=(select auth.uid()))
  );
create policy rt_responses_participant_once on public.rt_secure_responses
  for insert to authenticated
  with check (
    participant_user_id=(select auth.uid())
    and exists(select 1 from public.rt_secure_profiles p
      where p.user_id=(select auth.uid()) and p.role='participant')
    and exists(select 1 from public.rt_secure_cases c
      where c.id=case_id and c.participant_user_id=(select auth.uid()))
    and exists(select 1 from public.rt_secure_records a
      where a.id=activity_id and a.case_id=case_id and a.record_type='activity'
        and a.visibility='shared' and a.status='open')
  );

-- Sem políticas para anon, sem escrita de perfis, sem alteração do vínculo profissional/participante
-- pelo navegador; vínculos de participantes exigem procedimento administrativo auditável.
commit;
