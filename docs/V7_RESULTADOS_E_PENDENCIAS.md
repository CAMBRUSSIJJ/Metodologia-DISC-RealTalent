# RealTalent V7 — Implementação e limites (20/10/2026)

## Entregue neste ZIP

1. **H0 / versão verificável:** diretório isolado, manifesto de arquivos, verificador SHA256, porta padrão 8790 e servidor que desabilita cache de HTML/JS/CSS. A tela de entrada apresenta V7.0. Nenhuma alteração no GitHub/Vercel.
2. **Núcleo demonstrativo atualizado:** esquema V7, migração local V5→V7 com visibilidade restrita por padrão, geração de identificadores aleatórios/UUID, exclusão de pautas internas na visualização do cliente, manutenção do vínculo cliente→processo.
3. **Fluxo novo completo (somente mesmo navegador):** profissional atribui reflexão guiada a um processo; cliente fictício visualiza e responde; profissional revisa a resposta e pode disponibilizar devolutiva explicitamente. O profissional acessa instrumentos por processo/cliente ou pela nova aba global.
4. **Minha Jornada:** home orientada à próxima ação, objetivos e encontros, reduzindo destaque de números administrativos; layout, escala tipográfica, contraste e formulários complementares com tokens roxos compartilhados.
5. **Compatibilidade:** `index.html` original, mapeamento/relatórios, Biblioteca DISC/ACER, Communication Lab e seus dados permanecem no pacote, sem converter resultados automaticamente.

## NÃO entregue / não alegar

- Login real, papéis seguros, controle de acesso no servidor, sincronização entre dispositivos, RLS ou storage criptografado.
- Integração técnica das respostas do questionário DISC/ACER **original** ao novo processo — depende de revisão metodológica e contrato de dados; o novo fluxo é **reflexão educativa**, sem pontuação ou interpretação psicológica.
- Revisão regulatória e documental concluída; não apto ao uso com pessoas reais.
- Refatoração completa do legado em framework/componentes modernos. O tema existente V6 ainda usa CSS corretivo, embora V7 reduza inconsistências visíveis no novo fluxo.
- Testes end-to-end em navegador certificando toda interface. Verificar manualmente em dispositivos e navegadores reais.

## Roteiro de validação manual

- Inicie com `bash abrir-linux.sh` (padrão 8790) e confira `/acesso.html` com V7.0.
- Abra Professional → Instrumentos e atividades → Atribuir atividade → selecione processo e `Liberar para Minha Jornada`.
- Abra Minha Jornada → selecione o cliente fictício correto → Atividades guiadas → Responder. Envie três textos fictícios.
- Retorne ao Professional → Instrumentos → Revisar resposta → digite devolutiva; deixe privada e valide ausência na Minha Jornada; depois libere e valide presença.
- Crie cliente e atividade, atualize página, crie outro e confira IDs distintos no armazenamento demonstrativo.
- Confirme que atividades/sessões novas como privadas não aparecem no portal; alternar clientes não expõe atividades de outros processos.
- Teste tema claro/escuro, navegação, menu móvel (390 px), zoom de 200%, teclado e limpeza de cache.

## Próximas etapas necessárias para uso comercial

- H1: backend autenticado multiusuário, vínculo verificável profissional↔participante, RLS, auditoria confiável, políticas de privacidade e segregação técnica de dados.
- H2: extrair componentes de interface para um sistema único e remover dependência de grande volume de `!important`.
- H5: conector do instrumento original sob revisão metodológica, devolutiva autorizada e validação profissional.
- H6/H7: segurança, revisão regulatória, QA E2E, testes de acessibilidade e piloto com profissionais habilitados.
