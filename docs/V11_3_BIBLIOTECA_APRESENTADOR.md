# RealTalent V11.3 — Biblioteca → Apresentar

## Objetivo
A Biblioteca é a origem dos materiais. A aba **Apresentações** não é mais um editor:
ela mostra favoritos e documentos apresentados recentemente, com acesso direto ao
visualizador. O Estúdio V11.0/V11.1 continua no repositório somente para compatibilidade
com roteiros demonstrativos anteriores; não é a experiência principal.

## Fluxos
1. No Professional, acesse **Biblioteca → Meus arquivos** e importe PDF/JPEG/PNG/WebP.
2. Na ficha do arquivo, selecione **▶ Apresentar**. Abre-se uma janela dedicada,
   sem a sidebar do RealTalent, exibindo o arquivo original.
3. Use navegação de páginas, zoom, tela cheia, modo foco, cronômetro, ponteiro
   laser, caneta, marca-texto, borracha e limpar anotações temporárias.
4. Pode-se abrir o painel de notas temporárias ou atalhos para ferramentas
   do Professional. As notas aparecem no painel na mesma tela, portanto
   **não** são privadas para quem assiste a uma projeção dessa tela.
5. Os itens favoritos e recentemente apresentados ficam na aba **Apresentações**.
6. Em um artigo do acervo editorial DISC/ACER, use **▶ Apresentar** para abrir
   páginas de leitura derivadas do próprio registro; isso não cria nem duplica slides.
7. No contexto de uma sessão, **Escolher arquivo na Biblioteca** leva a
   Meus arquivos com o parâmetro de sessão. O apresentador informa esse
   contexto, mas **não** vincula, publica ou distribui o arquivo automaticamente.

## Formatos e limitações
- PDF: usa o visualizador nativo do Firefox/Chromium, preservando páginas e
  diagramação. Navegação externa usa fragmento `#page=N`, que depende do
  visualizador do navegador; o total de páginas do PDF não é inferido. Pode-se
  usar a barra nativa do visualizador para navegação precisa.
- JPEG, PNG, WebP: visualização responsiva; único item/página.
- Conteúdo editorial: páginas geradas de título, texto, seções e pontos, com
  fonte em `biblioteca/data/indice_pesquisa.json`.
- PPTX, DOCX, vídeo, notas incorporadas e sincronização na nuvem: ainda
  não suportados; exporte apresentações PowerPoint para PDF.
- Limites: 25 MB por arquivo, até 60 arquivos; arquivos IndexedDB e metadados
  localStorage no **mesmo navegador e mesma origem**.
- Anotações gráficas e notas do apresentador são temporárias e não alteram PDF
  ou imagem; marcas gráficas são limpas ao trocar de página.
- Não há persistência multiusuário, autenticação nem compartilhamento seguro
  para esses arquivos. **Somente demonstração com materiais fictícios**.
- A beta autenticada V11.2 em `/seguro/` continua isolada/desativada sem
  Supabase dedicado; nenhum dado foi migrado para ela.
- Os vínculos de slides educacionais antigos permanecem legados e não são
  convertidos automaticamente para arquivo.

## QA
```bash
node qa/testar-apresentador-v113.mjs
python3 scripts/verify-build.py
```
Teste manual no Firefox e Chromium:
- Importar PDF de teste, imagem e arquivo acima do limite; verificar mensagens.
- Apresentar conteúdo a partir de Meus arquivos e registro editorial.
- Navegar páginas, testar tecla Esc e modo foco, zoom, anotar e limpar.
- Recarregar a Biblioteca no mesmo navegador; confirmar que o arquivo reabre.
- Excluir material e confirmar que o visualizador recusa acesso ao identificador.
- Abrir a aba Apresentações; conferir recentes e favoritos.
- Executar em 1280×720 e em viewport móvel sem overflow horizontal de navegação.
- Confirmar que a Production V9.13 e o módulo /seguro/ não foram alterados.
