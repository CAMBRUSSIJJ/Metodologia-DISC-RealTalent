# RealTalent V11.5 — Biblioteca Profissional

## Objetivo
Organizar materiais prontos na **Biblioteca** e iniciar sua apresentação a partir
do arquivo original. Não cria slides, não converte materiais em outra estrutura e
não duplica documentos ao associar metadados.

## Implementação
- Navegação por **Todos os arquivos**, **Sem pasta** e pastas do profissional;
  criar e renomear pastas; ao excluir pasta, seus arquivos são enviados à raiz.
- Categorias padrão e personalizadas, etiquetas separadas por vírgula, título
  editável, pasta escolhida no diálogo **Organizar**.
- Filtros por texto (título, filename, categoria, etiquetas), pasta,
  categoria, formato, etiqueta e favoritos; ordenação por nome, data,
  tamanho e última apresentação.
- **Salvar visão**, abrir visão salva ou excluí-la, sem alterar os documentos.
- Grade e lista com preferência armazenada no mesmo navegador.
- Importação de múltiplos arquivos, inclusive **arrastar e soltar**; mantém
  o limite de 25 MB/arquivo e 60 arquivos da V11.3.
- Miniaturas com carregamento conforme aparecem na tela: imagens originais
  e primeira página de PDFs renderizada com o PDF.js da V11.4.
- Modal **Prévia** para consultar o original e ação primária **▶ Apresentar**
  para abrir a tela dedicada da V11.4.
- Mensagens de erro, estados vazios e contraste em light/dark mode, com
  adaptação a 1280×720 e telas móveis.

## Compatibilidade V11.3/V11.4
Os arquivos permanecem no mesmo IndexedDB
`rt-presentation-library-files-v113` e os metadados no localStorage
`rt-presentation-library-v113`.
Metadados anteriores sem campos da V11.5 são interpretados automaticamente
como **Sem pasta**, **Sem categoria**, sem etiquetas. Isso não recria nem
sobrescreve os bytes dos documentos.

As pastas, categorias personalizadas, visões salvas e preferência grade/lista
são salvas em uma chave separada
`rt-presentation-library-v115-preferences`. A exclusão de uma pasta
atualiza as referências dos arquivos para a raiz antes de removê-la,
preservando os PDFs/imagens armazenados.

## Como utilizar
1. Abra Professional → **Biblioteca → Meus arquivos**.
2. Arraste arquivos fictícios para a área de importação ou clique
   **Importar materiais**.
3. Crie pastas pelo botão **Nova pasta** e atribua pasta/categoria/etiquetas
   em **Organizar** em cada cartão.
4. Filtre por pasta, texto, categoria, formato ou etiqueta; clique
   **Salvar visão** para retornar a esse conjunto posteriormente.
5. Selecione Grade/Lista, Prévia ou **▶ Apresentar**.
6. Na apresentação, miniaturas e anotações por página permanecem as da V11.4.

## Limites e próximos passos
- Somente demonstração local, **nunca usar dados reais de clientes**.
- Não há acesso multiusuário, controle por profissional, upload ao Supabase,
  sincronização entre dispositivos nem compartilhamento seguro nesta versão.
- A busca **não examina o conteúdo dentro do PDF**: indexa apenas nome,
  categoria e etiquetas.
- Miniaturas PDF exigem PDF.js da V11.4. O Linux tenta instalá-lo ao iniciar;
  caso não esteja disponível localmente, a demonstração usa CDN pinado
  e, se este também falhar, mostra a identificação do tipo de arquivo.
- Miniaturas e imagens da prévia utilizam URLs temporárias do navegador,
  liberadas quando a interface é atualizada ou a prévia encerrada.
- Persistência em IndexedDB depende das políticas e do espaço do navegador;
  limpar dados do site pode excluir os arquivos.
- DOCX e PPTX ainda precisam ser convertidos para PDF ou imagem.

## Testes
```bash
python3 scripts/verify-build.py
node qa/testar-biblioteca-v115.mjs
python3 qa/testar-biblioteca-v115.py  # Chromium Playwright necessário
node qa/testar-apresentador-v114.mjs
```
O teste estrutural percorre a migração, inclusão/renomeação/exclusão de
pastas, atribuição de metadados, visões salvas, grade/lista e preservação
de documento anterior. O E2E usa um PNG fictício e exercita a interface.

## Antes de Production
- Testes CI completos sem regressão nas versões V11.3 e V11.4.
- Revisão Firefox, Chromium, desktop 1280×720 e móvel.
- Testes de PDFs longos, desempenho e quota de IndexedDB.
- Backend seguro V11.2 com autenticação, RLS e storage privado,
  homologado independentemente antes de qualquer uso profissional real.
