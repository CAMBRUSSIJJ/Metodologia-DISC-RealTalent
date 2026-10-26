# RealTalent V10.0 — fundação de acesso seguro (Beta restrito)

## Status real
Esta entrega **não converte** a demonstração V9.17 em uma plataforma pronta para dados clínicos. Adiciona uma nova área isolada em `/seguro/`, seu esquema PostgreSQL e controles de autenticação e autorização. Não compartilha os dados nem as credenciais do demo (localStorage). Sem projeto exclusivo provisionado e sem auditoria externa, permanece **desativada**.

## Modelo de acesso
- **Profissional:** conta cadastrada previamente no Supabase Auth e perfil `professional` provisionado pelo administrador. Cria processos e registra objetivos, atendimentos, compromissos, exercícios e devolutivas. Padrão: **privado**.
- **Participante:** conta `participant` preexistente e vinculada a um único caso pela equipe administrativa. Pode ler exclusivamente materiais marcados como `shared` no seu caso e enviar uma resposta **única** por atividade publicada.
- **Administração:** por enquanto feita fora do navegador (console administrativo do Supabase), com rastreabilidade do operador. A interface não permite autopromoção a profissional nem autoassociação a casos.
- **Banco:** quatro tabelas `rt_secure_*`, RLS em todas, `anon` sem grants, `auth.uid()` nas políticas, SELECT/INSERT/UPDATE/DELETE separados, colunas de propriedade e vínculo não editáveis via Data API. Notas internas nunca são compartilháveis.
- **Sessão:** Supabase Auth OTP com `shouldCreateUser:false`; sessão no `sessionStorage`. A interface usa `getUser()` para confirmar identidade e a **RLS** define os acessos reais.

## Instalação segura — etapa administrativa
1. Criar **um projeto Supabase dedicado** ao DISC/ACER (não reutilizar CRM ou Blue Ocean), escolher organização/região, anotar project ref. Consultar plano/custos antes de autorizar um projeto pago.
2. Aplicar a migration `supabase/migrations/20261026170000_realtalent_secure_foundation.sql` em **staging dedicado**, depois auditar com Supabase Security Advisors. Não aplicar nos projetos existentes.
3. Desabilitar cadastros públicos no Auth, verificar e-mails, configurar template de **OTP numérico** (`{{ .Token }}`), SMTP, redirecionamentos permitidos e rate limiting. Revisar MFA para profissionais antes de produção.
4. Criar usuários de teste `profA`, `profB`, `participantA`, `participantB` no Auth, com e-mails fictícios/controlados. Administrador provisiona `rt_secure_profiles` com `user_id`, role e display_name. Apenas administrativo, nunca cliente/navegador.
5. Profissional autenticado cria caso. Para vincular participante, o operador administrativo atribui em `rt_secure_cases.participant_user_id` o UUID da conta `participant` correta. **Convites, aceite do participante e auditoria da vinculação ainda não estão implementados**; não enviar dados de pacientes.
6. Copiar a **URL** e a **publishable key** (não uma secret/service_role) para `seguro/config.js` no ambiente restrito de staging. Chaves publicáveis não são autorização: apenas a JWT e as políticas RLS concedem acesso.
7. Abrir `/seguro/` em **origem exclusiva**, com HTTPS, CSP emitida por cabeçalho HTTP, HSTS, política de cookies, proteção contra XSS e rate limits. **Não** hospedá-la sob a mesma origem do antigo demo, que ainda não foi submetido à revisão de segurança.
8. Testar a matriz de permissões abaixo com 4 contas distintas, verificar logs de auditoria, políticas de retenção, backup/restore, consentimentos/base legal e contratos LGPD. Somente após aprovação, planejar migração seletiva com revisão jurídica/ética.

## Matriz de teste obrigatória (staging com RLS real)
| Operação | Prof. A | Prof. B | Participante A | Anônimo |
|---|---|---|---|---|
| Ler caso criado por A | Permite | Nega | Permite somente se vinculado | Nega |
| Ler nota interna de A | Permite | Nega | Nega, mesmo que tente marcar compartilhado | Nega |
| Criar/editar registro em caso A | Permite | Nega | Nega | Nega |
| Ler atividade compartilhada do seu caso | Permite | Nega | Permite | Nega |
| Responder uma atividade compartilhada | Lê resposta | Nega | Insere uma vez | Nega |
| Responder novamente / caso de outro usuário | Nega | Nega | Nega | Nega |
| Autodefinir role professional ou vincular conta a caso | Nega | Nega | Nega | Nega |
| Remover vínculo administrativo do participante | Controlado por admin | — | Perde leitura inclusive da resposta | — |

**Teste obrigatório ainda pendente:** executar essas operações usando usuários reais de staging e confirmar erros/zero linhas retornadas. A suíte estática `node qa/testar-seguranca-v10.js` valida apenas contratos do repositório.

## Segurança e limitações
- Não declarar prontidão para produção sem RLS E2E, auditoria de sessão, MFA, validação de backups, relatórios de segurança e análise LGPD.
- O SDK da Beta usa CDN com versão fixa para permitir teste isolado. Antes de produção, empacotar dependências revisadas localmente, fixar lockfile e reforçar CSP em cabeçalhos (a diretiva `frame-ancestors` em meta não basta).
- A interface ainda não implementa upload, consentimentos, convite seguro, portal completo das sessões, histórico de edição imutável, retenção LGPD, exportação/eliminação auditável ou segregação de anotações clínicas.
- Nunca inserir registros reais na versão demonstrativa ou Beta incompleta.

## Testes automatizados
```bash
node qa/testar-seguranca-v10.js
node --check seguro/app.mjs
python3 scripts/verify-build.py
```

Referências oficiais:
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/security/product-security
