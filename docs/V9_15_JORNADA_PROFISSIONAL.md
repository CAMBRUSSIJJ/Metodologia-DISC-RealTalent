# RealTalent V9.15 — Jornada Profissional do Processo (Preview)

## Objetivo
Consolidar no workspace de **Clientes → Visão geral** uma jornada única para objetivos,
sessões, ações combinadas e atividades, preservando as abas e registros já existentes.

## Implementação
- Quatro etapas navegáveis: **Objetivos**, **Sessões**, **Ações combinadas** e **Atividades**.
- Cada etapa deriva seus contadores exclusivamente de `db.goals`, `db.sessions`,
  `db.actions`, `db.discAssignments` e `db.instruments`, sempre filtrados pelo
  mesmo `programId`. Não persiste estatísticas ou estados paralelos.
- Encontros atrasados e ainda agendados são classificados como **sem confirmação**.
  Não são automaticamente considerados realizados.
- Ações atrasadas e exercícios que aguardam revisão são destacados por estado.
  O destaque é operacional, não pontuação clínica ou indicador psicológico.
- Sidebar de contexto apresenta **objetivos específicos** já cadastrados, não repete
  o objetivo geral exibido no cabeçalho.
- Histórico cronológico mantém filtros e permanece vinculado ao processo.
- A lista global de processos oferece **Abrir jornada**; o guia genérico das
  etapas passou para um bloco recolhível porque não representa progresso.
- Mantidas as seis abas internas do cliente e as áreas anteriores de DISC/ACER,
  ferramentas e planos.

## Segurança e escopo
Permanece exclusivamente demonstrativo, com armazenamento local e dados fictícios.
Não há autenticação, proteção de dados clínicos, compartilhamento seguro ou
validação psicométrica do DISC/ACER. Não cadastrar clientes ou pacientes reais.

## Validação
`python3 qa/testar-jornada-profissional-v915.py`
`python3 qa/testar-workspace-v93.py`
`python3 qa/testar-atendimento-integrado-v914.py`
`python3 scripts/verify-build.py`

Critério: jornada coerente com mudanças dos registros; contexto de processos isolado;
navegação por áreas; responsividade em 1440, 900 e 390px.
