# RealTalent V5.0 — Implementado e pendente

## Implementado neste pacote

- Landing `acesso.html` com experiências separadas e acesso à plataforma original.
- RealTalent Professional com navegação de clientes, processos, sessões, planos, recursos, perfil de atuação e diretrizes.
- Novo portal `cliente/index.html` com Minha Jornada, atividades, encontros, desenvolvimento, materiais, reflexões e perfil.
- Núcleo comum de dados fictícios com persistência local versionada (mesmo navegador, mesma origem) e reinicialização.
- Profissional pode criar cliente, processo, sessão, atividade, compartilhar orientação e ver reflexões marcadas como compartilhadas. Atividades e sessões podem ser designadas como internas ou compartilhadas; a pauta interna de sessões não é exibida no portal, que recebe um título separado.
- Participante pode concluir/reabrir atividades, registrar reflexões fictícias, compartilhar/restringir ou apagar essas reflexões; o status fica visível ao profissional.
- Filtragem de demonstração por cliente; cliente não recebe sínteses internas de sessão; biblioteca técnica não exposta como menu do participante.
- Interface responsiva, feedback de ação, navegação por teclado e etiquetas acessíveis.
- `index.html` original preservado, com links para as duas experiências; Biblioteca e telas legadas mantidas.

## Não implementado / não validado

- Login/convites/autenticação entre pessoas reais; nenhum vínculo real de profissional-cliente.
- Autorização de acesso no servidor/RLS, armazenamento criptografado, sincronização entre dispositivos ou base em nuvem.
- Atendimento remoto integrado, assinatura de termos, pagamentos, gestão clínica e documentos oficiais.
- Correções ou validação psicométrica do DISC/ACER.
- Liberação de relatórios e instrumentos para clientes baseada em permissões regulatórias.
- Conformidade LGPD/CFP certificada; avaliações jurídicas/éticas e políticas oficiais.
- Testes E2E em navegador **não executáveis neste ambiente** (Chromium bloqueia navegação local); exigir QA manual no Debian e CI apropriado antes de produção.

## Como demonstrar o ciclo

1. Abrir `acesso.html` → **Sou profissional**.
2. Selecionar um cliente fictício em `Clientes`, abrir processo e atribuir atividade + compartilhar orientação.
3. Selecionar **Prévia da jornada**; o participante visualiza a atividade/orientação, marca conclusão e cria reflexão privada.
4. Voltar ao profissional: a reflexão privada não deve aparecer; marcá-la como compartilhada na jornada e verificar novamente.
5. Reabrir ambas as telas; o estado deve persistir **no mesmo navegador e origem**, via LocalStorage. Reiniciar demo no workspace profissional limpa o estado fictício.

## Próximas fases de engenharia

**H1 (bloqueante):** identidade real, entidade de organização/profissional/cliente, vínculos verificados, auth + RBAC/RLS, logging de servidor, proteção de dados, termos e design do convite. **Não migrar dados do demo**.

**H2:** workspace unificado por cliente com registro adequado a cada modalidade profissional, agenda e sessões, formulários e templates; gestão de documentação compatível com atuação.

**H3:** portal real com convites únicos, confirmação de identidade, acesso estritamente pessoal, ciclo de vida de acesso e notificações seguras.

**H4:** planos colaborativos persistidos, versionamento e aprovação, atribuição de recursos, devolutiva controlada, medidas de resultado adequadas ao contexto e revisão humana.

**H5:** otimização da UX, automações e suporte inteligente administrativo sob permissões e controle profissional.
