# V9.8 — Minha Jornada 2.0

## Arquitetura de informação

Menu principal do cliente: Início, Minhas atividades, Meus encontros, Meu desenvolvimento e Materiais. Perfil no rodapé. As rotas anteriores `#disc`, `#instrumentos`, `#reflexoes`, `#perfil` continuam acessíveis a partir de atalhos, com realce correto da navegação. Não foram criados registros adicionais para representar atividades.

## Fluxo e prioridades

A função `nextStep` exibe uma única próxima ação na seguinte ordem operacional: compromisso com prazo vencido, DISC/ACER iniciado, DISC/ACER pendente, reflexão guiada pendente, compromisso ainda não realizado e, por último, registrar uma reflexão. Pendências representam trabalho a realizar, não saúde ou risco psicológico.

## Atividades

As aplicações DISC/ACER, reflexões guiadas e compromissos compartilham uma listagem e três filtros, com estados baseados nas entidades originais. Em andamento aplica-se somente aos questionários iniciados, pois atividades guiadas e compromissos não possuem rascunho estruturado neste protótipo. Ações completas podem ser reabertas e respostas enviadas podem receber apenas devolutiva explicitamente compartilhada.

## Questionário

Última pergunta direciona às rodadas de adjetivos; somente após ambas a aplicação é concluída. Progresso armazenado exclusivamente no navegador demonstrativo. A interface do participante nunca mostra escores técnicos.

## UX e acessibilidade

Camada de estilos `assets/rt-v98-client.css`: textos principais próximos de 15–16 px; alvos de interação de pelo menos 44 px; layout responsivo em coluna única; contraste com tokens RealTalent; feedback de ações e rótulos explícitos; foco e navegação de teclado mantidos. Revisão manual com leitores de tela segue pendente.

## Não implementado

Autenticação, banco de dados em nuvem, permissão por usuário no servidor, notificações externas, upload de materiais, portal real entre dispositivos, registro estruturado de tentativa de atividade e compartilhamento seguro.
