# RealTalent V9.14 — Atendimento Profissional 2.0

## Escopo e resultado

Transformamos a aba **Sessões** em duas telas de responsabilidade clara: uma lista global de atendimentos, seguida por um workspace de sessão com três momentos: **Antes → Durante → Depois**.

Não foi criada nova área na sidebar, ficha de cliente, processo, ação ou registro duplicado. Os dados demonstrativos continuam em `core/demo-store.js` (schema 11) e as ferramentas anteriores permanecem acessíveis por **Ferramentas**.

### Agenda global
- `#sessoes?filter=proximos|hoje|concluidas|todos`.
- Contadores de próximos atendimentos, encontros sem confirmação e concluídos.
- Linha simples por encontro, com data, cliente, objetivo/processo e um CTA: **Abrir atendimento**.
- Nova sessão continua usando o modal preexistente e a mesma `sessions[]`.

### Dentro do atendimento
Ex.: `#cliente=c1&tab=sessoes&program=p1&session=s1`.

**Antes** (`&moment=antes`): pauta, síntese de encontro anterior concluído, compromissos pendentes do mesmo processo e GROW editável. `RTDemoStore.updateSessionPreparation` preserva vínculo e regras anteriores.

**Durante** (`&moment=durante`): cronômetro da V9.13, configuração das quatro etapas, banco com 30 perguntas filtráveis/selecionáveis e **notas internas** no campo opcional `sessions[].liveNotes` (limite de 1.600 caracteres). `RTDemoStore.updateSessionLiveNotes` valida vínculo com sessão, processo e cliente. O cronômetro continua efêmero em `sessionStorage`, **não registra duração efetiva**.

**Depois** (`&moment=depois`): conclusão do encontro, síntese interna, resumo opcional liberado para Minha Jornada por decisão explícita, consulta aos acordos da sessão, acesso ao Plano de Ação e continuação do processo.

### Hierarquia de informação
- O cabeçalho mantém cliente, data, status e ações essenciais.
- A lateral contextual oferece objetivo do processo, pendências e contagem das perguntas selecionadas.
- Os três momentos usam o mesmo `sessionId`.
- Sessões concluídas abrem preferencialmente em **Depois**; agendadas abrem em **Antes**.
- Os registros e conteúdos anteriores continuam na plataforma; a tela detalhada anterior não foi apagada como dado.
- Não há ações de conclusão ou criação de compromisso duplicadas na interface.
- Estilos responsivos para desktop, tablet e celular. Sem dependências externas de UI.

### Privacidade e contrato demonstrativo
`clientView` remove expressamente `liveNotes`, `liveNotesUpdatedAt`, `preparation`, `coachingQuestionIds`, `timerPlan`, `summary` e `focus`. Não expor notas mesmo se agenda e recap estiverem compartilhados. A seleção de perguntas e a preparação GROW também permanecem restritas.

**Importante:** o armazenamento no navegador continua sendo **apenas uma demonstração**. A separação `clientView` não equivale a autorização no servidor. Não introduzir dados pessoais de clientes, pacientes, registros clínicos ou informações sigilosas até implementar autenticação, RBAC e persistência segura.

### QA exigida para Preview
```bash
python3 scripts/verify-build.py
node qa/testar-kit-profissional-v911.js
node qa/testar-ferramentas-desenvolvimento-v912.js
node qa/testar-perguntas-temporizador-v913.js
python3 qa/testar-fluxo-atendimento-v913.py
python3 qa/testar-atendimento-integrado-v914.py
```
O workflow `.github/workflows/v913-session-e2e.yml` executa os testes com Chromium no GitHub Actions e arquiva capturas de tela para desktop, tablet e mobile. Não publicar V9.14 em Production se a suíte E2E falhar.


## Consolidação UX da agenda e continuidade
- Próximos e Sem confirmação são separados por data e horário, não somente pela data.
- Indicadores do topo da agenda agora são links com estado selecionado e foco visível.
- Criar cliente → processo → sessão abre diretamente a preparação do encontro recém-criado.
- Agendamento exige processo ativo; sem cliente, criação de processo orienta primeiro cadastro.
- Durante permite avançar a Depois; encerramento oferece agendar próximo encontro em processos ativos.
- A suíte E2E abrange o novo fluxo e os filtros temporais. Tudo continua estritamente demonstrativo.
