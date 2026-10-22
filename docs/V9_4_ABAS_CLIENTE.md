# RealTalent Professional V9.4 — Abas do cliente

**Foco:** levar o padrão de clareza e suavidade da Visão geral V9.3 para Sessões, Atividades, Resultados, Desenvolvimento e Documentos.

## Organização e comportamento

| Aba | Ação principal | Informações prioritárias | Secundário |
|---|---|---|---|
| Sessões | Agendar sessão | Próximo encontro, sem confirmação, realizados; filtros agendados/histórico/todos | Pauta e síntese internas, ações após o encontro |
| Atividades | Atribuir exercício | Para revisar, aguardando resposta, total; filtros em acompanhamento/respondidas/todas | Fluxo e Biblioteca; DISC com atribuição própria |
| Resultados | Abrir atribuições | Resultados DISC, pendências, devolutivas liberadas | Histórico vinculado e acervo legado recolhíveis |
| Desenvolvimento | Nova ação | Objetivo, ações pendentes, concluídas, atrasadas; filtros | Orientações e Plano de Ação legado recolhível |
| Documentos | Preparar devolutiva | Registros restritos/compartilhados, reflexões do participante | Contexto da privacidade e limites de upload |

## Regras preservadas

- Nenhuma atividade, devolutiva ou registro clínico é compartilhado automaticamente.
- Sessões com horário ultrapassado mas ainda agendadas mostram **sem confirmação**, não **realizadas**.
- Escores e gráficos DISC permanecem restritos à interface profissional; apenas devolutivas explicitamente liberadas aparecem na Minha Jornada.
- Indicadores calculados com registros existentes, sem contagens paralelas nem estimativa de eficácia psicológica.
- Histórico legado não é atribuído automaticamente ao cliente ou ao processo.
- Documentos externos/upload ainda não são implementados; interface declara essa limitação.
- Dados salvos somente no localStorage: V9.4 NÃO possui autenticação real, RBAC, sincronização entre dispositivos nem armazenamento seguro de dados sensíveis. Usar apenas dados fictícios. Instrumento educativo DISC/ACER não equivale a teste psicológico validado.

## Testes

`python3 qa/testar-abas-cliente-v94.py` valida cinco abas, filtros, ações, privacidade, sessão vencida, temas e responsividade via Chromium. `python3 qa/testar-workspace-v93.py` verifica a Visão geral anterior. `python3 qa/testar-clientes-v92.py`, `node testar-nucleo-v81.js`, `python3 testar-biblioteca-v31.py` protegem regressões.
