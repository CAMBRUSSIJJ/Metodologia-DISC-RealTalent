# RealTalent V11.1 — Apresentações vinculadas a sessões (demonstração)

## Fluxo integrado
1. Em **Sessões**, abrir um atendimento fictício; a seção **Apresentações do atendimento** tem um atalho para o Estúdio com a sessão pré-selecionada.
2. Escolher ou criar um roteiro no Estúdio. **Vincular apresentação** registra `deckId`, `sessionId` e `programId` no mesmo armazenamento demonstrativo, privado por padrão.
3. Na seção **Material para Minha Jornada**, selecionar **de 1 a 12 slides** de texto, capa, perguntas ou conteúdo editorial da Biblioteca. Confirmar publicação. Para liberar, a sessão também precisa estar explicitamente compartilhada.
4. A versão publicada é uma **cópia textual sanitizada**: título, subtítulo, texto, tema e tipo. **Não** contém notas privadas, arquivos PDF, imagens, URLs blob, dados de editor ou ferramentas dinâmicas.
5. Participante fictício vê exclusivamente os slides publicados em **Minha Jornada → Meus materiais**, associados ao próprio processo. Outro cliente não recebe o conteúdo.
6. O profissional pode **retirar da Minha Jornada** ou **desvincular**, revogando a exibição. Se editar a apresentação, é necessária nova publicação consciente.
7. Durante a apresentação, o botão **+ Compromisso** retorna ao editor e direciona ao registro de uma ação. O compromisso usa **`createSessionAgreement`** existente, com objetivo, sessão, prazo e visibilidade privada por padrão. Não gera um novo plano paralelo.

## Registros e compatibilidade
- `core/demo-store.js` preserva o schema V11 demonstrativo e adiciona a coleção opcional `presentationLinks` com migração de versões anteriores.
- A coleção suporta associação idempotente, publicação seletiva com normalização, revogação e desvinculação.
- `RTDemoStore.clientView` é o ponto de filtragem da visão do participante; não compartilha dados do autor, notas ou referências a arquivos.
- A página profissional mostra a associação em atendimento focado sem alterar as rotas e os workflows anteriores.
- A apresentação original e os arquivos continuam locais ao navegador.

## Limites críticos
Esta é **uma demonstração de UX**, não a implantação da infraestrutura segura V10.
A mesma origem e localStorage/IndexedDB **não oferecem autenticação, autorização, segregação multiusuário real ou proteção clínica**. O controle de visibilidade no protótipo **não é uma garantia de confidencialidade**. Não inserir dados pessoais, médicos ou documentos reais.
Não foram ativados Supabase, RLS real, sincronização remota, envio de arquivos, PPTX ou distribuição de PDF/imagem.
A implementação com dados reais exigirá infraestrutura V10 em projeto dedicado, testes RLS com múltiplas contas, revisão LGPD e autorização no servidor.

## QA
```bash
node qa/testar-apresentacoes-sessoes-v111.js
python qa/testar-apresentacoes-sessoes-v111.py
node qa/testar-apresentacoes-v110.js
python qa/testar-apresentacoes-v110.py
python scripts/verify-build.py
```

Cobrir: privacidade por padrão; publicação exclusiva de texto selecionado; bloqueio de arquivos/notas; isolamento entre processos; revogação; vínculo e compromisso na sessão; persistência local; responsividade e regressões V9–V11.
