# RealTalent V9.7 — Consolidação de fluxos (demonstração)

## Mudanças verificáveis
- DISC/ACER: rascunho automático por `clientId` + `assignmentId` em `localStorage`, salvo ao marcar alternativa ou adjetivo; retomada após recarregar. Limpeza após envio, cancelamento/restrição e reset de demonstração quando detectada.
- Metadado `startedAt` disponível ao profissional, **não** contém as respostas do rascunho.
- Aplicações DISC/ACER: cancelar aplicação ativa com confirmação, manter linha histórica e permitir reaplicação posterior (cancelamento não é exclusão).
- Minha Jornada: encontros agendados com horário ultrapassado são separados em "Aguardando confirmação"; não são automaticamente declarados concluídos.
- Suíte QA: screenshots em `%TEMP%` ou `$REALTALENT_QA_OUTPUT`, nunca sobrescrevem as evidências incluídas no manifesto.
- Testes estruturais antigos atualizados às dez abas da sidebar.

## Limites importantes
**Não existe autenticação**, autorização no servidor, criptografia de dados, banco seguro nem sincronização entre dispositivos. Rascunhos ficam acessíveis a quem usar o mesmo perfil de navegador. **Não utilize dados pessoais, clínicos nem psicológicos reais**.
DISC/ACER utilizado como exercício educativo de demonstração; não apresentado como avaliação psicológica validada.

## Verificação
`python3 scripts/verify-build.py`; `python3 testar-v9.py`; `python3 qa/testar-workflow-v97.py`; outros testes em `qa/`.

## Próxima fase
V9.8 design system; V10.0: autenticação, RLS, trilha auditável no servidor, modelagem segura de cliente/processo/instrumento e sincronização multiusuário.
