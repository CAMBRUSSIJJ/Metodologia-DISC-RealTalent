# Biblioteca DISC/ACER — RealTalent V3.2

Plataforma educacional integrada ao projeto RealTalent e utilizável separadamente. A V3.2 mantém a organização de os 135 conteúdos em seis áreas, inclui ferramentas interativas e mantém dados em arquivos JSON sem conexões externas.

## Conteúdos

Quatro fatores DISC (D, I, S, C), doze combinações didáticas, dezesseis orientações de comunicação, vinte e três artigos, vinte cenários, oito exercícios de coaching, dez módulos de estudo, trinta e cinco verbetes e sete fontes. As letras ACER são tratadas como tradução institucional informada pelo responsável, mas a correspondência A/C/E/R permanece não homologada.

## Acesso e integração

Abra `index.html` diretamente ou `biblioteca/index.html` a partir da plataforma no servidor local. Para integrar em `iframe` de mesma origem, utilize `biblioteca/index.html?embedded=1&theme=dark`; a integração existente nos painéis é mantida.

A barra global pesquisa o acervo completo; selecione uma das seis seções na sidebar. Para acessar um registro por link, use `#item=ID`. O progresso e as notas são salvos **no navegador atual** pela chave local `rt-disc-acer-library-v2`, para preservar dados existentes da versão anterior. Não há sincronização com usuários do Supabase.

## Edição do acervo

Edite os arquivos `data/indice_pesquisa.json` (lista de registros) e `data/perfis.json` (descrições profundas). Depois rode `python3 atualizar-dados.py`. O programa verifica IDs duplicados, quatro perfis obrigatórios e embute o JSON atualizado no HTML. A ferramenta `build_library.py` é histórica e está protegida para não substituir a V3.

## Segurança e ciência

A biblioteca não precisa de credenciais, login ou serviços externos. As avaliações originais não devem ser consideradas testes psicométricos validados sem estudos específicos; não usar como diagnóstico ou critério automático de RH. São hipóteses e exemplos didáticos, dependentes de situação, contexto e confirmação das preferências reais.

O banco e os perfis autenticados da plataforma não foram alterados. Para publicar, revisar RLS, a revogação da antiga chave administrativa exposta e os requisitos legais aplicáveis.

## V3.1 — Perfis interativos avançados

Cada fator inclui exemplos de comunicação contextual, 3 cenários de aplicação (liderança, comunicação, vendas), alternativas com feedback, reflexão opcional, microação e um plano individual de desenvolvimento.

Os 12 cenários são recursos educativos adicionais e **não contam como novos registros do acervo de 135 itens**. Os dados originais continuam preservados. Edite `data/perfis_avancados.json` para alterar exemplos e cenários e execute `python3 atualizar-dados.py` para sincronizar o HTML. Não é necessário internet para os exercícios.

O estado das práticas e planos utiliza a mesma chave do v2/v3, preservando favoritos, notas e leituras. A ferramenta não armazena resultados no Supabase. Nunca utilize esses conteúdos como decisões automatizadas de pessoal ou inferência de traços individuais.

## V3.2 — Communication Lab

Novo espaço dentro de **Communication Lab**: 8 simulações fictícias em 3 etapas cada (24 decisões, 72 alternativas com devolutivas), adaptador determinístico de mensagens com 4 estruturas editáveis e 6 exercícios de escrita com checklist. Os cenários não calculam DISC, não inferem o perfil de alguém e não oferecem correção automatizada. O adaptador NÃO utiliza IA nem envia mensagens; ele preserva a mensagem escrita pelo usuário e propõe estruturas de comunicação que exigem revisão humana.

Conteúdo está em `data/communication_lab.json`; rode `python3 atualizar-dados.py` ao modificá-lo. Os 135 registros existentes não foram alterados. Favoritos, notas, planos e práticas v3.1 continuam usando a chave `rt-disc-acer-library-v2`. Agora existe o campo `lab` com conversas concluídas, exercícios e último formulário do adaptador. Há um botão para apagar apenas dados do Communication Lab. Não há sincronização em nuvem.
