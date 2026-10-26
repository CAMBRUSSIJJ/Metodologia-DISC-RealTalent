# RealTalent V9.17 — Ciclo de Atividades Guiadas

## Fluxo demonstrativo
1. O profissional atribui uma reflexão vinculada a um objetivo de um processo ativo. Ela permanece privada por padrão.
2. O profissional libera explicitamente para Minha Jornada.
3. O participante fictício responde uma única vez. A resposta chega ao mesmo registro profissional.
4. O profissional revisa e decide se a devolutiva permanece restrita ou será compartilhada.
5. Uma devolutiva compartilhada aparece no portal; a atividade não volta à lista de pendências.
6. Meu desenvolvimento apresenta a atividade dentro do objetivo correspondente e o Plano de Desenvolvimento reúne atalhos de revisão.

## Correções e compatibilidade
- Corrigido o estado 'devolvido' no painel do participante: respostas entregues não voltam a aparecer como pendentes.
- O seletor de objetivo acompanha o processo selecionado no formulário.
- Atividades antigas da demonstração são associadas ao primeiro objetivo do próprio processo na migração.
- Não há segundo cadastro ou estado paralelo: as áreas utilizam os mesmos registros.
- Devolutivas internas permanecem omitidas em clientView; o isolamento demonstrativo entre clientes foi testado.

## Limitações
Exclusivamente dados fictícios. LocalStorage não oferece autenticação, autorização no servidor nem proteção para informações clínicas e pessoais. Não utilizar pacientes reais. DISC/ACER permanece recurso educativo e não diagnóstico nem teste psicológico validado.

## QA
- `node qa/testar-ciclo-atividades-v917.js`
- `python qa/testar-ciclo-atividades-v917.py`
- `python scripts/verify-build.py`
