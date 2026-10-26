/* V11.2 — contratos estáticos + sanitização de slides. NÃO equivale a teste RLS no servidor. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {sanitizeSlideDraft} from '../seguro/presentations.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const sql=read('supabase/migrations/20261026213000_secure_presentation_materials.sql');
const base=read('supabase/migrations/20261026170000_realtalent_secure_foundation.sql');
const front=read('seguro/presentations.mjs'),app=read('seguro/app.mjs');
const html=read('seguro/index.html'),cfg=read('seguro/config.js');
const matrix=read('supabase/tests/presentation_materials_rls.test.sql');
assert.match(base,/create table public\.rt_secure_records/);
for(const table of ['rt_secure_presentations','rt_secure_presentation_slides']){
  assert.match(sql,new RegExp('create table public\\.'+table+' \\('));
  assert.match(sql,new RegExp('alter table public\\.'+table+' enable row level security'));
}
assert.equal((sql.match(/create policy rt_presentation_/g)||[]).length,8,'Oito políticas por operação');
assert.match(sql,/revoke all on public\.rt_secure_presentations,public\.rt_secure_presentation_slides from anon,authenticated/);
assert.match(sql,/grant update\(title,visibility\) on public\.rt_secure_presentations/);
assert.match(sql,/grant update\(position,kind,title,subtitle,body,theme\) on public\.rt_secure_presentation_slides/);
assert.doesNotMatch(sql,/grant all on public\./i);
assert.doesNotMatch(sql,/security definer/i);
assert.match(sql,/constraint rt_secure_presentation_session_fk foreign key \(case_id,session_record_id\)/);
assert.match(sql,/constraint rt_secure_presentation_parent_fk foreign key \(case_id,presentation_id\)/);
assert.match(sql,/c\.participant_user_id=\(select auth\.uid\(\)\)/);
assert.match(sql,/visibility='shared'/);
assert.match(sql,/r\.record_type='session'/);
assert.match(sql,/r\.visibility='shared'/);
assert.match(sql,/c\.participant_user_id is not null/);
assert.match(sql,/p\.visibility='private'/);
assert.match(sql,/kind in \('cover','text','question','library'\)/);
assert.match(sql,/unique\(presentation_id,position\)/);
assert.match(matrix,/select plan\(15\)/);
assert.match(matrix,/Desvincular participante revoga slides/);
assert.match(matrix,/Recolher sessão revoga imediatamente/);
assert.match(app,/import \{showProfessionalPresentations,showParticipantPresentations\} from '.\/presentations\.mjs'/);
assert.match(app,/await refreshPresentationPanel\(\)/);
assert.match(html,/id="secure-presentations-professional"/);
assert.match(html,/id="secure-presentations-participant"/);
assert.match(cfg,/publishableKey:\s*''/,'Desabilitar ambiente sem banco próprio');
assert.ok(!/\.innerHTML\s*=|document\.write\(/.test(front),'Não interpretar slides como HTML');
assert.ok(!/service_role\s*[:=]|sb_secret_[a-z0-9]/i.test(front+cfg),'Não introduzir credencial privilegiada');

const result=sanitizeSlideDraft({
  kind:'library',title:'  Um slide educativo  ',subtitle:'  Apoio  ',
  body:'Texto autorizado',theme:'desconhecido',
  notes:'NOTA PRIVADA',fileId:'documento-ficticio',fileName:'interno.pdf',
  blob:'blob:https://...',
  clientId:'c1',sessionId:'s1'
});
assert.deepEqual(Object.keys(result).sort(),['body','kind','subtitle','theme','title'].sort());
assert.equal(result.theme,'ocean');
assert.equal(result.title,'Um slide educativo');
assert.equal(result.body,'Texto autorizado');
for(const bad of ['document','tool','script','pdf']){
  assert.throws(()=>sanitizeSlideDraft({kind:bad,title:'Qualquer'}));
}
assert.throws(()=>sanitizeSlideDraft({kind:'text',title:''}));
const huge=sanitizeSlideDraft({kind:'text',title:'Título',body:'x'.repeat(2000),subtitle:'y'.repeat(900),theme:'dark'});
assert.equal(huge.body.length,1200);
assert.equal(huge.subtitle.length,280);
assert.equal(huge.theme,'dark');
console.log('V11.2 contratos OK: 2 tabelas RLS, 8 políticas, sem chaves/arquivos/notas e bloqueio sem configuração.');
console.log('IMPORTANTE: políticas ainda exigem execução pgTAP real em staging dedicado.');
