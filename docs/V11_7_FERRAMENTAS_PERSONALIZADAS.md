# RealTalent V11.7 — Construtor de Ferramentas Personalizadas

## Objetivo
Permitir que profissionais criem **formulários educativos personalizados** com seções e perguntas, atribuam esses materiais a um cliente e revisem respostas na mesma estrutura de acompanhamento da RealTalent DISC/ACER.

**Não é um construtor de testes psicológicos**, não pontua automaticamente, não gera diagnósticos nem substitui avaliações profissionais regulamentadas.

## Fluxo de uso
1. **Professional → Ferramentas → Minhas ferramentas → Criar formulário**.
2. Defina título, categoria, objetivo e instruções.
3. Crie até oito seções, com até doze perguntas em cada seção (limite total de quarenta). Renomeie, descreva, ordene e remova seções/perguntas.
4. Selecione o tipo por pergunta:
   - Resposta curta (até 240 caracteres);
   - Texto longo (até 1.400 caracteres);
   - Escolha única (2 a 8 opções);
   - Múltiplas escolhas (2 a 8 opções);
   - Escala de 1 a 5 (educativa, sem cálculo automático).
5. Marque perguntas obrigatórias, configure alternativas e abra **Pré-visualizar**.
6. Clique **Salvar ferramenta**.
7. Abra **Clientes → cliente → Atividades → Atribuir ferramenta própria**.
8. Escolha ferramenta, objetivo e disponibilidade (**Rascunho interno** por padrão ou **Liberar na Minha Jornada**).
9. Na **Minha Jornada**, o participante responde à atividade; a plataforma valida as respostas por tipo e obrigatoriedade antes de salvar.
10. O profissional consulta as respostas organizadas por seção e pode registrar uma devolutiva privada ou explicitamente compartilhada.

## Contratos e compatibilidade
- A biblioteca de ferramentas mantém a chave demonstrativa `rt-v116-custom-tools-demo`; registros V11.6 sem `sections` permanecem como roteiros legados.
- A estrutura do formulário é persistida em `sections: [{id,title,description,questions:[{id,label,type,required,options}]}]`.
- **O ato de atribuir congela uma cópia do formulário** dentro do registro de atividade do cliente, com `kind='formulario-personalizado'`, mantendo as perguntas estáveis mesmo depois de editar ou apagar o formulário da biblioteca.
- Formulários personalizados usam o armazenamento demonstrativo central `RTDemoStore`, com vínculo `programId` + `goalId` e estados `atribuido`, `respondido` e `devolvido`.
- `submitCustomForm` só aceita submissões de atividades liberadas no contexto do cliente selecionado. Rejeita IDs não previstos, respostas inválidas, campos obrigatórios vazios e reenvio da mesma atividade.
- A devolutiva segue `feedbackVisibility` e fica restrita ao profissional por padrão.
- Os exercícios antigos de três perguntas não foram removidos: `submitInstrument` e `assignGuidedActivity` continuam ativos.
- Recursos da Biblioteca V11.5, Apresentador V11.4 e Plano de Ação V11.6 permanecem disponíveis.

## Organização visual
- Editor de largura confortável, título e ações no topo, informações da ferramenta em bloco separado;
- Seções visualmente agrupadas, controles ↑/↓ e exclusão, inclusão de pergunta no fim de cada seção;
- Formato de pergunta, alternativas e campo obrigatório próximos ao enunciado;
- Prévia do formulário sem salvar respostas e sem alterar a versão atribuída;
- Minha Jornada exibe uma seção por bloco, perguntas legíveis e mensagens de validação;
- Aparência responsiva com tokens claro/escuro, foco de teclado e menos texto auxiliar.

## Limites e segurança
**DEMONSTRAÇÃO LOCAL COM DADOS FICTÍCIOS EXCLUSIVAMENTE.** Não há login real, isolamento entre profissionais, controle seguro de acesso, backups, consentimentos, criptografia de registros ou distribuição protegida de questionários. Os bloqueios de autorização aqui são somente demonstrações em JavaScript, não segurança em servidor. Não inserir respostas clínicas, dados pessoais ou nomes reais.

O catálogo pode armazenar até 60 ferramentas no navegador. Existe limite de seções/perguntas e texto; o armazenamento local pode ser apagado pelo usuário/navegador. Respostas não têm pontuação, cálculo de escore, assinatura, lógica condicional, anexos, PDF exportável ou sincronização entre dispositivos.

## Verificação
```bash
python3 scripts/verify-build.py
node qa/testar-ferramentas-v117.mjs
python3 qa/testar-ferramentas-v117.py
node qa/testar-professional-v116.mjs
node qa/testar-ciclo-atividades-v917.js
```

O teste estrutural verifica os cinco tipos de resposta, cópia congelada da ferramenta atribuída, validação de alternativas, limites, vinculação a cliente, análise profissional, privacidade de devolutivas e compatibilidade legada.
O E2E Chromium acompanha a criação, atribuição, resposta e revisão.

Antes da Production: **aprovação de CI, QA visual no Firefox/Linux e homologação de segurança real com autenticação, banco isolado e permissões de servidor**.
