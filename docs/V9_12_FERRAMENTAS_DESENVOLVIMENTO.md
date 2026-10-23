# RealTalent V9.12 — Roda da Vida + Matriz 5W2H

## O que mudou
A tela **Profissional → Ferramentas** passou a oferecer quatro entradas: Kit de atendimento (V9.11), Roda da Vida, Matriz 5W2H e DISC/ACER. Não há nova opção na sidebar nem uma segunda lista de tarefas. A aba de desenvolvimento de cada cliente contém atalhos diretos para as duas ferramentas, já com o processo selecionado.

### Roda da Vida
- Rota: `#ferramentas?tab=roda&program=<id>`.
- Selecionar cliente/processo, nomear até oito dimensões sugeridas (suporta de 6 a 10), ajustar a satisfação percebida por controle de 0 a 10, visualizar polígono SVG e salvar um registro datado.
- Cada registro fica em `wheelAssessments[]`, com `id`, `programId`, data, `areas: [{name,score}]`, observação opcional e carimbo de criação.
- Histórico do mesmo processo, comparação do gráfico com a avaliação anterior quando as dimensões coincidem, exclusão confirmada e preservação dos registros anteriores.
- Nenhuma média, percentil, diagnóstico ou interpretação automatizada. São respostas subjetivas, não um instrumento psicológico validado.
- O histórico permanece **interno ao Profissional**, fora de `clientView`, independentemente de compartilhamentos anteriores.

### Matriz 5W2H
- Rota: `#ferramentas?tab=5w2h&program=<id>`.
- Seletor de uma **ação existente** ou criação de nova ação com objetivo vinculado ao processo correto.
- Campos **What (o quê), Why (por quê), Where (onde), When (quando), Who (quem), How (como), How much (quanto custa / recursos)**.
- **Ação é a fonte canônica:** `what` corresponde a `action.title`, `when` a `action.due` e `goalId` ao objetivo já existente. Apenas os detalhes adicionais (`why`, `where`, `who`, `how`, `howMuch`) são guardados em `action.fiveWTwoH`.
- Para uma ação já existente, salvar **atualiza o mesmo ID**; não cria cópias. Novas ações usam `visibility: privado` e `status: pendente`. O profissional pode posteriormente autorizar o compartilhamento pelo Plano de Ação.
- `clientView` **remove explicitamente `fiveWTwoH`** antes de entregar as ações compartilhadas ao portal Minha Jornada. Título e prazo compartilhados continuam visíveis de acordo com as permissões demonstrativas já existentes.
- Se editar o título ou prazo de uma ação compartilhada, essas duas propriedades continuam visíveis ao participante conforme a regra anterior.

## Modelo e compatibilidade
- Armazenamento: `core/demo-store.js`, `localStorage` demonstrativo.
- A versão interna do banco **permanece 11**: `wheelAssessments` é inicializado como lista vazia para versões antigas; `fiveWTwoH` é um objeto opcional da ação canônica.
- Não modifica a lógica nem os dados de DISC/ACER, sessões, roteiros GROW ou compromissos da V9.10/V9.11.
- A implementação valida `programId`, `goalId`, `actionId`, datas reais, escala das notas, nomes duplicados e tamanho máximo de campos.

## Uso
1. Abra `Profissional → Clientes → [cliente fictício] → Desenvolvimento` e escolha **Roda da Vida** ou **Matriz 5W2H**.
2. Alternativamente, vá direto a `Profissional → Ferramentas` e selecione a ferramenta.
3. Na Roda da Vida, ajuste as dimensões e use **Salvar nova roda**; registros anteriores ficam no histórico.
4. Na 5W2H, escolha uma ação existente ou **Criar nova ação**, complete os campos e salve. O resultado também será exibido no Plano de Ação.

## Validação automatizável
```bash
node qa/testar-ferramentas-desenvolvimento-v912.js
node qa/testar-kit-profissional-v911.js
python3 qa/testar-sessoes-continuidade-v910.py
python3 scripts/verify-build.py
```
Os testes V9.12 cobrem migração, persistência, histórico, rejeição de datas e escores inválidos, edição sem duplicar ações, isolamento por processo, exclusão com vínculo, renderização e escape HTML. Um ensaio visual no navegador com desktop e mobile ainda é recomendado antes de mesclar à produção.

## Limite de segurança e ética
**Somente protótipo com dados fictícios.** O sistema não possui autenticação segura, RBAC, RLS, criptografia de registros ou armazenamento de dados pessoais apto para uso profissional. Não insira informações reais, confidenciais ou clínicas. A Roda da Vida é uma prática reflexiva e não equivale a avaliação psicológica ou ferramenta diagnóstica. A decisão de uso dos recursos cabe ao profissional habilitado.
