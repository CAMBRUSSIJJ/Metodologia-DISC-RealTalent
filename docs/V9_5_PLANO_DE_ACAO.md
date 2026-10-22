# V9.5 — Plano de Ação do Professional

## Problema corrigido
A rota `#plano-acao` carregava o `disc-engine.html` em um iframe, reproduzindo o início e a navegação da plataforma antiga dentro do Professional. Essa experiência foi **substituída por um módulo nativo**. O `disc-engine.html` foi preservado no pacote por compatibilidade e para o acervo de relatórios, mas não aparece nesta tela.

## Estrutura
- **Plano de desenvolvimento:** objetivo e acompanhamento por processo (`#plano-desenvolvimento`).
- **Plano de ação:** compromissos concretos que operacionalizam esses objetivos (`#plano-acao`).
- **Legenda:** Pendente (compromisso em aberto), Prazo vencido (prazo expirado), Concluída (execução confirmada) e Compartilhada (disponível na Minha Jornada). A legenda não mede melhoria psicológica nem valida o instrumento.
- **Resumo:** ações em aberto, com prazo vencido e concluídas.
- **Filtros:** em aberto, atrasadas, concluídas, todas; filtro por processo.
- **Gestão:** criar, editar título/prazo/recurso/visibilidade, concluir ou reabrir ação, abrir o workspace do cliente.
- **Integração:** os mesmos objetos `db.actions` vinculados a `db.programs`; não há duplicação de registros.

## Regras
- Somente itens explicitamente `visibility: 'compartilhado'` aparecem na Minha Jornada.
- Atraso é inferido por `due < hoje` e não é salvo como outro status.
- Uma ação concluída pode ser reaberta.
- O cadastro e os dados permanecem APENAS no navegador (demonstração). Não usar dados reais.

## Testes
`python3 qa/testar-plano-acao-v95.py`
`python3 qa/testar-fluxos-v95.py`
`python3 qa/testar-sidebar-v91.py`
`python3 qa/testar-clientes-v92.py`
`python3 qa/testar-workspace-v93.py`
`python3 qa/testar-abas-cliente-v94.py`
`python3 scripts/verify-build.py`

## Pendências para produção real
Login, banco seguro, permissões no backend, isolamento de organizações e profissionais, logs, controle de acesso a dados sensíveis, testes de produção e validação ética/metodológica DISC/ACER.
