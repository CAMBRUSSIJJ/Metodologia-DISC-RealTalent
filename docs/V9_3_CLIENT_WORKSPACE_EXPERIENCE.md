# RealTalent Professional V9.3 — Client Workspace Experience

## Propósito

Substituir a Visão geral fragmentada do cliente por uma ordem simples: **identificação → processo selecionado → única próxima ação → quatro indicadores clicáveis → histórico ocorrido → contexto secundário**. A V9.2 é a base funcional. As nove abas da sidebar e as seis abas internas foram preservadas.

## Novidades

- Cabeçalho compacto com nome, situação, modalidade, processo selecionado e etapa; uma ação principal e menu de ações secundárias. O perfil pertence ao cliente; etapa e objetivo pertencem ao processo.
- Um cartão de atenção calculado com prioridades transparentes: resultado DISC/ACER para revisar, atividade respondida para revisar, sessão vencida sem confirmação, ação em atraso, próxima sessão, ação pendente e, se não houver pendências, agendar.
- Sessão com status `agendada` e horário já transcorrido não é exibida como futura. A interface pede confirmação e leva ao registro da sessão; não a marca automaticamente como concluída.
- Quatro indicadores clicáveis alimentados pelos registros existentes; não existem contagens paralelas.
- Histórico cronológico limitado a fatos registrados; sessões futuras não entram como realizadas. Sessões passadas ainda agendadas são identificadas como **sem confirmação**, não como realizadas. Prazo vencido é identificado como vencimento, não conclusão.
- Contexto lateral compacto, com objetivo e ações combinadas; detalhes do processo podem ser expandidos.
- Rótulos e espaçamentos das seis abas uniformizados, temas claro/escuro e layout responsivo sem outra sidebar.

## Fluxos e limites

- Os links do resumo navegam até as abas do cliente; o menu **Mais ações** permite editar cadastro, adicionar processo ou atribuir atividade.
- A linha do tempo filtra por data e tipo; não armazena uma cópia de cada evento. Os eventos são calculados a partir dos dados demonstrativos atuais.
- Os registros legados que não possuem `createdAt` não recebem uma data inventada de conclusão ou atribuição.
- O modelo de prioridade é uma regra operacional e não avaliação do risco ou condição do cliente.
- Não foram adicionadas autenticação, autorização por servidor, armazenamento remoto, sincronização real ou laudos. A aplicação continua exclusivamente demonstrativa e com dados fictícios. O DISC/ACER não deve ser apresentado como teste psicológico validado.

## Testes

- `python3 qa/testar-workspace-v93.py` — interface, prioridade DISC, sessão vencida, sessão futura, seis abas, vazio, tema e mobile (Chromium).
- `python3 qa/testar-clientes-v92.py` — cadastro, filtros, edição, navegação e compatibilidade da lista V9.2.
- `python3 qa/testar-sidebar-v91.py` — nove áreas do Professional.
- `node testar-nucleo-v81.js` — regras do núcleo compartilhado e DISC.
- `python3 scripts/verify-build.py` — integridade SHA-256 dos arquivos do ZIP.

Testes gráficos de uma instalação local ou de um navegador isolado não substituem testes na Vercel, em dispositivos variados, com autenticação e segurança reais.
