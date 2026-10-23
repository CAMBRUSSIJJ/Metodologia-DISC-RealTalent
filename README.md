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
