# RealTalent Professional V9.2 — Clientes 2.0

## Escopo entregue

A V9.2 incrementa a V9.1 sem alterar as nove abas principais da sidebar nem o contrato demonstrativo de compartilhamento com a Minha Jornada.

- **Listagem**: busca por nome, processo, objetivo; filtros de todos/ativos/atenção/pausados/encerrados/arquivados; ordenação por nome, próxima sessão, atualizações e pendências.
- **Cadastro progressivo**: identificação fictícia e modalidade; objetivo é opcional; processo pode ser criado posteriormente.
- **Edição de cadastro**: identificação, foco, modalidade e situação. Pausar, encerrar e arquivar NÃO apagam sessões, processos nem históricos associados.
- **Workspace**: cabeçalho persistente com contexto, situação, modalidade e atalhos para editar, criar processo, agendar sessão e atribuir atividade.
- **Visão geral**: próximo passo operacional derivado de dados existentes; não se pretende fazer classificação psicológica automática.
- **Linha do tempo**: eventos unificados do processo, derivados de sessões, atividades, DISC/ACER, orientações e planos. Filtro por tipo e período, com links para os registros originais. Não duplica nem cria novos registros de sessão.
- **Compatibilidade**: nove módulos da V9.1 e seis abas do cliente preservados. Minha Jornada e relatórios originais mantidos.

## Limites e requisitos antes do uso real

**Esta é uma aplicação DEMONSTRATIVA armazenada em localStorage.** A interface de papéis não substitui autenticação ou autorização. Dados fictícios são a única entrada adequada nesta versão. Não há sincronização entre profissionais e clientes em dispositivos separados, RBAC, auditoria confiável ou política de retenção efetiva. Antes de disponibilizar a profissionais, devem ser implementados backend multiusuário, autenticação, segregação de dados, controle de acesso, segurança, validação regulatória e testes de ponta a ponta.

O DISC/ACER foi preservado como instrumento educativo; esta versão não apresenta comprovação para utilização como teste psicológico validado.

## Validação

- `python qa/testar-clientes-v92.py` — fluxos interativos da V9.2 (Chromium, dados locais fictícios).
- `python qa/testar-sidebar-v91.py` — regressão das nove abas.
- `python qa/testar-fluxos-v9.py` — cadastro, processo, sessão, DISC/ACER e devolutiva.
- `node testar-nucleo-v81.js` — escopo/visibilidade e questionário distribuído.
- `python testar-v9.py` — verificação estrutural adaptada à V9.2.
- `python scripts/verify-build.py` — integridade SHA256 do ZIP extraído.

Capturas de teste podem conter logotipo ausente porque a navegação automatizada utiliza HTML injetado sem servidor HTTP; o recurso está presente no pacote.
