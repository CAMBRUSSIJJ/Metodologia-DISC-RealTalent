# RealTalent V11.2 — Apresentações com autorização no banco (Beta isolado)

## Estado de entrega
Esta versão adiciona uma **implementação Beta autenticada** no caminho `/seguro/`, reaproveitando Supabase Auth e os casos/sessões do modelo V10. O código está pronto para ser testado em **um banco próprio**, mas ainda não há projeto Supabase dedicado configurado; portanto a interface **continua bloqueada** e **nenhum teste de RLS com servidor real foi executado**. Não utilizar pessoas reais.

As versões V11.0–V11.1 do Estúdio e Minha Jornada **continuam demonstrativas** (localStorage/IndexedDB) e não são conectadas automaticamente ao banco protegido. Não copiar nem importar registros, notas ou arquivos delas para o ambiente seguro.

## O que a Beta protegida permite depois de configurar staging
1. O profissional autenticado abre um processo de desenvolvimento e registra uma **Sessão** no modelo V10.
2. Cria uma apresentação privada associada à sessão (vínculo imutável com `case_id`, `session_record_id`, `author_user_id`).
3. Insere slides **textuais** de Capa, Texto, Pergunta e Biblioteca. O banco não contém campos para notas, PDF, imagem, URL, blob, pontuações ou respostas de avaliação.
4. A publicação exige **confirmação explícita**, processo ativo, participante vinculado e registro da sessão já marcado `shared`. A apresentação só fica visível na conta do participante quando essas condições continuam verdadeiras.
5. Após publicar, os slides ficam **imutáveis para clientes autenticados** até o profissional recolher o material. Ele também pode excluir a apresentação.
6. A revogação da sessão ou do vínculo administrativo do participante bloqueia imediatamente a leitura de apresentação e slides pela política do banco — não depende do navegador atualizar um campo local.

## Modelo e invariantes
**Migration nova:** `supabase/migrations/20261026213000_secure_presentation_materials.sql`. Exige a migration V10 precedente.
- `rt_secure_presentations`: título, processo, sessão, profissional autor e `private/shared`.
- `rt_secure_presentation_slides`: ordem, tipo e conteúdo textual permitido; referência composta à apresentação do mesmo processo.
- RLS habilitado nas duas tabelas, sem GRANT para `anon`; privilégios mínimos separados por operação e coluna.
- O profissional não pode atualizar os identificadores de proprietário, sessão, processo ou apresentação do slide.
- O participante só pode fazer SELECT nos conteúdos expressamente publicados de seu próprio processo, com a sessão ainda compartilhada. Não existe política de INSERT/UPDATE/DELETE para participante.
- O navegador usa exclusivamente **publishable key** + sessão Auth; nenhuma service-role/secret key.
- Não há `SECURITY DEFINER`, view bypassing RLS nem dados JSONB arbitrários nos slides.

## Checklist de homologação (obrigatório e ainda pendente)
1. Provisionar **projeto Supabase exclusivo** para DISC/ACER, separado de RealTalent CRM e Blue Ocean. Verificar região, custos, controle de administradores e tratamento de dados.
2. Aplicar migrations V10 e V11.2 **somente em staging dedicado**. Não usar os dois projetos já conectados e não ativar migrations na produção.
3. Habilitar/confirmar Data API para as tabelas necessárias. Mudanças de 2026 exigem `GRANT` explícito além das políticas RLS; eles estão incluídos. Fonte: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
4. Criar quatro usuários de **teste sintéticos**: dois profissionais e dois participantes. Provisionar roles e vínculos **administrativamente**, nunca via user_metadata.
5. Rodar `supabase test db` com `supabase/tests/presentation_materials_rls.test.sql` em um banco de **teste local/descartável**; validar operações REST equivalentes com JWTs de usuários distintos.
6. Conferir que outras contas recebam zero linhas; tentar criar apresentação em caso alheio; tentar publicar sessão privada; trocar `case_id`/`author_user_id` via PATCH; tentar editar slides publicados; tentar injetar `notes`/`fileId`; revogar sessões, vínculos e comparar imediatamente as respostas.
7. Rodar Supabase Security Advisors, revisar MFA, convite e consentimento, logs, retenção, backup/restore, gestão de direitos LGPD, proteção da origem isolada (CSP como HTTP header, HSTS), SDK empacotado localmente e pentest antes do uso real.
8. Só então preencher URL e **publishable key** em `seguro/config.js` no ambiente de staging restrito, em origem separada do demo. Nunca service-role/secret keys.
9. Revisar status dos testes e da autenticação antes de qualquer merge ou Production. **Sem aprovação, deixar Beta inativa.**

## Testes já automatizados no repositório
- `node --check seguro/presentations.mjs`
- `node qa/testar-apresentacoes-seguras-v112.mjs` — sanitização de payload, privilégios declarados, integridade e estado fail-closed.
- Suíte de regressão V9–V11.1 / smoke de V10, via GitHub Actions.
- Arquivo pgTAP acima foi preparado, **mas não rodado** sem projeto de teste dedicado.

## Próximo passo após aprovação de staging
Ligar editor avançado e upload ao Supabase Storage privado usando policies por objeto/caso, URLs assinadas de curta duração e trilha de auditoria; somente então considerar sincronização entre Sessões, Apresentações e Minha Jornada com dados reais. A experiência de PowerPoint permanece na V11.1 local, não no Beta restrito.

Referências: https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/local-development/testing/overview
