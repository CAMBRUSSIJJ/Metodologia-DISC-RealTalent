# V9.6 — Especificação da Central de Ferramentas

## Motivação
Evitar abertura da interface legada inteira dentro de outros módulos. DISC/ACER torna-se uma ferramenta nativa, vinculada ao processo do cliente e às aplicações existentes.

## Rotas
- `#ferramentas` ou `#ferramentas?tab=visao`
- `#ferramentas?tab=aplicar`
- `#ferramentas?tab=aplicacoes&status=todas|pendentes|respondidas|rascunhos`
- `#ferramentas?tab=resultados&result=<id>`
- `#biblioteca?view=laboratorio` para Communication Lab.

## Modelo de dados
As operações usam `RTDemoStore.assignDisc()`, `RTDemoStore.clientView()` e o array canônico `db.discAssignments`. Não existe segundo armazenamento ou duplicação de escores. A atribuição permite um único questionário com status `atribuido` por processo. Por padrão a visibilidade é `privado` e a devolutiva exige liberação explícita.

## Segurança e responsabilidade
O frontend **não fornece isolamento real**. Uma versão para dados pessoais exigirá contas, autorização de acesso por entidade, segregação por profissional, LGPD e validação regulatória da metodologia/instrumentos utilizados. Não apresentar scores como diagnóstico ou medida de desenvolvimento psicológico.

## Testes de aceite
Verificar menu com dez abas, abertura de Ferramentas sem iframe do DISC original, aplicação, bloqueio de duplicatas pendentes, controle de visibilidade, resposta no fluxo original, gráficos com 4 fatores, edição/compartilhamento de devolutivas, preservação dos módulos originais e responsividade 390px.
