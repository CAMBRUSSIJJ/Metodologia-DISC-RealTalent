# RealTalent V5.0 — Segurança, acesso e limites de uso

## Status do produto

**MVP local demonstrativo**. A navegação entre profissional e participante, escolha de perfil, armazenamento e filtragem dos dados servem exclusivamente para explorar a experiência. **Não são mecanismos de segurança**.

- LocalStorage é legível por qualquer pessoa ou script com acesso ao navegador/origem.
- O parâmetro `?demo=c1` e a lista de participantes simulam a seleção de contexto; **não são autenticação**.
- A marcação `privado` filtra apenas a interface profissional. Não equivale a proteção criptográfica, controle de acesso no servidor ou sigilo profissional.
- Registros de sessão no protótipo podem conter uma síntese interna fictícia, que **não é enviada para a função `clientView`**. Isso prova apenas segregação de apresentação, não isolamento técnico.
- Não inserir clientes reais, CPF, contatos, dados sensíveis, informações de saúde, documentos psicológicos, registros clínicos nem identificadores.
- O aplicativo original de julho, preservado em `index.html`, tem seu próprio fluxo e integrações legadas; precisa de auditoria separada antes de produção.

## Matriz de acesso-alvo (a implementar com backend)

| Entidade | Profissional autorizado | Cliente autenticado | Administrador comercial |
|---|---|---|---|
| Dados administrativos de vínculo | Vinculados | Próprios | Apenas necessários à operação |
| Processos e objetivos compartilhados | Processos atribuídos | Próprios e compartilhados | Não |
| Atividades e prazos | Atribuídos | Próprios | Não |
| Agenda da sessão | Vinculada | Suas datas/pautas compartilhadas | Apenas agenda operacional quando autorizado |
| Anotações técnicas e registros restritos | Conformidade profissional, necessidade e vínculo | Acesso por fluxo legal apropriado, não por visualização livre | Não |
| Reflexões privadas | Não | Somente titular | Não |
| Reflexões compartilhadas | Apenas profissional destinatário autorizado | Titular | Não |
| Devolutivas | Produção e liberação autorizadas | Apenas conteúdo compartilhado, observados direitos legais | Não |
| Biblioteca técnica | Conforme atuação e licença | Apenas materiais liberados | Não |

## Backend obrigatório antes de uso real

1. Supabase Auth ou equivalente com sessão, MFA quando necessário, revogação e recuperação segura.
2. Identidade única, organizações, memberships, profissional responsável, cliente titular e vínculo confirmado.
3. Políticas RLS por registro; profissional só acessa vínculo ativo; cliente só acessa conteúdo próprio e liberado.
4. API com autorização por recurso e propriedade; não confiar em `clientId` enviado pelo navegador.
5. Dados restritos segregados por tabela/escopo, criptografia em trânsito/repouso, cópias de segurança e retenção.
6. Compartilhamento explicitamente registrado, com autoria, finalidade, destinatário e revogação.
7. Registro de auditoria **no servidor** (o log em LocalStorage é descartável e modificável).
8. Tratamento de incidentes, exportação/acesso do titular e fluxos de exclusão conforme legislação e guarda documental.
9. Avaliação LGPD com assessoria jurídica, política de privacidade e regras profissionais de Psicologia.
10. Avaliação da adequação técnica, científica e regulatória de cada instrumento. DISC/ACER **não está aqui demonstrado como teste psicológico validado**.

## Diferenciação profissional

- O perfil `psicologo`/`consultor` da demonstração é uma preferência de interface. Não verifica CRP, formação ou habilitação.
- Em produção, funcionalidades privativas da Psicologia não devem ser habilitadas a consultores não psicólogos; instrumentos devem ser avaliados individualmente.
- Coaching, psicoterapia, avaliação psicológica e mentoria não são sinônimos.
