#!/usr/bin/env python3
"""Gera a biblioteca estática e os dados JSON sem dependências externas."""
from pathlib import Path
import json, html, re, unicodedata
from datetime import date
BASE=Path(__file__).resolve().parent
# Gerador histórico. Proteção contra substituição acidental da interface V3.0.
if (BASE/'index.html').exists() and 'RealTalent · Biblioteca DISC/ACER 3.0' in (BASE/'index.html').read_text(encoding='utf8'):
 raise SystemExit('A interface V3.0 está ativa. Não execute este gerador legado, pois sobrescreveria a interface. Use atualizar-dados.py para atualizar o acervo.')
DATA=BASE/'data'
DATA.mkdir(exist_ok=True)

factors = {
 'D': {
  'nome':'Dominância','rotulo':'Direção e resultados','sigla':'D','cor':'#d66c64',
  'essencia':'Tendência a agir sobre desafios com assertividade, velocidade e foco no resultado.',
  'contexto':'O comportamento pode aparecer quando há autonomia para decidir, metas claras ou pressão por entrega.',
  'forcas':['Toma decisões e assume responsabilidade','Enfrenta obstáculos sem paralisar','Define prioridades e acelera execução','Expõe pontos de discordância com clareza'],
  'motivadores':['Autonomia com responsabilidade','Desafios relevantes','Critérios claros de sucesso','Liberdade para propor soluções'],
  'necessidades':['Objetivo e impacto esperados','Poder decidir o caminho com limites definidos','Informação essencial de forma direta','Feedback rápido sobre resultados'],
  'riscos':['Atropelar a escuta e o alinhamento','Subestimar o impacto relacional','Tratar urgência como regra','Confundir discordância com falta de compromisso'],
  'sob_pressao':['Intensifica cobrança e velocidade','Pode interromper explicações','Pode assumir tarefas em excesso para controlar o resultado'],
  'comunicacao':['Comece pelo objetivo e decisão requerida','Mostre duas ou três opções, impactos e prazo','Indique responsabilidades e limites','Convide a ouvir riscos sem diluir a mensagem'],
  'feedback':'Descreva fatos, impacto, próximo comportamento observável e indicador de avanço; evite disputa de poder.',
  'desenvolvimento':['Antes de decidir, pedir uma objeção substantiva','Realizar rodadas de escuta em reuniões','Conferir sustentabilidade da entrega, não apenas velocidade','Praticar delegação com pontos de controle'],
  'vendas':'Apresente resultado, prazo, riscos relevantes e proposta objetiva; valide se a prioridade é real, em vez de presumir pressa.',
  'lideranca':'Combine autonomia com limites, critérios de qualidade e acordos de participação; reconheça quando escuta melhora a decisão.',
  'perguntas_coaching':['Qual decisão pode ser tomada hoje sem comprometer a qualidade?','Quem precisa ser ouvido antes da execução?','O que seria um sinal de pressa excessiva?'],
  'nao_inferir':['Competência de liderança','Agressividade ou caráter','Capacidade cognitiva','Desempenho futuro']
 },
 'I': {
  'nome':'Influência','rotulo':'Conexão e mobilização','sigla':'I','cor':'#daa255',
  'essencia':'Tendência à expressão social, ao entusiasmo, à persuasão e ao engajamento em interações.',
  'contexto':'Pode ganhar destaque em atividades colaborativas, apresentações e situações que exigem mobilização de pessoas.',
  'forcas':['Conecta interlocutores e amplia participação','Dá energia a iniciativas coletivas','Comunica ideias de modo envolvente','Ajuda a manter abertura ao diálogo'],
  'motivadores':['Trocas e reconhecimento','Espaço para criatividade','Ambiente participativo','Oportunidade de expressar ideias'],
  'necessidades':['Objetivo com espaço para diálogo','Reconhecimento específico e respeitoso','Liberdade de experimentar','Acordos de execução registrados'],
  'riscos':['Prometer além da capacidade de entrega','Trocar foco por novidade','Evitar conversas desconfortáveis','Confundir aprovação com alinhamento'],
  'sob_pressao':['Aumenta comunicação e procura validação','Pode dispersar diante de críticas','Pode minimizar detalhes e restrições'],
  'comunicacao':['Abra com o propósito e impacto humano','Use exemplos e convide a participar','Termine com responsabilidades, critérios e prazo','Registre decisões por escrito'],
  'feedback':'Reconheça contribuição concreta e delimite o comportamento a ajustar; priorize exemplos e compromissos verificáveis.',
  'desenvolvimento':['Converter ideias em uma lista de próximos passos','Treinar conversas difíceis com respeito','Reservar blocos de foco e revisão','Conferir compromissos antes de oferecer prazos'],
  'vendas':'Construa relação e demonstre valor com histórias verificáveis; confirme detalhes de implementação e próximos passos.',
  'lideranca':'Use o entusiasmo para facilitar alinhamento, com decisões, donos e marcos documentados.',
  'perguntas_coaching':['Como transformar a ideia em entrega concreta?','Qual conversa precisa acontecer mesmo sendo desconfortável?','Que compromisso depende de confirmação antes de ser assumido?'],
  'nao_inferir':['Habilidade universal de negociação','Honestidade','Popularidade necessária em todo contexto','Resultado de vendas']
 },
 'S': {
  'nome':'Estabilidade','rotulo':'Constância e cooperação','sigla':'S','cor':'#45ad88',
  'essencia':'Tendência a valorizar consistência, apoio mútuo, previsibilidade e relações colaborativas.',
  'contexto':'Pode aparecer em processos de acompanhamento, suporte, cuidado com relações e mudanças graduais.',
  'forcas':['Sustenta acordos e rotinas','Escuta com atenção','Oferece apoio confiável','Contribui para continuidade operacional'],
  'motivadores':['Clareza e previsibilidade','Relações de confiança','Ambiente cooperativo','Tempo razoável para adaptação'],
  'necessidades':['Antecedência em mudanças','Critérios explícitos e seguros','Espaço para perguntas','Reconhecimento da continuidade e do cuidado'],
  'riscos':['Postergar confrontos necessários','Assumir demandas demais para ajudar','Evitar mudanças úteis','Silenciar preocupações importantes'],
  'sob_pressao':['Pode reduzir exposição e desacelerar','Busca estabilidade e suporte','Pode ceder sem concordar efetivamente'],
  'comunicacao':['Explique o contexto e o porquê da mudança','Estabeleça transição, suporte e próximos passos','Dê espaço para dúvidas sem constrangimento','Cheque concordância real, não só silêncio'],
  'feedback':'Converse em ambiente respeitoso, com antecedência e exemplos; crie um plano gradual e confirme entendimento.',
  'desenvolvimento':['Praticar posicionamento claro em discordâncias','Definir limites de carga e prioridades','Fazer pequenos experimentos com mudança','Solicitar apoio sem assumir sozinho todo o trabalho'],
  'vendas':'Ofereça previsibilidade, implantação assistida e canais de suporte; não transforme cautela em suposta resistência.',
  'lideranca':'Use a consistência para dar segurança; fortaleça a autonomia de dizer não e levantar riscos.',
  'perguntas_coaching':['Em que ponto ajudar começa a prejudicar suas prioridades?','Qual mudança pequena podemos testar com segurança?','O que você realmente pensa sobre esta decisão?'],
  'nao_inferir':['Baixa ambição','Incapacidade de mudar','Submissão','Velocidade de aprendizagem']
 },
 'C': {
  'nome':'Conformidade','rotulo':'Critério e qualidade','sigla':'C','cor':'#669cda',
  'essencia':'Tendência a examinar evidências, padrões, precisão e condições para tomar decisões consistentes.',
  'contexto':'Pode se manifestar em problemas complexos, avaliações de risco, controle de qualidade e decisões técnicas.',
  'forcas':['Identifica inconsistências e riscos','Documenta critérios','Eleva a qualidade das entregas','Testa hipóteses antes de concluir'],
  'motivadores':['Critérios transparentes','Tempo para analisar quando necessário','Acesso a informações confiáveis','Autonomia técnica com responsabilidade'],
  'necessidades':['Contexto e evidências relevantes','Definição explícita de qualidade','Tempo proporcional à complexidade','Ambiente que aceite perguntas críticas'],
  'riscos':['Prolongar decisões por busca de completude','Comunicar com excesso de detalhe','Subestimar fatores humanos','Confundir padrão ideal com exigência de todas as situações'],
  'sob_pressao':['Eleva nível de checagem','Pode questionar premissas repetidamente','Pode adiar uma decisão reversível'],
  'comunicacao':['Apresente dados, premissas e alternativas','Indique o grau de incerteza','Esclareça critérios de qualidade e prazo','Diferencie decisões reversíveis das irreversíveis'],
  'feedback':'Utilize evidências específicas, critérios e oportunidade de esclarecimento, evitando julgamentos vagos.',
  'desenvolvimento':['Definir o que é qualidade suficiente para cada decisão','Treinar sínteses executivas de uma página','Experimentar decisões reversíveis com prazo','Considerar sinais relacionais junto aos dados'],
  'vendas':'Mostre especificações, limitações, referências verificáveis e condições contratuais claras; não trate objeções técnicas como negatividade.',
  'lideranca':'Converta padrões em critérios acessíveis, sem exigir perfeição para tarefas de baixo risco.',
  'perguntas_coaching':['Quais informações faltantes são realmente decisivas?','O que pode ser testado em vez de analisado indefinidamente?','Como resumir esta decisão em três pontos?'],
  'nao_inferir':['Inteligência geral','Frieza emocional','Superioridade técnica automática','Ausência de criatividade']
 }
}

# Cada combinação ordenada sugere ênfase primária + influência secundária, não uma categoria diagnóstica.
blend = {
 'DI':('Direção influente','Combina ação decisiva com energia social.','Pode mobilizar rapidamente, mas precisa equilibrar escuta e compromisso real.','Definir meta, envolver pessoas e registrar decisões.'),
 'DS':('Direção consistente','Combina foco em entrega com busca de continuidade.','Pode exigir velocidade sem oferecer transição suficiente.','Definir objetivo e explicar como preservar segurança na mudança.'),
 'DC':('Direção criteriosa','Combina decisão e rigor sobre evidências.','Pode elevar exigência e cobrança em excesso.','Separar riscos críticos de detalhes aperfeiçoáveis.'),
 'ID':('Influência assertiva','Combina sociabilidade com iniciativa.','Pode comunicar entusiasmo como se fosse decisão tomada.','Fechar acordos com responsáveis, escopo e prazos.'),
 'IS':('Influência cooperativa','Combina conexão social com acolhimento.','Pode evitar discordâncias para preservar a harmonia.','Praticar feedback claro com tom respeitoso.'),
 'IC':('Influência analítica','Combina conexão com preocupação pela qualidade.','Pode oscilar entre improvisação e revisão extensa.','Equilibrar narrativa, evidência e compromisso de execução.'),
 'SD':('Constância assertiva','Combina suporte estável com ação quando há objetivo claro.','Pode acumular frustração antes de impor limites.','Criar rotinas de alinhamento e espaço de discordância.'),
 'SI':('Constância relacional','Combina confiabilidade e relacionamento.','Pode dizer sim a muitas demandas simultâneas.','Negociar prioridades e limites com transparência.'),
 'SC':('Constância metódica','Combina previsibilidade com atenção a processos.','Pode resistir a mudanças mal contextualizadas.','Testar mudanças pequenas com indicadores claros.'),
 'CD':('Precisão orientada à decisão','Combina análise exigente e busca de resultados.','Pode pressionar por certeza impossível antes de decidir.','Definir critérios mínimos e tempo-limite de análise.'),
 'CI':('Precisão comunicativa','Combina análise e capacidade de explicar ideias.','Pode alternar excesso de detalhes com improvisação.','Usar sínteses estruturadas e evidências acessíveis.'),
 'CS':('Precisão paciente','Combina cuidado com processo e consistência.','Pode demorar a questionar rotinas inadequadas.','Avaliar regularmente se o processo ainda atende ao objetivo.')
}
combinacoes=[{'id':'blend-'+k.lower(),'codigo':k,'nome':v[0],'descricao':v[1],'atencao':v[2],'pratica':v[3],'nota':'Síntese editorial hipotética; não equivale a escala psicométrica validada.'} for k,v in blend.items()]

# 4x4: matriz de estratégias de conversa, do emissor para o interlocutor.
interaction_advice={
 ('D','D'):('Compartilhe objetivo, restrições e dono da decisão.','Evite transformar a reunião em competição de autoridade.'),
 ('D','I'):('Explique o resultado desejado e convide ideias de mobilização.','Não corte contribuições sem acolher a intenção.'),
 ('D','S'):('Apresente a mudança e o suporte disponível antes de cobrar adesão.','Não interprete silêncio como compromisso.'),
 ('D','C'):('Mostre dados decisivos, riscos e prazo de decisão.','Não pressione para pular riscos críticos.'),
 ('I','D'):('Vá ao ponto, apresente benefício e feche com pedido concreto.','Evite introduções longas sem decisão.'),
 ('I','I'):('Valorize contribuições e documente acordos ao fim.','Evite sair com entusiasmo e sem responsáveis.'),
 ('I','S'):('Construa confiança e confirme se o ritmo proposto é confortável.','Evite exigir concordância diante do grupo.'),
 ('I','C'):('Apoie a narrativa com evidências verificáveis.','Evite promessas genéricas ou falta de documentação.'),
 ('S','D'):('Seja objetivo sobre limites, riscos e apoio necessário.','Evite concordar apenas para encerrar a pressão.'),
 ('S','I'):('Acolha ideias e negocie prioridades possíveis.','Evite aceitar todos os pedidos informalmente.'),
 ('S','S'):('Cheque responsabilidades e cronograma com clareza.','Evite postergar decisões difíceis para preservar o conforto.'),
 ('S','C'):('Apresente processo, critérios e pontos de validação.','Evite entregar contexto incompleto.'),
 ('C','D'):('Resuma a análise em decisão, risco e recomendação.','Evite começar por todas as exceções.'),
 ('C','I'):('Traduza dados em benefícios e exemplos concretos.','Evite linguagem excessivamente técnica.'),
 ('C','S'):('Explique procedimento e mudanças com antecedência.','Evite críticas descontextualizadas.'),
 ('C','C'):('Alinhe qualidade suficiente, prioridades e prazo.','Evite prolongar a validação sem critério de conclusão.')
}
matriz=[{'id':f'{a}-{b}','origem':a,'destino':b,'orientacao':txt,'evitar':ev,'pergunta_util':{'D':'Qual decisão e prazo você considera adequados?','I':'Como envolver as pessoas certas sem perder o foco?','S':'O que tornaria esta mudança mais previsível?','C':'Que evidência mudaria sua conclusão?'}[b]} for (a,b),(txt,ev) in interaction_advice.items()]

chapters=[
 ('fundamentos','Fundamentos do modelo','conceitos','O que o DISC/ACER descreve','O DISC organiza preferências de comportamento em quatro dimensões. A nomenclatura ACER foi informada pelo responsável do projeto como sua tradução para português. Esta biblioteca mantém um modelo único, com rótulos DISC e sinônimos de consulta ACER.','Perfis são combinações, não caixas rígidas. A mesma pessoa pode agir de modo diferente conforme objetivo, experiência, segurança psicológica e contexto.', ['Peça exemplos de ações observáveis em vez de presumir traços permanentes.','Explore as quatro dimensões, incluindo as menos salientes.','Diferencie autoavaliação, observação e resultados práticos.']),
 ('origem','História e desenvolvimento','conceitos','Da teoria comportamental aos instrumentos','O modelo DISC tem raízes na obra de William Moulton Marston de 1928. Questionários e produtos posteriores foram desenvolvidos por diferentes organizações; não existe garantia de equivalência entre todos eles.','Uma adaptação de nomes para outro idioma não transforma automaticamente o instrumento original em teste validado. Itens, normas, escalas e populações devem ser examinados separadamente.', ['Registrar autoria e origem de cada instrumento.','Não usar dados de confiabilidade de um fornecedor como prova da validade da versão RealTalent.','Documentar mudanças de item e algoritmo.']),
 ('dimensoes','As quatro dimensões','conceitos','D, I, S e C em linguagem de trabalho','D descreve iniciativa diante de desafios; I, comunicação e envolvimento; S, ritmo e cooperação; C, qualidade, critérios e processos. Cada fator está presente em graus variados.','As descrições são hipóteses de preferência comportamental, não fatos definitivos sobre uma pessoa. Um D elevado não demonstra capacidade gerencial; um C elevado não comprova inteligência.', ['Conectar cada leitura a exemplos concretos.','Acolher casos em que o perfil não se ajusta.','Evitar comparações de valor entre perfis.']),
 ('leitura','Como interpretar um resultado','interpretacao','Leitura contextual e cuidadosa','Comece pela composição dos quatro fatores e pelo contexto de resposta. Não reduza o resultado a uma letra, uma cor ou um ranking entre pessoas. Quando a pontuação vier do questionário do ZIP, descreva-a como indicador exploratório.','Compare hipóteses comportamentais com fatos, relatos e oportunidades de desenvolvimento. Explique margens de interpretação quando a psicometria ainda não foi estudada.', ['Pergunte: em que situações isso aparece?','Busque um exemplo que confirma e outro que contraria a hipótese.','Escolha uma ação de desenvolvimento verificável.']),
 ('pontuacao','Pontuação e limites','interpretacao','Escores não são percentis','O aplicativo original contabiliza escolhas associadas a D, I, S e C. Frequências de respostas não são automaticamente percentis populacionais, aptidão, probabilidade de êxito ou intensidade clínica.','Exibir uma porcentagem de escolhas como “preferência no instrumento” exige contextualizar número de itens, regra de cálculo e limites. Não aplicar pontos de corte sem estudos específicos.', ['Publicar fórmula e versão do cálculo.','Registrar dados ausentes, versões e alterações.','Não comparar indivíduos usando métricas incomparáveis.']),
 ('contexto','Comportamento e ambiente','interpretacao','Preferências mudam conforme o contexto','Pressão, cargo, cultura, confiança, familiaridade com a tarefa e incentivos influenciam comportamentos observados. Diferenças entre autoimagem e percepção de expectativa externa precisam ser exploradas como narrativas, não interpretadas automaticamente como conflito psicológico.','É inadequado afirmar que a pessoa possui “verdadeiro eu” em uma escala e “máscara” em outra sem fundamentação empírica.', ['Perguntar sobre exemplos recentes em ambientes distintos.','Investigar variáveis situacionais.','Evitar inferir causas clínicas.']),
 ('feedback','Feedback orientado ao comportamento','comunicacao','Fatos, impacto e acordo','Um feedback útil descreve situação, comportamento observável, impacto e uma próxima ação verificável. Preferências de comunicação ajudam a escolher a forma, mas não alteram a obrigação de dar informações claras e respeitosas.','Evite rotular a pessoa (“você é D, por isso interrompe”). Prefira “na reunião de ontem houve três interrupções; precisamos garantir espaço de fala”.', ['Observar e registrar o episódio.','Perguntar a perspectiva da pessoa.','Combinar comportamento e data de revisão.']),
 ('adaptacao','Adaptação de comunicação','comunicacao','Ajustar a forma sem manipular','Com interlocutores que valorizam velocidade, sintetize decisões; com os mais expressivos, estimule troca; com os que buscam estabilidade, explique a transição; com os criteriosos, apresente evidências.','Essas são hipóteses de preferência. Pergunte diretamente como a pessoa deseja receber informação; jamais atribua estilo apenas à aparência.', ['Confirmar ritmo e formato preferido.','Entregar informação essencial a todos.','Registrar acordos em linguagem simples.']),
 ('conflitos','Conflitos e negociação interna','comunicacao','Transformar diferenças em acordos','Conflitos muitas vezes surgem de ritmo, nível de detalhe, expectativas e critérios distintos. O DISC pode ser usado como vocabulário para perguntar sobre necessidades, não como explicação conclusiva de uma disputa.','Investigue incentivos, poder, sobrecarga e processos; nem todo conflito é comportamental.', ['Nomear o desacordo sem acusação.','Separar fatos de interpretações.','Registrar uma experiência de cooperação com revisão.']),
 ('reunioes','Reuniões inclusivas','comunicacao','Ouvir decisões e informações','Reuniões de qualidade combinam objetivo, informações prévias, turnos de participação e responsáveis. Modere estilos mais dominantes sem excluir iniciativa; dê espaço aos reservados sem obrigá-los a exposição pública.','A preferência individual não determina o direito de falar ou decidir.', ['Enviar pauta antes.','Solicitar contribuições de forma inclusiva.','Encerrar com decisão, dono e prazo.']),
 ('lideranca','Liderança adaptativa','lideranca','Gestão de pessoas sem estereótipos','Liderar exige resultados e qualidade das relações. O modelo pode apoiar conversas sobre autonomia, suporte, ritmo e critérios, mas não substitui avaliação de competências e desempenho observável.','Não atribua pessoas a cargos com base em uma letra.', ['Perguntar de que suporte cada pessoa precisa.','Definir expectativas iguais de resultado e justas de condição.','Revisar o estilo de gestão com feedback do time.']),
 ('equipes','Complementaridade de equipes','lideranca','Diversidade de perspectivas, não quotas de letras','Uma equipe pode se beneficiar de iniciativa, envolvimento, continuidade e rigor. Isso não significa que seja necessário contratar pessoas em proporções predefinidas de D, I, S e C.','Utilize a biblioteca para construir práticas inclusivas e combinados; não para classificar pessoas como “fit” ou “não fit” sem evidência independente.', ['Mapear processos que precisam de revisão.','Garantir contraditório nas decisões importantes.','Distribuir responsabilidades por competência, interesse e carga.']),
 ('mudanca','Gestão da mudança','lideranca','Transições claras e participativas','Mudanças são mais bem conduzidas com propósito, impacto, plano de implantação, canal de dúvidas e aprendizado. Diferentes pessoas podem solicitar velocidade, participação, previsibilidade ou evidências.','Tratar dúvidas como insumos do projeto, não resistência pessoal.', ['Comunicar antes do anúncio amplo quando pertinente.','Definir pilotos e critérios de sucesso.','Medir adoção com dados e relatos.']),
 ('onboarding','Integração de pessoas','lideranca','Acolhimento e expectativas claras','No onboarding, pergunte ao colaborador o que ajuda a trabalhar bem: frequência de acompanhamento, autonomia, informação, feedback e forma de comunicação. O perfil pode oferecer pistas, nunca regras obrigatórias.','Evite apresentar um rótulo ao time sem finalidade clara e base legal adequada.', ['Construir acordo de trabalho.','Ajustar conforme experiência real.','Rever após 30, 60 e 90 dias.']),
 ('vendas','Vendas consultivas','vendas','Conectar necessidades, evidência e decisão','Em vendas, adaptar o discurso significa escutar as prioridades reais do comprador. Para quem privilegia resultados, mostre impacto; para quem valoriza relacionamento, colaboração; para quem busca estabilidade, implantação; para quem pede detalhes, evidências.','A linguagem DISC não autoriza adivinhar o perfil de um lead nem manipular vulnerabilidades.', ['Perguntar critérios de decisão ao comprador.','Confirmar objetivos, limitações e próximos passos.','Documentar necessidades no CRM de forma minimizada.']),
 ('descoberta','Perguntas de descoberta comercial','vendas','Explorar sem rotular','Uma descoberta eficaz investiga desafio, impacto, urgência, pessoas envolvidas, condições de sucesso e riscos. Perguntas devem ser abertas e neutras, evitando supor que o cliente tem um estilo por falar rápido ou pedir dados.','Adaptação de comunicação não é uma licença para direcionar a resposta do comprador.', ['O que precisa melhorar?','Como você avaliará sucesso?','Quais riscos precisam ser resolvidos?']),
 ('objecoes','Objeções em vendas','vendas','Entender antes de responder','Objeções sobre preço, prazo, segurança ou integração pedem diagnóstico: que alternativa existe, qual custo de não resolver, qual evidência falta e quem decide. Use tom e profundidade ajustados ao interlocutor, sem atribuir objeção ao perfil.','Não use suposto estilo comportamental para contornar consentimento ou omitir informação.', ['Validar a preocupação.','Separar fato de hipótese.','Propor teste ou material verificável.']),
 ('posvenda','Pós-venda e sucesso do cliente','vendas','Entrega alinhada ao contrato','Na implantação, diferentes clientes preferem cadências e formatos de acompanhamento. Defina desde o início contatos, canais, responsabilidades, critérios de aceite e forma de escalonamento.','Meça satisfação e adoção; não use o perfil para presumir satisfação.', ['Definir indicadores acordados.','Registrar mudanças de escopo.','Realizar check-ins de adoção.']),
 ('atendimento','Atendimento e experiência','servicos','Jornadas que acolhem diferentes necessidades','Um serviço acessível oferece caminhos distintos para resolver a mesma demanda: resposta rápida, explicação guiada, acompanhamento humano e documentação. O DISC pode inspirar opções de experiência, não segmentação rígida.','O usuário deve poder escolher o atendimento adequado sem ter seu comportamento inferido automaticamente.', ['Oferecer formatos claros.','Informar prazos de modo transparente.','Verificar resolução da necessidade.']),
 ('desenvolvimento','Planos de desenvolvimento','desenvolvimento','Experimentos de comportamento observável','Um plano de desenvolvimento parte de uma situação real, escolhe um comportamento a experimentar, define frequência e indicador observável e revisa o resultado. A pessoa participa da escolha e pode discordar da hipótese sugerida pelo perfil.','Não transforme uma característica exploratória em deficiência permanente.', ['Definir um alvo por vez.','Agendar reflexão e feedback.','Registrar o que funcionou em cada contexto.']),
 ('facilitacao','Workshops e dinâmicas','desenvolvimento','Aprendizagem com segurança psicológica','Em oficinas, cada pessoa pode explorar preferências de trabalho por meio de casos, reflexões e acordos. Evite divulgação compulsória de resultados e comparação pública de colegas.','A facilitação deve explicar confidencialidade, finalidade e possibilidade de não participar.', ['Acordar regras de respeito.','Utilizar cenários fictícios.','Encerrar com ações de equipe, não rótulos.']),
 ('etica','Ética, ciência e privacidade','governanca','Limites claros para decisões sobre pessoas','Cada instrumento exige evidência específica de validade e confiabilidade para sua finalidade. O fato de um fornecedor apresentar pesquisa para seu teste não valida automaticamente o questionário presente no ZIP RealTalent. Resultados individuais devem ser acessados apenas por quem tem finalidade e autorização adequadas.','No Brasil, testes psicológicos e avaliações psicológicas têm regras profissionais específicas; é importante verificar enquadramento e consultar o CFP/SATEPSI, inclusive na modalidade online.', ['Não usar resultado isoladamente para contratação ou desligamento.','Aplicar LGPD: finalidade, necessidade, transparência e segurança.','Oferecer correção, contestação e revisão humana conforme o caso.']),
 ('instrumento','Questionário original do projeto','governanca','Material extraído e pendente de revisão','O ZIP disponibilizado continha 20 perguntas de escolha e 92 adjetivos associados a quatro fatores. A biblioteca os preserva em JSON separado, mantendo seu status de “revisão pendente” por questões de construção de itens, viés e ausência de dados psicométricos específicos.','As alternativas seguem posições fixas no código original (D, I, C, S). Recomenda-se avaliar viés de posição e o impacto de alterar a ordem sem prejudicar comparabilidade dos dados anteriores.', ['Revisar ambiguidade e desejabilidade social.','Examinar itens que não correspondem claramente ao fator marcado.','Criar estudo de consistência, estabilidade, validade e documentação antes de uso avaliativo.'])
]
articles=[]
for key,title,category,lead,para,alert,actions in chapters:
 articles.append({'id':key,'titulo':title,'categoria':category,'subtitulo':lead,'conteudo':para,'alerta':alert,'aplicacao':actions,'tags':list(dict.fromkeys([category,'DISC','ACER',key])),'fonte':'síntese editorial RealTalent; referências na seção de fontes','status':'conteudo_educativo'})

situacoes=[
('Cliente quer resposta imediata','vendas','Confirmar prazo real e fornecer decisão com riscos relevantes, sem sacrificar verificação.','D'),
('Cliente pede demonstração interativa','vendas','Explorar casos reais e encerrar com requisitos, próximos passos e responsáveis.','I'),
('Cliente receia migração de sistema','vendas','Detalhar fases, suporte, reversibilidade e plano de continuidade.','S'),
('Cliente solicita critérios técnicos','vendas','Enviar documentação verificável, limites e hipóteses com prazo de retorno.','C'),
('Vendedor interrompe demais','lideranca','Dar feedback sobre episódios específicos e criar regra de turno de fala.','D'),
('Equipe chega animada sem escopo','lideranca','Converter ideias em backlog, prioridades, dono e data de revisão.','I'),
('Colaborador evita dizer não','lideranca','Checar capacidade, negociar prioridades e valorizar comunicação de limites.','S'),
('Analista revisa indefinidamente','lideranca','Definir qualidade suficiente e janela de decisão por risco.','C'),
('Conflito por ritmo de decisão','comunicacao','Alinhar decisões reversíveis, critérios mínimos e prazo.','D'),
('Conflito entre precisão e rapidez','comunicacao','Listar riscos materiais e aceitar decisões com incertezas explícitas.','C'),
('Mudança de processo sem aviso','lideranca','Compartilhar razão, plano de transição e canal de dúvidas.','S'),
('Reunião monopolizada','comunicacao','Distribuir fala e registrar contribuições antes da decisão.','I'),
('Proposta com muitos slides','vendas','Criar resumo executivo e apêndice com evidências.','D'),
('Cliente prefere relação próxima','servicos','Oferecer interlocutor claro, escuta e acordos de entrega verificáveis.','I'),
('Cliente não retorna mensagens','vendas','Confirmar canal e momento adequados; não inferir perfil a partir do silêncio.','S'),
('Feedback difícil para colega','desenvolvimento','Preparar situação, fatos, impacto e pedido observável em conversa reservada.','S'),
('Alto padrão reduz velocidade','desenvolvimento','Priorizar controles conforme risco e diferenciar versão piloto de final.','C'),
('Líder muda prioridade a cada dia','lideranca','Definir janela de planejamento e critério explícito para exceções.','D'),
('Integração de novo membro','lideranca','Perguntar preferências reais de autonomia, feedback e informações.','S'),
('Uso do DISC para contratar','governanca','Não usar perfil como filtro isolado; consultar orientação técnica, evidências e exigências legais.','C')
]
casos=[{'id':f'caso-{i:02d}','titulo':title,'categoria':area,'situacao':title,'intervencao':interv,'fator_referencia':fator,'perguntas':['Que fato observável evidencia a necessidade?','Como perguntar pela preferência da pessoa sem presumir seu perfil?','Qual resultado indicará melhora?'],'nota':'Exemplo didático. A intervenção não depende de conhecer o perfil real.'} for i,(title,area,interv,fator) in enumerate(situacoes,1)]

perguntas=[
('D','Direção','Qual resultado precisa ser alcançado e até quando?','O que você delegaria para ampliar participação?'),
('D','Pressão','Que informação seria suficiente para decidir com responsabilidade?','O que aconteceria se você escutasse mais uma perspectiva?'),
('I','Conexão','Quem precisa participar desta conversa?','Que promessa precisa ser registrada e confirmada?'),
('I','Foco','Qual ideia terá maior impacto com a capacidade disponível?','O que você fará primeiro, concretamente?'),
('S','Segurança','Que apoio ajudaria a atravessar esta mudança?','Qual discordância ainda não foi verbalizada?'),
('S','Limites','Quais são as prioridades que cabem de fato nesta semana?','A que você precisa dizer não?'),
('C','Evidência','Que dado poderia alterar esta decisão?','Qual nível de precisão é suficiente?'),
('C','Síntese','Como comunicar a conclusão em três pontos?','Qual decisão é reversível e pode ser testada?')
]
coaching=[{'id':f'coaching-{i:02d}','fator':f,'tema':tema,'pergunta_inicial':a,'aprofundamento':b} for i,(f,tema,a,b) in enumerate(perguntas,1)]

course=[
('01','Introdução ao DISC/ACER','30 min','Diferenciar linguagem comportamental de diagnóstico; reconhecer quatro fatores.','Leitura dos fundamentos; reflexão sobre uma situação real.'),
('02','Observação sem rótulos','40 min','Distinguir comportamento observável, interpretação e suposição.','Analisar três cenários fictícios; reescrever rótulos como fatos.'),
('03','Dimensões e combinações','45 min','Descrever tendências e ressalvas sem reduzir pessoas a tipos.','Comparar dois exemplos e buscar contraexemplos.'),
('04','Comunicação flexível','45 min','Ajustar ritmo, detalhe e interação com base em preferência declarada.','Simulação de conversa em quatro formatos.'),
('05','Feedback e conflitos','50 min','Converter conflitos em acordos observáveis.','Praticar feedback de situação, comportamento e impacto.'),
('06','Liderança e equipes','50 min','Usar linguagem de diferenças para fortalecer acordos de trabalho.','Criar pacto de comunicação e revisão quinzenal.'),
('07','Vendas consultivas','50 min','Explorar prioridade real do cliente e adaptar explicação com ética.','Role-play de descoberta, proposta e objeção.'),
('08','Experiência de serviços','35 min','Oferecer jornadas que respondam a ritmos e formatos distintos.','Desenhar quatro opções de interação para um serviço.'),
('09','Resultados e psicometria','50 min','Interpretar dados exploratórios e distinguir escores de percentis.','Revisar o questionário extraído e anotar pontos de validação.'),
('10','Privacidade, legislação e prática','40 min','Identificar limites legais, confidencialidade e mitigação de vieses.','Simular revisão de acesso e finalidade dos dados.')
]
trilhas=[{'id':'modulo-'+n,'numero':n,'titulo':t,'duracao':minutos,'objetivo':ob,'atividade':at,'avaliacao':'Produzir uma resposta aplicada sem classificar terceiros ou emitir diagnóstico.'} for n,t,minutos,ob,at in course]

glossary={
 'DISC':'Modelo descritivo com quatro dimensões: Dominância, Influência, Estabilidade e Conformidade.','ACER':'Nome português adotado para a mesma metodologia no projeto RealTalent; a expansão das letras depende de definição institucional.','D':'Fator de Dominância; leitura exploratória de orientação a desafios e resultados.','I':'Fator de Influência; leitura exploratória de expressão e interação.','S':'Fator de Estabilidade; leitura exploratória de constância e cooperação.','C':'Fator de Conformidade; leitura exploratória de precisão e padrões.','Fator':'Dimensão usada na descrição de preferências comportamentais.','Escala':'Conjunto de itens associado a uma característica definida.','Item':'Pergunta, afirmação ou estímulo usado em instrumento.','Pontuação bruta':'Resultado numérico do cálculo sem padronização populacional.','Percentil':'Posição relativa em distribuição normativa apropriada; não equivale a percentual de respostas.','Confiabilidade':'Estimativa de consistência ou estabilidade da medida em condições definidas.','Validade':'Evidência que apoia uma interpretação e uso específico de escores.','Normatização':'Construção de referências de comparação para população e finalidade definidas.','Viés de resposta':'Influência sistemática de fatores alheios ao construto, como posição ou desejabilidade social.','Desejabilidade social':'Tendência a responder de modo socialmente valorizado.','Autorrelato':'Informação fornecida pela própria pessoa sobre suas experiências ou preferências.','Observação':'Registro de comportamento em situação definida.','Contexto':'Condições ambientais, sociais e da tarefa que influenciam uma ação.','Autoimagem':'Percepção da pessoa sobre si; não equivale automaticamente a traço estável.','Expectativa percebida':'Percepção do que outras pessoas esperam; não comprova expectativas reais.','Combinação de fatores':'Descrição de tendências associadas a mais de uma dimensão, sem diagnóstico.','Feedback comportamental':'Devolutiva baseada em fatos observáveis, impacto e próximos passos.','Plano de desenvolvimento':'Acordo com objetivos, comportamentos de prática, indicadores e revisão.','Ancoragem':'Influência de uma informação inicial na interpretação posterior.','Efeito halo':'Generalização indevida de uma impressão favorável ou desfavorável.','RLS':'Row Level Security: políticas do banco que limitam acesso por linha.','LGPD':'Lei Geral de Proteção de Dados Pessoais brasileira.','Finalidade':'Propósito específico, legítimo e informado para tratamento de dados.','Minimização':'Coletar e manter apenas os dados necessários para finalidade definida.','SATEPSI':'Sistema brasileiro de avaliação da qualidade técnico-científica de testes psicológicos, mantido pelo CFP.','Psicometria':'Campo voltado à construção e ao estudo das propriedades de medidas psicológicas.','Conflito de estilos':'Descrição coloquial de diferenças de preferência; não dispensa análise de processo e poder.','Roteiro comercial':'Estrutura de perguntas e evidências para venda consultiva, sem manipulação comportamental.','Consentimento':'Uma das possíveis bases legais de tratamento de dados, cuja adequação depende do contexto; não é a única base.'
}
termos=[{'id':'gloss-'+str(i).zfill(2),'termo':k,'definicao':v} for i,(k,v) in enumerate(glossary.items(),1)]

fonts=[
 {'id':'f1','titulo':'What Is the Everything DiSC Model?','instituicao':'Everything DiSC / Wiley','url':'https://www.everythingdisc.com/what-is-disc/','uso':'Referência conceitual às dimensões do modelo; não comprova validação do instrumento RealTalent.'},
 {'id':'f2','titulo':'How DiSC profiles work','instituicao':'DiSC Profile','url':'https://www.discprofile.com/what-is-disc/how-disc-works','uso':'Definições e limites de interpretação.'},
 {'id':'f3','titulo':'The Science Behind Everything DiSC','instituicao':'Everything DiSC / Wiley','url':'https://www.everythingdisc.com/the-science-behind-disc','uso':'Exemplo de como pesquisas de confiabilidade e validade devem ser documentadas por instrumento.'},
 {'id':'f4','titulo':'SATEPSI — Perguntas frequentes','instituicao':'Conselho Federal de Psicologia','url':'https://satepsi.cfp.org.br/faq.cfm','uso':'Diretrizes sobre avaliação psicológica e instrumentos no Brasil.'},
 {'id':'f5','titulo':'Resolução CFP n.º 31/2022 — legislação SATEPSI','instituicao':'Conselho Federal de Psicologia','url':'https://satepsi.cfp.org.br/legislacao.cfm','uso':'Consulta às regras brasileiras aplicáveis.'},
 {'id':'f6','titulo':'Lei nº 13.709/2018 — LGPD','instituicao':'Presidência da República','url':'https://planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm','uso':'Base legal para proteção e tratamento de dados pessoais.'},
 {'id':'f7','titulo':'CFP: testes psicológicos e modalidades informatizada/online','instituicao':'Conselho Federal de Psicologia','url':'https://site.cfp.org.br/cfp-orienta-psicologas-sobre-o-uso-de-testes-psicologicos-nas-modalidades-informatizada-e-online/','uso':'Orientação atual sobre modalidades e aprovação de testes.'}
]

mapping={'modelo_canonico':'DISC','alias_projeto':['ACER','DISC/ACER','DISC'],
 'fatores_disc':{k:factor['nome'] for k,factor in factors.items()},
 'equivalencia':['DISC e ACER são apresentados como a mesma metodologia no RealTalent, conforme definição fornecida pelo responsável do projeto.'],
 'letras_acer':{'status':'pendente_confirmacao','significados_individuais':{'A':None,'C':None,'E':None,'R':None},
 'nota':'Não afirmar expansão ou correspondência A→D, C→I, E→S, R→C sem confirmar a nomenclatura institucional.'},
 'apresentacao':'Exibir DISC/ACER no título; usar os fatores canônicos D, I, S, C e nomes em português nas análises até a nomenclatura ACER ser homologada.'}
metadata={'nome':'Biblioteca de Conhecimento DISC/ACER — RealTalent','versao':'1.0.0','data':'2026-10-18','idioma':'pt-BR','tipo':'base_educativa_editorial',
 'destino':'consulta, treinamento, apoio a equipes, liderança, vendas, serviços e integração de IA',
 'escopo':'Conteúdo original editorial, referências públicas, e instrumento extraído do ZIP sob quarentena metodológica.',
 'nao_e':'instrumento psicométrico validado, teste psicológico homologado, diagnóstico ou critério automático de RH',
 'licenciamento':'Texto editorial criado para o projeto; referências externas apenas citadas por links; material original do ZIP mantido em arquivo separado.',
 'aviso_seguranca':'Nenhuma chave, token ou configuração do projeto original foi importada para esta biblioteca.'}

# Persistir artefatos de conteúdo bruto para uso em apps e por agentes.
items={'perfis.json':list(factors.values()),'combinacoes.json':combinacoes,'matriz_comunicacao.json':matriz,'artigos.json':articles,'casos_praticos.json':casos,'perguntas_coaching.json':coaching,'trilhas_aprendizagem.json':trilhas,'glossario.json':termos,'referencias.json':fonts,'equivalencia_disc_acer.json':mapping,'manifesto.json':metadata}
for fname,val in items.items():
 (DATA/fname).write_text(json.dumps(val,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

# Conteúdo plano indexado para SPA, sem requisição de rede: funciona aberto no navegador.
sections=[
 ('conceitos','Fundamentos'),('interpretacao','Interpretação'),('comunicacao','Comunicação'),('lideranca','Liderança e equipes'),('vendas','Vendas'),('servicos','Serviços'),('desenvolvimento','Desenvolvimento'),('governanca','Ética e governança')]
search_records=[]
for item in articles:
 search_records.append({'id':'art:'+item['id'],'kind':'Artigos','group':item['categoria'],'title':item['titulo'],'subtitle':item['subtitulo'],'body':item['conteudo'],'alert':item['alerta'],'points':item['aplicacao'],'keywords':' '.join(item['tags'])})
for k,v in factors.items():
 details=[('Essência',v['essencia']),('Quando pode aparecer',v['contexto']),('Pontos fortes',v['forcas']),('Motivadores',v['motivadores']),('Necessidades',v['necessidades']),('Atenções',v['riscos']),('Sob pressão (hipóteses)',v['sob_pressao']),('Como se comunicar',v['comunicacao']),('Feedback',v['feedback']),('Desenvolvimento',v['desenvolvimento']),('Em vendas',v['vendas']),('Na liderança',v['lideranca']),('Perguntas de coaching',v['perguntas_coaching']),('O que não se deve inferir',v['nao_inferir'])]
 search_records.append({'id':'perfil:'+k,'kind':'Perfis','group':'Perfis','title':k+' · '+v['nome'],'subtitle':v['rotulo'],'body':v['essencia'],'details':[{'head':x,'text':y} for x,y in details],'keywords':'DISC ACER '+k+' '+v['nome']+' '+v['rotulo']})
for item in combinacoes:
 search_records.append({'id':'combo:'+item['codigo'],'kind':'Combinações','group':'Combinações','title':item['codigo']+' · '+item['nome'],'subtitle':item['descricao'],'body':item['descricao'],'details':[{'head':'Atenção','text':item['atencao']},{'head':'Aplicação','text':item['pratica']}],'alert':item['nota'],'keywords':'DISC ACER '+item['codigo']})
for item in matriz:
 search_records.append({'id':'matriz:'+item['id'],'kind':'Matriz','group':'Matriz','title':item['origem']+' → '+item['destino'],'subtitle':'Comunicação: origem '+item['origem']+' / interlocutor '+item['destino'],'body':item['orientacao'],'details':[{'head':'Evitar','text':item['evitar']},{'head':'Pergunta útil','text':item['pergunta_util']}],'keywords':'DISC ACER adaptacao comunicacao '+item['id']})
for item in casos:
 search_records.append({'id':'caso:'+item['id'],'kind':'Casos','group':item['categoria'],'title':item['titulo'],'subtitle':'Caso prático · '+item['categoria'],'body':item['intervencao'],'points':item['perguntas'],'alert':item['nota'],'keywords':'DISC ACER '+item['fator_referencia']+' '+item['categoria']})
for item in coaching:
 search_records.append({'id':'coach:'+item['id'],'kind':'Coaching','group':'Desenvolvimento','title':item['fator']+' · '+item['tema'],'subtitle':'Perguntas de coaching','body':item['pergunta_inicial'],'points':[item['aprofundamento']],'keywords':'DISC ACER coach desenvolvimento '+item['fator']})
for item in trilhas:
 search_records.append({'id':'trilha:'+item['id'],'kind':'Cursos','group':'Cursos','title':'Módulo '+item['numero']+' · '+item['titulo'],'subtitle':item['duracao']+' · '+item['objetivo'],'body':item['objetivo'],'details':[{'head':'Atividade','text':item['atividade']},{'head':'Avaliação','text':item['avaliacao']}],'keywords':'DISC ACER treinamento curso workshop'})
for item in termos:
 search_records.append({'id':'gloss:'+item['id'],'kind':'Glossário','group':'Glossário','title':item['termo'],'subtitle':'Termo e definição','body':item['definicao'],'keywords':'DISC ACER '+item['termo']})
for item in fonts:
 search_records.append({'id':'source:'+item['id'],'kind':'Fontes','group':'Fontes','title':item['titulo'],'subtitle':item['instituicao'],'body':item['uso'],'url':item['url'],'keywords':'referencias metodologia DISC ACER lei ciencia'})

(DATA/'indice_pesquisa.json').write_text(json.dumps(search_records,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

readme=f'''# RealTalent · Biblioteca DISC / ACER

**Versão:** {metadata['versao']} · **Idioma:** Português brasileiro · **Data:** {metadata['data']}

A nomenclatura **ACER** foi informada pelo responsável do projeto como a tradução para português do DISC. A biblioteca trata as duas siglas como **a mesma base conceitual**, não dois testes independentes. Até serem fornecidos os nomes exatos das letras A, C, E e R, preserva os quatro fatores D, I, S e C com seus nomes em português. A equivalência das letras fica **pendente de homologação** em `data/equivalencia_disc_acer.json`.

## Abrir

Abra **`index.html`** em qualquer navegador moderno, inclusive Firefox no Linux. Funciona sem internet e sem servidor: os dados públicos da biblioteca estão incorporados ao HTML. Pesquisa instantânea por DISC, ACER, fator, categoria e termo.

## Conteúdo

- {len(factors)} dimensões extensas com comunicação, liderança, vendas, desenvolvimento, riscos e perguntas.
- {len(combinacoes)} combinações orientativas de dois fatores; **não são escalas validadas**.
- {len(matriz)} interações origem→destino para adaptação responsável de conversas.
- {len(articles)} artigos temáticos nas áreas de fundamentos, interpretação, comunicação, liderança, vendas, serviços, desenvolvimento e ética.
- {len(casos)} cenários práticos, {len(coaching)} roteiros de coaching, {len(trilhas)} módulos de treinamento, {len(termos)} verbetes e {len(fonts)} referências.
- Em `original/instrumento_extraido.json`: **20 perguntas e 92 adjetivos** retirados do projeto enviado; apenas para revisão técnica até comprovação de validade e uso permitido.

## Integração

Os documentos em `data/` são JSON em UTF-8. Pode-se carregar `data/indice_pesquisa.json` em uma busca no CRM, armazenar os artigos em uma tabela com `id`, `tipo`, `categoria`, `texto` e índice de busca ou usar os campos estruturados como base de consulta para o RealTalent Agent.

A interface estática é **somente de leitura**. Não consulta usuários, não envia resultados do teste, não recebe credenciais nem usa a API do Supabase. Isso a torna adequada para uma primeira revisão editorial, mas não substitui uma aplicação autenticada caso seja integrada ao CRM.

## Limites

Este projeto é uma **biblioteca educacional**, não um teste homologado. Não utilizar os resultados para diagnóstico ou decisão automática de seleção, demissão, promoção, remuneração ou saúde. A pesquisa sobre o produto proprietário Everything DiSC® não demonstra validade do instrumento do ZIP RealTalent.

A pesquisa citada abaixo não foi copiada; a redação dos artigos é própria e acompanhada de links. Se precisar implantar um instrumento de avaliação profissional, realizar revisão por especialistas, estudos específicos, documentação e consulta às regras brasileiras aplicáveis.

## Segurança

O ZIP original foi usado **apenas como fonte de conteúdo de questionário**, sem copiar arquivos HTML, variáveis, códigos de acesso, URLs de banco, tokens ou segredos. A exposição de uma credencial administrativa apontada na auditoria anterior continua exigindo revogação em separado.

## Referências e bases de orientação

'''+ '\n'.join(f"- {s['instituicao']} — {s['titulo']}: {s['url']}" for s in fonts)+'''\n
## Estrutura

```text
RealTalent_Biblioteca_DISC_ACER/
  index.html                    Interface interativa autônoma
  data/                         JSONs estruturados e índice pesquisável
  original/instrumento_extraido.json  Conteúdo extraído do questionário (não validado)
  guias/                        Notas operacionais e recomendações
  README.md                     Este arquivo
  build_library.py              Script para reconstruir a interface
```
'''
(BASE/'README.md').write_text(readme,encoding='utf8')
(BASE/'guias'/'INTEGRACAO_AGENT_CRM.md').write_text('''# Integração com RealTalent CRM e RealTalent Agent

## Fonte de conhecimento única

- Tratar `DISC` e `ACER` como **aliases de uma única metodologia** no campo `methodology_key = "DISC_ACER"`.
- Não transformar resultados da biblioteca em decisões automatizadas sobre pessoas.
- Usar `data/indice_pesquisa.json` como fonte de busca e resposta, com filtros por `group` e `kind`.
- No Agent, devolver recomendações como **hipóteses comportamentais**, acompanhadas de contexto e perguntas de confirmação.
- Registrar fonte e versão do conteúdo em cada recomendação.

## Exemplo de registro de conhecimento

```json
{"methodology_key":"DISC_ACER","type":"perfil","canonical_factor":"S","title":"Estabilidade","content_version":"1.0.0","visibility":"educational"}
```

## Esquema sugerido (não executado)

```sql
CREATE TABLE knowledge_articles (
 id text PRIMARY KEY,
 methodology_key text NOT NULL DEFAULT 'DISC_ACER',
 kind text NOT NULL,
 category text NOT NULL,
 title text NOT NULL,
 body jsonb NOT NULL,
 content_version text NOT NULL,
 published boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
```

Se integrado ao banco real, definir RLS, papéis e política editorial antes de publicar. Esta tabela é apenas um **esboço**, nenhuma migration foi aplicada.

## Roteamento de perguntas na IA

1. Detectar intenção: aprender, entender resultado, comunicação, vendas, liderança ou ética.
2. Recuperar capítulos/perfis relevantes, não inventar associações entre letras ACER e DISC.
3. Se depender de resultado individual, solicitar autorização e contexto; respeitar permissões de acesso.
4. Não inferir capacidade, aptidão, diagnóstico ou futuro de pessoa avaliada.
5. Usar exemplos concretos e sugerir perguntas que o interlocutor possa confirmar.

## Publicação web

`index.html` pode ser disponibilizado como página estática em `/biblioteca/disc-acer/`, **separada do código do aplicativo original**. Integrar navegação do CRM exigirá tarefa adicional no repositório que estiver implantado; este ZIP não altera produção nem preview.
''',encoding='utf8')
(BASE/'guias'/'VALIDACAO_INSTRUMENTO.md').write_text('''# Pendências técnicas para o instrumento de avaliação do ZIP

O projeto fornecido contém 20 questões e 92 adjetivos classificados em quatro fatores. Este inventário permanece isolado em `original/instrumento_extraido.json` e requer revisão antes de uso avaliativo.

### Questões críticas

1. Revisar validade de conteúdo e a correspondência de cada opção/adjetivo com o fator atribuído. Por exemplo, o arquivo original associa “Extrovertido” ao fator S e “Perfeccionista” ao fator D; essas atribuições requerem fundamentação e análise especializada.
2. Verificar efeitos da posição fixa de alternativas (D, I, C, S) e estudar uma apresentação equilibrada.
3. Examinar desejabilidade social e diferenciação artificial por respostas forçadas.
4. Definir modelo de escore e tratamento de empate, resposta ausente e inconsistência; preservar histórico de versão.
5. Obter estimativas de consistência, estabilidade, evidências de estrutura interna e de validade para as finalidades pretendidas.
6. Documentar estudo de uso e limites da interpretação, além das regras aplicáveis ao contexto de RH.
7. Confirmar nomes exatos e equivalência das letras **A-C-E-R**; até lá o código canônico é DISC.
8. Não transportar evidências psicométricas de outro produto comercial para o instrumento RealTalent.

**Status:** pendente de revisão metodológica e jurídica. A biblioteca não executa pontuação ou classificação de pessoas.
''',encoding='utf8')

payload=json.dumps({'records':search_records,'sections':sections,'summary':{'articles':len(articles),'profiles':4,'blends':len(combinacoes),'matrix':len(matriz),'scenarios':len(casos),'courses':len(trilhas),'glossary':len(termos)}},ensure_ascii=False)
payload=payload.replace('</','<\\/')
site='''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0d2434"><title>RealTalent · Biblioteca DISC/ACER</title>
<style>
:root{color-scheme:light;--ink:#142e3a;--muted:#6a7e89;--bg:#f4f6f6;--nav:#0f2e3d;--line:#dce6e7;--accent:#1a7e93;--soft:#eff7f7;--focus:#ffd26f}*{box-sizing:border-box}html,body{min-height:100%;margin:0}body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;background:var(--bg);color:var(--ink);line-height:1.55}button,input{font:inherit}button{cursor:pointer}.app{min-height:100vh;display:grid;grid-template-columns:260px minmax(330px,390px) minmax(0,1fr)}.sidebar{background:var(--nav);color:#eff9f9;padding:28px 16px;display:flex;flex-direction:column;gap:22px}.brand{display:flex;gap:12px;align-items:center;padding:4px 10px 22px;border-bottom:1px solid #ffffff26}.brand-icon{width:38px;height:38px;display:grid;place-items:center;font-weight:900;font-size:18px;background:#1a8190;border-radius:12px}.brand small{display:block;color:#9fc4c9;font-size:11px;letter-spacing:.14em;text-transform:uppercase}.brand strong{font-size:17px;letter-spacing:-.03em}.section-title{margin:0 10px 8px;color:#a2c2cb;text-transform:uppercase;letter-spacing:.13em;font-size:10px;font-weight:800}.menu{display:grid;gap:5px}.menu button{background:none;border:1px solid transparent;color:#d7e8e9;text-align:left;padding:11px 12px;border-radius:10px;display:flex;align-items:center;gap:10px}.menu button:hover,.menu button.active{background:#ffffff15;border-color:#ffffff20;color:white}.menu button.active{box-shadow:inset 3px 0 #68c8cb}.dot{width:8px;height:8px;border-radius:50%;background:#7fcac6}.counter{margin-left:auto;font-size:10px;opacity:.7}.side-note{margin-top:auto;border-top:1px solid #ffffff20;padding:20px 10px 0;color:#b3ced4;font-size:12px}.side-note strong{color:#e2ffff}.listpane{background:#fff;border-right:1px solid var(--line);display:flex;flex-direction:column;min-height:100vh}.list-head{padding:35px 25px 22px;border-bottom:1px solid var(--line)}.eyebrow{color:var(--accent);text-transform:uppercase;font-size:11px;font-weight:850;letter-spacing:.16em}.list-head h1{font-size:27px;line-height:1.15;letter-spacing:-.05em;margin:10px 0 9px}.list-head p{color:var(--muted);font-size:13px;margin:0}.searchbar{display:flex;align-items:center;background:var(--bg);border:1px solid var(--line);border-radius:11px;margin-top:23px;padding:0 12px}.searchbar:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px #1a7e9317}.searchbar span{color:var(--accent);font-size:16px}.searchbar input{background:none;border:0;outline:0;padding:13px 9px;width:100%;font-size:13px;color:var(--ink)}.filters{display:flex;gap:6px;flex-wrap:wrap;margin-top:14px}.filters button{border:1px solid var(--line);background:white;color:var(--muted);border-radius:999px;padding:5px 10px;font-size:11px;font-weight:700}.filters button.selected{background:var(--nav);color:white;border-color:var(--nav)}.countline{padding:12px 24px;font-size:11px;color:var(--muted);border-bottom:1px solid var(--line)}.results{overflow:auto;max-height:calc(100vh - 300px)}.entry{display:block;background:white;border:0;border-bottom:1px solid #eaf0f1;text-align:left;padding:16px 24px;width:100%;color:var(--ink)}.entry:hover{background:#f7fafa}.entry.active{background:#edf7f7;border-left:3px solid var(--accent);padding-left:21px}.entry .kind{display:block;color:var(--accent);font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:850}.entry strong{display:block;font-size:14px;line-height:1.3;margin-top:5px}.entry small{color:var(--muted);display:block;margin-top:6px;font-size:11px;line-height:1.45}.empty{padding:28px;color:var(--muted);font-size:13px}.detail{min-width:0;overflow:auto;max-height:100vh;padding:50px min(7vw,90px) 80px}.detail-inner{max-width:850px;margin:auto}.topline{display:flex;justify-content:space-between;align-items:center;gap:15px;border-bottom:1px solid var(--line);padding-bottom:23px;margin-bottom:28px;color:var(--muted);font-size:12px}.topline b{color:var(--ink)}.pill{border-radius:30px;border:1px solid #d2e4e6;color:var(--accent);display:inline-block;padding:5px 10px;font-size:11px;font-weight:750;background:#ecf6f7;margin:0 0 18px}.detail h2{font-size:clamp(30px,4vw,48px);line-height:1.08;letter-spacing:-.055em;margin:0 0 16px;color:#142f3e;overflow-wrap:anywhere}.subtitle{font-size:17px;color:#54717c;margin:0 0 30px;line-height:1.5}.detail p{font-size:15px;line-height:1.82;color:#405b67}.detail h3{font-size:16px;letter-spacing:-.03em;margin:30px 0 10px}.line{height:1px;background:var(--line);margin:32px 0}.alert{margin-top:28px;background:#fffaf0;border-left:3px solid #cf9550;border-radius:0 12px 12px 0;padding:16px 19px;color:#755431;font-size:13px;line-height:1.68}.points{padding-left:22px;color:#375362;line-height:1.85;font-size:14px}.points li+li{margin-top:7px}.rich-section{border-top:1px solid var(--line);padding-top:18px;margin-top:24px}.rich-section h3{margin:0 0 10px}.rich-section p{margin:0}.ref-link{display:inline-block;margin-top:20px;color:var(--accent);font-weight:700;word-break:break-all}.caption{font-size:12px!important;color:#8ca0aa!important;margin-top:36px;border-top:1px solid var(--line);padding-top:20px}.mobile-menu{display:none}.statrow{display:flex;gap:10px;flex-wrap:wrap;margin:24px 0 10px}.stat{font-size:12px;color:#4a6471;background:white;border:1px solid var(--line);padding:9px 12px;border-radius:10px}.stat b{font-size:17px;color:var(--ink);margin-right:4px}.bar{height:4px;background:linear-gradient(90deg,#d66c64 25%,#daa255 25% 50%,#45ad88 50% 75%,#669cda 75%);border-radius:9px;margin:13px 0 26px}.help{display:inline-flex;gap:5px;align-items:center}.logo-a{font-size:14px;letter-spacing:-.04em}.skip{position:absolute;left:-9999px}.skip:focus{left:12px;top:12px;z-index:999;padding:12px;background:var(--focus);color:#000}button:focus-visible,a:focus-visible{outline:3px solid var(--focus);outline-offset:3px}@media(max-width:1100px){.app{grid-template-columns:220px minmax(260px,340px) minmax(0,1fr)}.detail{padding:35px 32px}}@media(max-width:800px){.app{display:block}.sidebar{display:none;position:fixed;z-index:20;inset:0 auto 0 0;width:80%;max-width:310px;overflow:auto;box-shadow:0 0 0 100vmax #0008}.sidebar.open{display:flex}.mobile-menu{display:inline-flex;margin:0 0 14px;background:none;border:1px solid var(--line);padding:8px 12px;border-radius:10px;color:var(--ink)}.listpane{min-height:auto}.list-head{padding:19px 21px}.results{max-height:32vh}.detail{max-height:none;padding:32px 23px 60px}.detail h2{font-size:34px}.topline{margin-bottom:24px}}
</style></head><body><a class="skip" href="#conteudo">Ir para o conteúdo</a><div class="app"><aside class="sidebar" id="sidebar"><div class="brand"><span class="brand-icon">R</span><div><small>RealTalent</small><strong>Biblioteca</strong></div></div><div><div class="section-title">Conhecimento DISC / ACER</div><nav class="menu" id="navigation" aria-label="Seções da biblioteca"></nav></div><div class="side-note"><strong>Uma metodologia. Dois nomes.</strong><br>DISC e ACER são aliases da mesma base. Interpretações são exploratórias, não diagnósticos.<br><br>Versão 1.0 · Leitura offline</div></aside><section class="listpane"><header class="list-head"><button class="mobile-menu" id="openmenu" aria-controls="sidebar" aria-expanded="false">☰ Categorias</button><div class="eyebrow">Centro de conhecimento</div><h1>Biblioteca DISC/ACER</h1><p>Conceitos, perfis, comunicação, liderança, vendas e desenvolvimento em uma única fonte consultável.</p><label class="searchbar"><span aria-hidden="true">⌕</span><input id="query" aria-label="Pesquisar conteúdos" placeholder="Buscar conceitos, perfis ou situações…" autocomplete="off"></label><div class="filters" id="filters" aria-label="Filtrar tipo de conteúdo"></div></header><div class="countline" id="count" aria-live="polite"></div><div class="results" id="results" role="list"></div></section><main class="detail" id="conteudo" tabindex="-1"><div class="detail-inner" id="detail"></div></main></div>
<script id="library-data" type="application/json">__PAYLOAD__</script>
<script>
'use strict';
const DATA=JSON.parse(document.getElementById('library-data').textContent);
const state={group:'Todos',kind:'Todos',query:'',selected:null};
const NAV=[['Todos','Visão geral'],['Perfis','Quatro perfis'],['Combinações','Combinações'],['Matriz','Matriz de comunicação'],['conceitos','Fundamentos'],['interpretacao','Interpretação'],['comunicacao','Comunicação'],['lideranca','Liderança e equipes'],['vendas','Vendas'],['servicos','Serviços'],['desenvolvimento','Desenvolvimento'],['governanca','Governança'],['Casos','Casos práticos'],['Coaching','Perguntas de coaching'],['Cursos','Trilhas de aprendizagem'],['Glossário','Glossário'],['Fontes','Referências']];
const KINDS=['Todos','Artigos','Perfis','Combinações','Matriz','Casos','Coaching','Cursos','Glossário','Fontes'];
const $=id=>document.getElementById(id);
function norm(s){return String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase()}
function match(r){const g=state.group;const groupOk=g==='Todos'||r.group===g||r.kind===g;const kindOk=state.kind==='Todos'||r.kind===state.kind;const q=norm(state.query.trim());const terms=q.split(/\\s+/).filter(Boolean);const searchable=norm([r.title,r.subtitle,r.body,r.keywords, ...(r.points||[]),...((r.details||[]).map(x=>x.head+' '+(Array.isArray(x.text)?x.text.join(' '):x.text)))].join(' '));return groupOk&&kindOk&&terms.every(t=>searchable.includes(t));}
function el(tag,cls,content){let e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e}
function drawNavigation(){const root=$('navigation');root.replaceChildren();for(const [key,label] of NAV){const b=el('button',state.group===key?'active':'');b.type='button';b.setAttribute('aria-pressed',String(state.group===key));b.append(el('span','dot'),el('span','',label));b.addEventListener('click',()=>{state.group=key;state.selected=null;drawAll();closeMenu()});root.append(b)}}
function drawFilters(){const root=$('filters');root.replaceChildren();for(const k of KINDS){const b=el('button',state.kind===k?'selected':'',k);b.type='button';b.setAttribute('aria-pressed',String(state.kind===k));b.addEventListener('click',()=>{state.kind=k;state.selected=null;drawAll()});root.append(b)}}
function detailsText(root,title,content){let box=el('div','rich-section');box.append(el('h3','',title));if(Array.isArray(content)){let ul=el('ul','points');for(let s of content)ul.append(el('li','',s));box.append(ul)}else box.append(el('p','',content));root.append(box)}
function drawDetail(r){let root=$('detail');root.replaceChildren();if(!r){root.append(el('h2','','Nenhum resultado encontrado'),el('p','','Experimente outro termo ou selecione outra seção.'));return}root.append(el('div','topline','REALTALENT · CONHECIMENTO DISC / ACER'),el('span','pill',r.kind),el('h2','',r.title),el('div','bar'),el('p','subtitle',r.subtitle||''),el('p','',r.body||''));if(r.details)for(const d of r.details)detailsText(root,d.head,d.text);if(r.points&&r.points.length)detailsText(root,'Aplicação prática',r.points);if(r.alert)root.append(el('div','alert','Atenção · '+r.alert));if(r.url){let a=el('a','ref-link','Abrir fonte original ↗');a.href=r.url;a.target='_blank';a.rel='noopener noreferrer';root.append(a)}root.append(el('p','caption','Biblioteca educacional e editorial. Não emitir diagnóstico, inferir competência profissional nem tomar decisões automatizadas sobre pessoas a partir de categorias DISC/ACER.'))}
function drawAll(){drawNavigation();drawFilters();const list=DATA.records.filter(match);$('count').textContent=`${list.length} conteúdo${list.length===1?'':'s'} encontrado${list.length===1?'':'s'}`;if(!list.some(x=>x.id===state.selected))state.selected=list[0]?.id||null;const root=$('results');root.replaceChildren();for(const r of list){let b=el('button','entry'+(state.selected===r.id?' active':''));b.type='button';b.setAttribute('role','listitem');b.setAttribute('aria-current',String(state.selected===r.id));b.append(el('span','kind',r.kind),el('strong','',r.title),el('small','',r.subtitle||r.body||''));b.addEventListener('click',()=>{state.selected=r.id;drawAll();if(innerWidth<800)$('conteudo').scrollIntoView({behavior:'smooth'})});root.append(b)}if(!list.length)root.append(el('p','empty','Nenhum conteúdo corresponde aos filtros.'));drawDetail(list.find(x=>x.id===state.selected)||null)}
function closeMenu(){$('sidebar').classList.remove('open');$('openmenu').setAttribute('aria-expanded','false')}
$('query').addEventListener('input',e=>{state.query=e.target.value;state.selected=null;drawAll()});$('openmenu').addEventListener('click',()=>{const open=$('sidebar').classList.toggle('open');$('openmenu').setAttribute('aria-expanded',String(open))});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});drawAll();
</script></body></html>'''
site=site.replace('__PAYLOAD__',payload)
(BASE/'index.html').write_text(site,encoding='utf8')
print(json.dumps({'perfis':len(factors),'artigos':len(articles),'combinacoes':len(combinacoes),'matriz':len(matriz),'casos':len(casos),'coach':len(coaching),'cursos':len(trilhas),'glossario':len(termos),'fontes':len(fonts),'itens_ui':len(search_records)},ensure_ascii=False))

# Preserva a UI 2.0 ao regenerar dados (sem dependências adicionais).
import re as _re
_ui_file = BASE / 'index.html'
_ui = _ui_file.read_text(encoding='utf8')
_ui = _re.sub(r'<script>\s*[\r\n]*[\s\S]*?const DATA=JSON.parse\([\s\S]*?</script>', '<script src="app.js" defer></script>', _ui, count=1)
_ui = _ui.replace('</style></head>', '</style><link rel="stylesheet" href="app.css"></head>', 1)
_ui_file.write_text(_ui, encoding='utf8')
