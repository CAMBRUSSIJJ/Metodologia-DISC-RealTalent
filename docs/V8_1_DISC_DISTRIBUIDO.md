# RealTalent V8.1 — DISC por perfil

- **Minha Jornada → Meu DISC/ACER**: questionário educativo original com 20 perguntas, duas rodadas de 92 adjetivos e confirmação da conclusão, sem gráficos/placares para o participante. Uma devolutiva somente aparece após a liberação explícita pelo profissional.
- **Professional → Atribuir DISC/ACER**: associa questionário a cliente/processo existente; fica privado por padrão no núcleo, salvo quando o profissional escolhe liberar no formulário.
- **Professional → Gráficos e relatórios**: barras, radar, distribuições de adjetivos, lista de resultados por processo; percentual corresponde à contagem das 20 respostas. Comentário profissional privado por padrão; compartilhamento exige ação específica.
- **Acervo original**: relatório, gráficos, histórico antigos e plano DISC permanecem disponíveis dentro do Professional, sem migração automática dos escores antigos.
- **Arquitetura**: dados demonstrativos compartilhados via localStorage no mesmo navegador, versão 9 do esquema, migração V5/V7/V8, core/disc-questions.js extraído das 20 perguntas do disc-engine.html. Sem autenticação ou segurança de servidor, não use dados reais.
- **Limite metodológico**: não se trata de teste psicológico validado; as frequências não são percentis nem diagnosticam traços.

## Validações realizadas

- Testes de sintaxe JavaScript, estrutura dos dois portais, 20 perguntas, 92 adjetivos, cálculo e vínculo ao cliente e ao processo.
- Fluxo interativo em Chromium com renderização dos HTML/CSS/JS injetados: cliente concluiu perguntas e ambas as rodadas; Professional exibiu 4 barras e radar; devolutiva compartilhada foi exibida na Jornada. Sem erros JavaScript nesse ensaio.
- Integridade do pacote e servidor HTTP local verificados.
- **Pendente:** teste ponta a ponta navegando pela URL real com arquivos carregados pelo servidor, porque o Chromium desta infraestrutura bloqueia navegação direta `http://localhost`/`file://`. O ensaio injetado não valida carregamento de assets nem todos os fluxos do motor legado.
