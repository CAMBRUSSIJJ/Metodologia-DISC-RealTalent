-- V11.2: executar SOMENTE em Supabase dedicado ao RealTalent DISC/ACER,
-- depois da migration V10. Não aplicar em CRM ou Blue Ocean.
-- RLS protege leitura/revogação no servidor; não há armazenamento de PDF,
-- imagem, notas do apresentador, blob URLs nem dados de ferramentas dinâmicas.
begin;

create table public.rt_secure_presentations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.rt_secure_cases(id) on delete cascade,
  session_record_id uuid not null,
  author_user_id uuid not null references public.rt_secure_profiles(user_id),
  title text not null check (char_length(title) between 3 and 100),
  visibility text not null default 'private' check (visibility in ('private','shared')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(case_id,id),
  constraint rt_secure_presentation_session_fk foreign key (case_id,session_record_id)
    references public.rt_secure_records(case_id,id) on delete restrict
);

create table public.rt_secure_presentation_slides (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  presentation_id uuid not null,
  position smallint not null check (position between 1 and 40),
  kind text not null check (kind in ('cover','text','question','library')),
  title text not null check (char_length(title) between 1 and 130),
  subtitle text not null default '' check (char_length(subtitle)<=280),
  body text not null default '' check (char_length(body)<=1200),
  theme text not null default 'ocean' check (theme in ('ocean','light','dark')),
  created_at timestamptz not null default now(),
  constraint rt_secure_presentation_parent_fk foreign key (case_id,presentation_id)
    references public.rt_secure_presentations(case_id,id) on delete cascade,
  unique(presentation_id,position)
);

create index rt_secure_presentation_case_idx on public.rt_secure_presentations(case_id);
create index rt_secure_presentation_author_idx on public.rt_secure_presentations(author_user_id);
create index rt_secure_presentation_session_idx on public.rt_secure_presentations(case_id,session_record_id);
create index rt_secure_presentation_slide_parent_idx on public.rt_secure_presentation_slides(case_id,presentation_id);

alter table public.rt_secure_presentations enable row level security;
alter table public.rt_secure_presentation_slides enable row level security;
revoke all on public.rt_secure_presentations,public.rt_secure_presentation_slides from anon,authenticated;
grant select,insert,delete on public.rt_secure_presentations to authenticated;
grant update(title,visibility) on public.rt_secure_presentations to authenticated;
grant select,insert,delete on public.rt_secure_presentation_slides to authenticated;
grant update(position,kind,title,subtitle,body,theme) on public.rt_secure_presentation_slides to authenticated;

-- Autor pode consultar sua própria apresentação em seu caso.
-- Participante vê apenas apresentações liberadas E cuja sessão segue compartilhada.
create policy rt_presentation_owner_or_participant_read on public.rt_secure_presentations
  for select to authenticated
  using (exists (
    select 1 from public.rt_secure_cases c
    where c.id=case_id and (
      (c.professional_user_id=(select auth.uid()) and author_user_id=(select auth.uid()))
      or
      (c.participant_user_id=(select auth.uid()) and visibility='shared'
       and exists (
         select 1 from public.rt_secure_records r
         where r.case_id=case_id and r.id=session_record_id
           and r.record_type='session' and r.visibility='shared'
       ))
    )
  ));

create policy rt_presentation_owner_create on public.rt_secure_presentations
  for insert to authenticated
  with check (
    author_user_id=(select auth.uid()) and visibility='private'
    and exists (
      select 1 from public.rt_secure_cases c
      join public.rt_secure_profiles prof on prof.user_id=c.professional_user_id
      join public.rt_secure_records r on r.case_id=c.id and r.id=session_record_id
      where c.id=case_id and c.professional_user_id=(select auth.uid())
        and prof.role='professional' and c.status='active'
        and r.record_type='session' and r.author_user_id=(select auth.uid())
    )
  );

create policy rt_presentation_owner_edit on public.rt_secure_presentations
  for update to authenticated
  using (author_user_id=(select auth.uid()) and
    exists (select 1 from public.rt_secure_cases c
      where c.id=case_id and c.professional_user_id=(select auth.uid()) and c.status='active'))
  with check (author_user_id=(select auth.uid()) and
    exists (select 1 from public.rt_secure_cases c
      join public.rt_secure_records r on r.case_id=c.id and r.id=session_record_id
      where c.id=case_id and c.professional_user_id=(select auth.uid()) and c.status='active'
        and r.record_type='session'
        and (visibility='private' or
          (visibility='shared' and c.participant_user_id is not null and r.visibility='shared'))
    ));

create policy rt_presentation_owner_delete on public.rt_secure_presentations
  for delete to authenticated
  using (author_user_id=(select auth.uid()) and
    exists (select 1 from public.rt_secure_cases c
      where c.id=case_id and c.professional_user_id=(select auth.uid()) and c.status='active'));

-- Dados do slide não têm campos notes, fileId, fileName, URL ou metadata.
-- Ao publicar o deck, slides tornam-se IMUTÁVEIS até a revogação explícita.
create policy rt_presentation_slide_member_read on public.rt_secure_presentation_slides
  for select to authenticated
  using (exists (
    select 1 from public.rt_secure_presentations p
      join public.rt_secure_cases c on c.id=p.case_id
    where p.id=presentation_id and p.case_id=case_id and (
      (p.author_user_id=(select auth.uid()) and c.professional_user_id=(select auth.uid()))
      or
      (c.participant_user_id=(select auth.uid()) and p.visibility='shared'
        and exists (select 1 from public.rt_secure_records r
          where r.case_id=p.case_id and r.id=p.session_record_id
            and r.record_type='session' and r.visibility='shared'))
    )
  ));

create policy rt_presentation_slide_owner_insert on public.rt_secure_presentation_slides
  for insert to authenticated
  with check (exists (
    select 1 from public.rt_secure_presentations p
      join public.rt_secure_cases c on c.id=p.case_id
    where p.id=presentation_id and p.case_id=case_id
      and p.author_user_id=(select auth.uid()) and c.professional_user_id=(select auth.uid())
      and c.status='active' and p.visibility='private'
  ));

create policy rt_presentation_slide_owner_edit on public.rt_secure_presentation_slides
  for update to authenticated
  using (exists (
    select 1 from public.rt_secure_presentations p join public.rt_secure_cases c on c.id=p.case_id
    where p.id=presentation_id and p.case_id=case_id
      and p.author_user_id=(select auth.uid()) and c.professional_user_id=(select auth.uid())
      and c.status='active' and p.visibility='private'
  ))
  with check (exists (
    select 1 from public.rt_secure_presentations p join public.rt_secure_cases c on c.id=p.case_id
    where p.id=presentation_id and p.case_id=case_id
      and p.author_user_id=(select auth.uid()) and c.professional_user_id=(select auth.uid())
      and c.status='active' and p.visibility='private'
  ));

create policy rt_presentation_slide_owner_delete on public.rt_secure_presentation_slides
  for delete to authenticated
  using (exists (
    select 1 from public.rt_secure_presentations p join public.rt_secure_cases c on c.id=p.case_id
    where p.id=presentation_id and p.case_id=case_id
      and p.author_user_id=(select auth.uid()) and c.professional_user_id=(select auth.uid())
      and c.status='active' and p.visibility='private'
  ));

commit;
