# V9.11 — Kit do Profissional: preparação e continuidade

## Objetivo
Reduzir o trabalho de navegação antes de cada encontro sem introduzir registros paralelos, automatizar intervenções ou modificar DISC/ACER.

## Fluxo implementado
1. Abra **Profissional → Ferramentas → Kit de atendimento** (rota `#ferramentas?tab=kit`).
2. Escolha um encontro já cadastrado na lista. O profissional pode entrar também por **Visão geral → Preparar próxima sessão**, **Sessões → Preparar** ou **Clientes → Sessões → Detalhes → Preparar sessão**.
3. Consulte o contexto do **mesmo processo**: objetivo, estágio, foco registrado, última síntese interna (quando houver) e compromissos anteriores ainda em aberto.
4. Use os quatro campos **GROW** — Goal/Objetivo, Reality/Realidade, Options/Opções e Will/Próximos passos — como apoio opcional ao planejamento.
5. Clique **Salvar preparação**. Os quatro campos são gravados como `sessions[].preparation` na sessão original, sem gerar outra sessão, outra tarefa ou outra lista de ações.
6. Registre compromissos na tela original do encontro. Os acordos seguem o fluxo já implementado na V9.10.

## Organização visual
O DISC/ACER continua acessível em **Ferramentas → DISC/ACER**, com suas subabas, atribuições, gráficos e visibilidades inalteradas. O kit acrescenta um seletor de sessão, dois cartões de contexto e um formulário estruturado com layout responsivo, sem criar nova aba na sidebar.

## Contrato de privacidade demonstrativa
- `preparation` e `preparationUpdatedAt` são **internos** e explicitamente removidos de `RTDemoStore.clientView`.
- Os campos são normalizados/truncados a 650 caracteres cada; valores inválidos são descartados no armazenamento local.
- Os compromissos são filtrados por `programId`. O seletor de encontros é global porque pertence ao profissional, mas o contexto de cada sessão nunca mistura ações de processos diferentes.
- Nenhum campo do GROW é compartilhado automaticamente com Minha Jornada.
- O modelo demonstrativo permanece na **versão de dados 11**, pois os campos são opcionais; migrações anteriores continuam compatíveis.
- **Não insira dados reais, sensíveis ou clínicos**. O protótipo usa `localStorage`, não há autenticação, criptografia ou autorização do servidor.

## Testes
```bash
node qa/testar-kit-profissional-v911.js
python3 qa/testar-sessoes-continuidade-v910.py
python3 scripts/verify-build.py
```
O teste V9.11 cobre sintaxe JS, gravação/recarga, migração, privacidade no portal, isolamento por processo, sanitização HTML, limite de campos, navegação e estados vazios. O teste V9.10 continua necessário para verificar o ciclo sessão → acordos → devolução.

## Evoluções possíveis
- Modelos configuráveis de pautas, sem prescrever intervenção clínica.
- Temporizador discreto com etapas opcionais para condução de sessão.
- Histórico longitudinal qualitativo com dados protegidos no backend multiusuário — somente após os requisitos de segurança para uso real.
