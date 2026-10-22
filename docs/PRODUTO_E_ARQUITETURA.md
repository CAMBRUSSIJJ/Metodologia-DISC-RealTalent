# RealTalent — Diretriz do produto e arquitetura de evolução

## Declaração de propósito

A RealTalent é uma plataforma de apoio à atuação de profissionais de Psicologia em processos estruturados de coaching e desenvolvimento humano e comportamental, facilitando o planejamento, a condução, a documentação pertinente e o acompanhamento de objetivos, sob responsabilidade profissional e conforme as normas aplicáveis.

## Quem usa

- **Psicóloga(o) responsável:** configura o processo, conduz sessões, seleciona recursos, registra acordos e decide que informações podem ser compartilhadas.
- **Cliente:** participante do processo, com acesso futuro apenas a tarefas, agenda e conteúdos explicitamente compartilhados, mediante autorização e regras definidas.
- **Administrador da organização:** gestão operacional e faturamento; sem acesso automático a conteúdos sigilosos de sessões.

> Qualquer acesso de terceiros ao conteúdo de sessões depende de definição clara de papéis, necessidade, base legal e medidas éticas aplicáveis. Administração operacional e acesso ao conteúdo confidencial devem ser separados.

## Jornada principal

1. Informar finalidade, limites, papéis e acordos do acompanhamento.
2. Criar vínculo profissional–cliente com acesso restrito.
3. Definir objetivos observáveis e critérios de acompanhamento conjuntamente.
4. Preparar e conduzir sessões com instrumentos pertinentes.
5. Compartilhar atividades, apenas quando adequado e autorizado.
6. Revisar o cumprimento dos acordos e a evolução dos objetivos.
7. Encerrar ou redirecionar o acompanhamento conforme julgamento técnico.

## Domínios futuros (backend seguro)

| Entidade | Responsabilidade | Proteção mínima |
|---|---|---|
| Organization | Escopo institucional e contratos | Tenant isolation |
| ProfessionalMembership | Profissional e vínculo à organização | Autorização por papel, auditoria |
| Client | Dados estritamente necessários do cliente | Separação por profissional e consentimentos |
| CoachingProcess | Finalidade, etapas, objetivos | Acesso do profissional responsável |
| CoachingSession | Agenda, objetivos, documentos autorizados | Controle mais restrito para registros sensíveis |
| ActionPlan | Ações e prazos pactuados | Compartilhamento explícito |
| KnowledgeResource | Materiais e referências | Controle editorial e versionamento |
| AccessEvent | Acesso e modificações relevantes | Registro mínimo, seguro e com retenção |

## Considerações para arquitetura de produção

- Auth real com MFA opcional, recuperação segura de conta e políticas RLS, com isolamento efetivo no backend.
- Proibir `service_role` e credenciais administrativas no JavaScript público.
- Autorização deve ser validada em cada operação de backend, não apenas na interface.
- Definir finalidade, transparência, consentimento quando aplicável, retenção e exclusão sob LGPD e regras profissionais.
- Segregar notas de sessão, anotações clínicas e comunicações de gestão; nunca incluir esse material em analítica coletiva por padrão.
- Fazer análise de ameaças, auditoria, controles de acesso e rotina de resposta a incidentes.
- Validação regulatória/ética dos instrumentos antes de classificá-los como teste psicológico.
- O modelo DISC/ACER é **educativo e contextual**, não fonte de diagnóstico ou recomendação automática sobre pessoas.
- O mapeamento legado precisará de uma auditoria técnica e metodológica antes de qualquer uso profissional com clientes.

## O que NÃO existe na V4.0

Banco para o workspace, armazenamento durável de clientes, integração com agenda real, portal de cliente, autenticação do workspace, prontuário, geração de relatório profissional formal, validação psicométrica e IA vinculada a conteúdo sigiloso. Não atribuir essas funcionalidades ao produto sem implementação e teste.
