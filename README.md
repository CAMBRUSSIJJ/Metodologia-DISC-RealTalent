# RealTalent V11.1 — Apresentações nas Sessões (PREVIEW)

Vínculo entre apresentações e atendimentos, compartilhamento **explícito e seletivo** de slides educativos com Minha Jornada e registro de compromissos no Plano de Ação existente. Materiais privados, notas do apresentador e arquivos permanecem fora do conteúdo publicado.

[Guia, testes e restrições](docs/V11_1_APRESENTACOES_SESSOES.md).

**Protótipo local. Não utilizar dados reais. A V10 segura ainda precisa de Supabase dedicado e testes RLS.**

---

# RealTalent V11.0 — Estúdio de Apresentações (PREVIEW)

Nova aba **Apresentações** no RealTalent Professional. Crie roteiros visuais, apresente em tela cheia, integre slides da Biblioteca DISC/ACER, utilize ferramentas de reflexão interativas e importe PDFs/imagens demonstrativos, preservados neste navegador.

[Guia da V11 e limites de segurança](docs/V11_ESTUDIO_APRESENTACOES.md).

**Somente dados fictícios.** Não há sincronização segura ou permissões para documentos reais. A infraestrutura V10 continua isolada e desativada.

---

# RealTalent V10 — Fundação Segura (Beta isolado)

Esta branch acrescenta `/seguro/`, uma base **separada** da demonstração DISC/ACER, com autenticação Supabase Auth (OTP), papéis de profissional e participante, tabelas PostgreSQL com RLS, compartilhamento explícito e respostas vinculadas a atividades.

**Não está conectada a um banco de produção.** O ambiente seguro permanece desativado até provisionamento de um **Supabase exclusivo** e aprovação de testes de autorização. Nenhum registro da demonstração foi importado. Os bancos de outros projetos não foram modificados.

[Arquitetura, instruções e matriz obrigatória de homologação](docs/V10_BASE_SEGURA.md).

**Não utilizar dados pessoais ou clínicos reais nesta etapa.**

---

# RealTalent V9.17 — Ciclo de Atividades Guiadas (PREVIEW)

Atribuição profissional vinculada a objetivos, resposta na Minha Jornada, revisão e compartilhamento explícito, com o mesmo registro e privacidade por padrão.

[Documentação e limites V9.17](docs/V9_17_CICLO_ATIVIDADES.md).

**Uso demonstrativo, exclusivamente com dados fictícios.**

---

# RealTalent V9.16 — Desenvolvimento e Plano de Ação (PREVIEW)

Objetivos editáveis, compromissos vinculados a objetivos e sessões, filtros por processo e objetivo, privacidade por padrão e continuidade entre encontros. Preservada a V9.15.

Veja [documentação V9.16](docs/V9_16_DESENVOLVIMENTO_E_ACOES.md).

**Somente dados fictícios. Não insira registros pessoais ou clínicos reais.**

---

# RealTalent V9.15 — Jornada do Processo (PREVIEW)

Em **Profissional → Clientes → Visão geral**, uma única jornada reúne
**Objetivos, Sessões, Ações combinadas e Atividades** usando os registros
originais do processo. Os indicadores mostram pendências concretas, sem
tratar execução de tarefas como evolução psicológica. O histórico existente,
as seis abas internas e o Atendimento V9.14 permanecem.

Guia: [V9.15 — Jornada Profissional](docs/V9_15_JORNADA_PROFISSIONAL.md).
QA: `python3 qa/testar-jornada-profissional-v915.py`.

**Somente demonstração e dados fictícios. Não usar registros reais ou sigilosos.**

---

# RealTalent Professional V9.14 — Atendimento Profissional 2.0

A aba **Sessões** agora organiza os encontros numa agenda clara. Ao clicar em **Abrir atendimento**, o profissional entra em um espaço único de três momentos: **Antes** (contexto e GROW), **Durante** (perguntas, temporizador e notas internas) e **Depois** (conclusão, resumo autorizado e compromissos já vinculados).

A V9.14 preserva a V9.13, sem criar cadastros ou ações duplicadas. Veja [o guia V9.14](docs/V9_14_ATENDIMENTO_PROFISSIONAL.md) e os testes Playwright em `qa/testar-atendimento-integrado-v914.py`.

**Somente demonstração local, exclusivamente para dados fictícios.** Não existe autenticação real ou proteção adequada de informações clínicas/pessoais.

---

# RealTalent DISC/ACER V9.13 — Perguntas e Temporizador de Sessão (DEMONSTRAÇÃO)

**Novo na V9.13:** banco com **30 perguntas abertas** por etapa de coaching/desenvolvimento, com seleção de até 12 perguntas por sessão; temporizador de sessão com quatro fases e duração configuráveis, pausa/retomada e avanço manual. Acesse **Profissional → Ferramentas → Perguntas de Coaching / Temporizador**, ou use os atalhos em **Clientes → Sessões → Detalhes**.

Ambos usam as sessões já cadastradas, sem duplicá-las. Os dados de planejamento são **internos ao Profissional** e não aparecem na Minha Jornada. O cronômetro usa `sessionStorage` nesta aba e não é um registro da duração efetiva dos atendimentos.

Guia: [V9.13 — Perguntas e Temporizador](docs/V9_13_PERGUNTAS_TEMPORIZADOR.md). Teste: `node qa/testar-perguntas-temporizador-v913.js`.

**Atenção: produto demonstrativo, apenas dados fictícios.** Ainda não há autenticação multiusuário, controle de acesso ou persistência segura para informações reais de clientes.

---

# RealTalent DISC/ACER V9.12 — Ferramentas de Desenvolvimento (DEMONSTRAÇÃO)

**Novo na V9.12:** Roda da Vida com dimensões configuráveis, gráfico interativo e histórico por processo; Matriz 5W2H que cria/atualiza diretamente ações do plano existente. Em **Profissional → Ferramentas**, selecione **Roda da Vida** ou **Matriz 5W2H**, ou use os atalhos em **Clientes → Desenvolvimento**.

- Registros da Roda da Vida continuam internos, sem diagnóstico nem compartilhamento com o participante.
- Detalhes 5W2H ficam privados; o título e o prazo das ações seguem a visibilidade configurada no Plano de Ação.
- A V9.11 (Kit/GROW), DISC/ACER e Minha Jornada foram preservados.

Guia de uso: [V9.12 — Ferramentas de Desenvolvimento](docs/V9_12_FERRAMENTAS_DESENVOLVIMENTO.md). Teste estrutural: `node qa/testar-ferramentas-desenvolvimento-v912.js`.

**Somente demonstração com dados fictícios**: a plataforma ainda não possui autenticação ou armazenamento seguro para uso real.

---

# RealTalent DISC/ACER V9.11 — Kit do Profissional (DEMONSTRAÇÃO)

**Novo na V9.11:** preparação contextual de sessões; compromissos anteriores recuperados automaticamente no mesmo processo; roteiro GROW opcional com quatro campos internos, salvos no encontro existente. Acesse **Profissional → Ferramentas → Kit de atendimento** ou o atalho de preparação da sessão.

O DISC/ACER, a Biblioteca e a Minha Jornada permanecem preservados. Os campos GROW nunca são expostos em `RTDemoStore.clientView` e não geram compromissos automaticamente.

Guia: [V9.11 — Kit do Profissional](docs/V9_11_KIT_PROFISSIONAL.md). Teste: `node qa/testar-kit-profissional-v911.js`.

**Atenção:** versão demonstrativa com dados apenas locais e fictícios, sem autenticação nem armazenamento apropriado para dados profissionais reais.

---

# RealTalent DISC/ACER V9.10 — Sessões e Continuidade (DEMONSTRAÇÃO)

**Novo na V9.10:** compromissos vinculados a cada sessão e objetivo, retomada das ações em aberto no encontro seguinte, resumo opcional compartilhado com Minha Jornada e separação rigorosa entre pauta interna e orientação liberada. Consulte `docs/V9_10_SESSOES_E_CONTINUIDADE.md`.

Esta versão conecta **objetivos de desenvolvimento → compromissos → experiências → reflexões → orientações** no mesmo núcleo local.

## O que foi adicionado
- Objetivos por processo com migração sem exclusão dos registros da V9.8.
- Profissional: criação de objetivos e vínculo de ações ao objetivo escolhido; orientação com objetivo associado; relatos de atividades visíveis no workspace.
- Minha Jornada: objetivo relacionado em cada compromisso; relato como "Consegui realizar" ou "Tentei, mas encontrei dificuldades", com anotação opcional; reflexões vinculadas ao objetivo; histórico de compromissos e orientações.
- A privacidade das reflexões continua *demonstrativa*. Apenas reflexões marcadas como compartilhadas são apresentadas no Professional.
- O DISC/ACER, as sessões e os recursos existentes foram preservados. O relatório de experiência não é medição de desenvolvimento psicológico.

**Limitação crítica:** os dados permanecem no `localStorage` do mesmo navegador. Não há login, sincronização entre dispositivos, isolamento real, criptografia nem backend. **Não inserir dados pessoais/saúde ou registros de clientes reais.**

O V9.10 é uma evolução do protótipo; não substitui a implementação multiusuário segura planejada para V10.0.

# RealTalent DISC/ACER — V9.8 · Minha Jornada 2.0

## O que mudou

**Minha Jornada** possui cinco áreas principais: Início, Minhas atividades, Meus encontros, Meu desenvolvimento e Materiais. Meu perfil foi movido ao rodapé da navegação. Reflexões e DISC/ACER estão acessíveis dentro de Minhas atividades; links antigos como `#disc`, `#instrumentos` e `#reflexoes` permanecem reconhecidos.

O Início destaca uma próxima ação operacional verificável, levando em conta compromisso vencido, DISC em andamento ou atribuído, atividade guiada e ações do plano. O fluxo de realização de atividades organiza os registros por **Para fazer / Em andamento / Concluídas**, sem acrescentar pontuações psicológicas.

Melhorias de legibilidade, botões e layout responsivo foram aplicadas com `assets/rt-v98-client.css`, preservando a identidade visual da plataforma. O DISC mantém suas 20 perguntas e duas etapas de adjetivos, com salvamento automático demonstrativo, indicação precisa da transição entre etapas e confirmação de envio.

## Abrir no Debian

```bash
cd ~/Downloads
unzip -oq RealTalent_DISC_ACER_V9_10_SESSOES_CONTINUIDADE.zip
cd RealTalent_DISC_ACER_V9_10_SESSOES_CONTINUIDADE
bash abrir-linux.sh
```

Acesso local: `http://127.0.0.1:8810/cliente/index.html`. Para alterar a porta, use `REALTALENT_PORT=8810 bash abrir-linux.sh`.

## Testar

```bash
python3 scripts/verify-build.py
python3 testar-v9.py
python3 qa/testar_minhas_atividades_v98.py
python3 qa/testar-disc-completo-v98.py
python3 qa/testar-workflow-v97.py
```

As verificações interativas injetam código em Chromium devido às restrições locais e não substituem testes por URL implantada. Evidências de QA são gravadas fora do pacote com `REALTALENT_QA_OUTPUT`.

## Limites de segurança

Versão **estritamente demonstrativa**, ainda com `localStorage` e troca fictícia de perfis, sem login, proteção de dados no servidor nem sincronização entre dispositivos. Não inserir dados reais de clientes, pacientes ou informações de saúde. O DISC/ACER mantém finalidade educativa: não há comprovação de validação psicométrica como teste psicológico. Gráficos e análises técnicas permanecem no Professional na experiência demonstrativa; a separação de interfaces não substitui controle de acesso real.
