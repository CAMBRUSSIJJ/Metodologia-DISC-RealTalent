# RealTalent V9.13 — Banco de Perguntas de Coaching e Temporizador de Sessão

## Objetivo

Ajudar o profissional a **preparar e conduzir** sessões de coaching/desenvolvimento sem ampliar a sidebar, duplicar sessões ou expor informações internas ao portal Minha Jornada. A experiência permanece **estritamente demonstrativa**, sem proteção suficiente para dados pessoais, clínicos ou sigilosos.

## Navegação e integração

- **Profissional → Ferramentas → Perguntas de Coaching**: `#ferramentas?tab=perguntas&session=<id>`.
- **Profissional → Ferramentas → Temporizador**: `#ferramentas?tab=temporizador&session=<id>`.
- **Clientes → cliente → Sessões → Detalhes**: atalhos para **Preparar com GROW**, **Banco de perguntas** e **Temporizador**, já com o encontro selecionado.
- **Kit de atendimento**, **Roda da Vida**, **Matriz 5W2H** e **DISC/ACER** continuam disponíveis.

## Banco de Perguntas

O arquivo `assets/rt-v913-session-assist.js` contém **30 perguntas abertas e não diagnósticas** organizadas em seis momentos: Abertura, Objetivo, Realidade, Opções, Ação e Revisão. Não há sugestão automática com base no perfil DISC, nem interpretação clínica.

- Filtre por momento ou pesquise em todo o conteúdo da categoria atual.
- Adicione até **12 perguntas** à sessão escolhida ou remova individualmente.
- A seleção é registrada em `sessions[].coachingQuestionIds` (somente IDs estáveis, sem criar outra sessão, tarefa ou instrumento).
- A seleção é **interna e nunca exibida ao participante**. A função `clientView` remove `coachingQuestionIds` explicitamente.
- O banco de perguntas de DISC/ACER que já existe na Biblioteca permanece preservado, sem exigir alteração das referências metodológicas.

## Temporizador

Uma sessão pode ter quatro etapas configuráveis com nome e duração. Valores iniciais: **Abertura 5 min, Exploração 25 min, Prática 15 min e Fechamento 5 min**.

- Nomes até 65 caracteres; de **1 a 90 minutos por etapa**, com limite de 240 minutos no total.
- Botões **Iniciar/Retomar**, **Pausar**, **Anterior**, **Próxima etapa** e **Reiniciar**.
- Ao atingir zero, o relógio **para na etapa atual**. Não avança sozinho nem produz sons ou alertas invasivos.
- A configuração é preservada na sessão canônica em `sessions[].timerPlan`; `clientView` remove `timerPlan` e `timerPlanUpdatedAt`.
- O estado de execução (etapa, tempo restante, contagem em andamento) permanece em **`sessionStorage` desta aba**, em chave exclusiva por sessão. Não é compartilhado, não vai para o banco demonstrativo e não representa presença ou duração efetiva de atendimento.
- O relógio compara a hora do sistema com um instante de término, evitando que os segundos parem indevidamente quando a aba fica oculta; pode divergir caso o relógio do dispositivo seja modificado. Fechar totalmente a sessão do navegador pode reiniciar a contagem.
- **Salvar configuração reinicia** o relógio. A troca manual de etapa também começa parada, exigindo iniciar explicitamente.

## Compatibilidade e isolamento

O schema demonstrativo permanece na versão **11**, com campos opcionais por sessão; o `upgrade()` migra automaticamente o estado das V9.10–V9.12, inicializando seleções vazias e o plano padrão sem apagar dados anteriores. Vínculos são validados por `sessionId`, `programId` e cliente existente.

A visualização do cliente continua restrita à agenda e aos acordos/recaps explicitamente compartilhados, como nas versões anteriores. **Não confundir a separação visual em localStorage com autorização segura de servidor.**

## Testes e homologação

```bash
node qa/testar-perguntas-temporizador-v913.js
node qa/testar-ferramentas-desenvolvimento-v912.js
node qa/testar-kit-profissional-v911.js
python3 qa/testar-sessoes-continuidade-v910.py
python3 scripts/verify-build.py
```

Os testes V9.13 verificam catalogação e IDs, seleção de perguntas, limite máximo, validação de configuração, tempo transcorrido, pausa/retomada, expiração, avanço manual, isolamento por cliente, não vazamento ao portal, migração e renderização das duas interfaces. **Ainda é necessário homologar visualmente o desktop e o mobile em um navegador real antes da Production.**

## Segurança e limites profissionais

A V9.13 não realiza avaliações psicológicas, não prescreve intervenções, não substitui julgamento técnico nem constitui prontuário. A plataforma usa armazenamento local sem autenticação ou controles de acesso adequados e **deve ser testada apenas com clientes fictícios**.
