# RealTalent V11.6 — Plano de Ação, Ferramentas Próprias e UX

## Objetivo e mudanças implementadas
A V11.6 reorganiza o trabalho do profissional em três frentes:
1. **Atividades no cliente**: retirada a coluna lateral "Como funciona" e a repetição de "Materiais de apoio". Os exercícios e DISC/ACER ocupam agora a área principal, com acesso contextual simples à Biblioteca.
2. **Kit de atendimento**: não está mais na navegação global "Ferramentas". Encontra-se exclusivamente na aba **Kit da sessão**, dentro do cliente. As opções de sessão são filtradas pelo processo do cliente em uso. O acesso rápido na sessão e na Visão geral aponta para esse contexto, sem misturar clientes.
3. **Minhas ferramentas**: catálogo global onde o profissional pode criar, editar e excluir roteiros educacionais próprios (título, categoria, objetivo e orientações). No cliente, em Atividades, o botão **Atribuir ferramenta própria** cria uma atividade guiada real no mesmo processo/objetivo, usando o fluxo e a Minha Jornada já existentes. Não introduz tela, cliente ou banco duplicado.

## Plano de Ação
A aba **Plano de ação** foi remodelada como painel de acompanhamento de compromissos, com:
- Resumo de abertas, vencidas, para revisar e concluídas.
- Filtros "Em aberto", "Vencidas", "Para revisar", "Próximos 7 dias", "Concluídas" e "Todas"; filtro por processo já existente.
- Cartões com prioridade (alta, normal, baixa), responsável, avanço registrado em %, prazo, revisão programada, objetivo e visibilidade.
- Ações **Revisar avanço**, **Editar**, **Concluir/Reabrir**, **Ver cliente**.
- Revisão de avanço com progresso, prioridade, responsável, critério de conclusão, próximo passo, revisão futura e nota interna.
- Histórico curto da movimentação do compromisso, com registro de data e evento, sem inferir evolução psicológica automaticamente.
- Criar e editar ação com detalhes de acompanhamento opcionais, agrupados em campos avançados.
- **Notas internas, histórico e data interna de revisão não aparecem na projeção dos dados para Minha Jornada**. Informações de ação visíveis ao cliente seguem o compartilhamento explícito já existente.

## Compatibilidade
- Todos os vínculos de cliente, processo, objetivo, ação e sessão continuam nos registros centrais demonstrativos `RTDemoStore`.
- Campos de progresso, prioridade e revisão são opcionais para registros antigos: quando ausentes, a interface usa valores padrão.
- Status persistidos mantêm os valores antigos `pendente`/`concluido`, protegendo a compatibilidade com Minha Jornada, sessões e testes anteriores.
- Atribuições de ferramentas autorais usam `RTDemoStore.assignGuidedActivity` (a mesma experiência de três respostas já disponível na Minha Jornada). A ferramenta autoral não é um construtor arbitrário de questionários nesta versão.
- O catálogo de ferramentas próprias utiliza localStorage demonstrativo separado `rt-v116-custom-tools-demo` e permanece editável pelo profissional. Excluir uma ferramenta do catálogo não remove atividades já atribuídas.
- Limite da orientação guiada ampliado para 1.800 caracteres para comportar roteiros autorais.
- A Biblioteca Profissional V11.5 e o Apresentador V11.4 continuam intactos.

## Layout
- Menos cartões explicativos e painéis paralelos.
- Mais largura para atividades e resultados.
- Cartões de ação com hierarquia de título, metadados, progresso e botões.
- Formulário de ação com detalhes avançados recolhíveis no cadastro/edição e expandidos durante a revisão.
- Melhor leitura em 1280×720, quebra de linhas e botões, e modais com rolagem e rodapé fixo.
- Reutilização de tokens do design system do Professional para temas claro/escuro.

## Segurança e limitações
**Demonstração local exclusivamente com dados fictícios.**
Ainda não há autenticação efetiva para esse catálogo, separação real por profissional, autorização de acesso, backups ou armazenamento profissional seguro. Não utilizar dados reais, históricos clínicos, materiais sigilosos ou identificações de clientes.
O uso de DISC/ACER, coaching e reflexões aqui é educativo. Ferramentas próprias cadastradas não são testes psicológicos regulamentados ou validados.

## Testes
```bash
python3 scripts/verify-build.py
node qa/testar-professional-v116.mjs
python3 qa/testar-professional-v116.py
node qa/testar-kit-profissional-v911.js
node qa/testar-ciclo-atividades-v917.js
```
O E2E da V11.6 verifica ausência de "Como funciona" nas atividades, filtro do Kit da sessão para um só cliente, cadastro e atribuição de ferramenta própria, revisão de progresso e proteção de notas internas.

A PR da V11.6 permanece **em rascunho** até completar a CI e conferir o Firefox; **Production não deve receber essa versão sem homologação**.
