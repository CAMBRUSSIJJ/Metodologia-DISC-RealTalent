# RealTalent V9.16 — Desenvolvimento e Plano de Ação (Preview)

## Consolidação funcional

- Objetivos específicos podem ser editados preservando o ID e os compromissos já associados.
- Cada objetivo mostra ações pendentes e concluídas e oferece **Ver ações**, **Editar objetivo** e **+ Ação**.
- O filtro por objetivo preserva os filtros de situação nas abas do cliente.
- Nova ação usa o objetivo de origem, exige vínculo válido, prazo e descrição, e adota **Somente profissional** por padrão.
- Compromissos que surgiram em sessões oferecem acesso direto à sessão de origem.
- O Plano de Ação global apresenta contagens coerentes com o processo selecionado e explicita objetivo e sessão associados.
- A seção de continuidade usa dados existentes da agenda e ações pendentes; não duplica registros.
- São mantidas as funcionalidades V9.13, V9.14 e V9.15.

## Limites e responsabilidade

Somente dados fictícios. A plataforma permanece sem autenticação, autorização por servidor e armazenamento seguro.
Não devem ser registrados dados clínicos ou pessoais reais. A execução de uma atividade não representa
evolução psicológica, diagnóstico ou validação do instrumento DISC/ACER.

## Testes

- node qa/testar-v916-vinculos.js
- python qa/testar-objetivos-acoes-v916.py
- python qa/testar-atendimento-integrado-v914.py
- python qa/testar-jornada-profissional-v915.py
- python scripts/verify-build.py
