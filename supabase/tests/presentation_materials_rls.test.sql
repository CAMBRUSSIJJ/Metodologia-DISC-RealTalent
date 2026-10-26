-- V11.2 / pgTAP. Executar APENAS em banco local ou staging dedicado e DESCARTÁVEL.
-- Requer migrations V10 e V11.2. Jamais em projeto com pessoas reais.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

-- Fixtures sintéticas — postgres (admin) prepara auth.users, perfis e casos.
insert into auth.users(id,email) values
 ('11111111-1111-4111-8111-111111111111','professional-a@realtalent.invalid'),
 ('22222222-2222-4222-8222-222222222222','professional-b@realtalent.invalid'),
 ('33333333-3333-4333-8333-333333333333','participant-a@realtalent.invalid'),
 ('44444444-4444-4444-8444-444444444444','participant-b@realtalent.invalid');
insert into public.rt_secure_profiles(user_id,role,display_name) values
 ('11111111-1111-4111-8111-111111111111','professional','Profissional A'),
 ('22222222-2222-4222-8222-222222222222','professional','Profissional B'),
 ('33333333-3333-4333-8333-333333333333','participant','Participante A'),
 ('44444444-4444-4444-8444-444444444444','participant','Participante B');
insert into public.rt_secure_cases(id,professional_user_id,participant_user_id,label) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','Caso A sintético'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444','Caso B sintético');
insert into public.rt_secure_records(id,case_id,author_user_id,record_type,title,visibility) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','session','Sessão A sintética','shared'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','session','Sessão B sintética','shared');
insert into public.rt_secure_presentations(id,case_id,session_record_id,author_user_id,title,visibility) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01','11111111-1111-4111-8111-111111111111','Privada A','private'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01','11111111-1111-4111-8111-111111111111','Compartilhada A','shared'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb12','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01','22222222-2222-4222-8222-222222222222','Compartilhada B','shared');
insert into public.rt_secure_presentation_slides(case_id,presentation_id,position,kind,title,body) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11',1,'text','Slide privado A','Não divulgar'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12',1,'text','Slide liberado A','Texto fictício'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb12',1,'text','Slide liberado B','Texto fictício B');

select ok((select relrowsecurity from pg_class where oid='public.rt_secure_presentations'::regclass),'RLS habilitado em apresentações');
select ok((select relrowsecurity from pg_class where oid='public.rt_secure_presentation_slides'::regclass),'RLS habilitado em slides');
select is(has_table_privilege('anon','public.rt_secure_presentations','SELECT'),false,'Anônimo sem acesso a apresentações');
select is(has_table_privilege('anon','public.rt_secure_presentation_slides','SELECT'),false,'Anônimo sem acesso a slides');
select is(has_column_privilege('authenticated','public.rt_secure_presentations','case_id','UPDATE'),false,'Titular não pode transferir apresentação para outro caso');
select is(has_column_privilege('authenticated','public.rt_secure_presentations','author_user_id','UPDATE'),false,'Titular não pode trocar autoria');
select is(has_column_privilege('authenticated','public.rt_secure_presentation_slides','presentation_id','UPDATE'),false,'Slide não pode mudar para outro roteiro');

set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select is((select count(*) from public.rt_secure_presentations),1::bigint,'Participante A vê somente deck compartilhado do caso A');
select is((select count(*) from public.rt_secure_presentation_slides),1::bigint,'Participante A vê somente o slide liberado');
select is((select count(*) from public.rt_secure_presentation_slides where title='Slide privado A'),0::bigint,'Conteúdo privado não acessível');

select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select is((select count(*) from public.rt_secure_presentations),1::bigint,'Participante B vê somente caso B');

select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select is((select count(*) from public.rt_secure_presentations where case_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),0::bigint,'Outro profissional não vê caso A');

reset role;
update public.rt_secure_records set visibility='private' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01';
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select is((select count(*) from public.rt_secure_presentations),0::bigint,'Recolher sessão revoga imediatamente apresentação e slides');

reset role;
update public.rt_secure_records set visibility='shared' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01';
update public.rt_secure_cases set participant_user_id=null where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select is((select count(*) from public.rt_secure_presentations),0::bigint,'Desvincular participante revoga leitura');

select is((select count(*) from public.rt_secure_presentation_slides),0::bigint,'Desvincular participante revoga slides');

reset role;
select * from finish();
rollback;
