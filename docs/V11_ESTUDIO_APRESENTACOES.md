# RealTalent V11.0 — Estúdio de Apresentações (Preview demonstrativa)

## Objetivo
Transformar conteúdo didático, exercícios e documentos exemplificativos em apresentações
interativas utilizadas pelo profissional em sessões e workshops. O editor não substitui
a Biblioteca, mas reutiliza sua base editorial de 135 conteúdos.

## Implementado e verificável
- Aba **Apresentações** integrada ao menu profissional (`#apresentacoes`), com opção de abrir em nova janela.
- Catálogo local de apresentações; criar, renomear, abrir, duplicar e excluir com confirmação.
- Dois roteiros-modelo editáveis: Sessão de desenvolvimento e Workshop de comunicação.
- Editor 16:9 com miniaturas, sequência, mover acima/abaixo, duplicar/excluir slide.
- Tipos de slide: **Capa, Texto, Pergunta interativa, Ferramenta, Biblioteca, Documento**.
- Editor de títulos, subtítulos, textos, temas e **notas privadas do apresentador**.
- Modo apresentação em tela cheia (com fallback), temporizador, navegação por botões,
  setas, Home/End e Esc, barra de progresso. Notas internas nunca aparecem na projeção.
- Biblioteca existente: pesquisa no acervo original e importação do conteúdo editorial
  como snapshot editável do slide, sem duplicar o banco da Biblioteca.
- Ferramentas interativas locais: Roda de reflexão com oito controles e matriz 5W2H;
  respostas de demonstração são **efêmeras**, não geram diagnóstico, nota ou pontuação.
- PDF e imagens JPEG/PNG/WebP até 16 MB armazenados localmente em IndexedDB e
  reabertos após recarregar. PDF usa visualizador nativo do navegador.
- Apresentações em localStorage (metadados e textos); imagens/PDF em IndexedDB.

## Como usar
Abra **RealTalent Professional → Apresentações** ou `/apresentacoes/`.
Escolha um roteiro ou crie apresentação vazia. Selecione slides à esquerda,
edite propriedades à direita e pressione **Apresentar**. Para uso em tela
externa, abrir o Estúdio em uma janela dedicada. Para inserir conteúdo do acervo,
adicione um slide Biblioteca e pesquise um dos registros existentes.

## Delimitações
- Somente demonstração com dados inventados. Não utilizar arquivos de clientes,
  documentos confidenciais, informações de saúde nem prontuários: **o armazenamento
  local não oferece autorização ou criptografia adequada**.
- Upload de arquivos funciona **no Estúdio**, não é ainda o gerenciador de
  documentos do backend seguro da V10. Arquivos não sincronizam com Minha Jornada.
- Slides não são compartilhados com participantes ou vinculados de forma persistente
  a sessões. Isso exige backend dedicado com RLS e revisão LGPD.
- Não suporta edição/importação de PPTX nem conversão de DOCX. Essa função é
  futura; a importação atual suporta apenas PDF e imagens.
- PDF pode usar a interface embutida do navegador, sujeita a diferenças
  entre Chrome/Firefox.
- Sem IA, análise de perfis ou avaliação psicológica automatizada.

## Testes
```bash
node --check apresentacoes/studio.js
node qa/testar-apresentacoes-v110.js
python qa/testar-apresentacoes-v110.py
python scripts/verify-build.py
```
Critérios de aceite: editor, biblioteca, Roda/5W2H, persistência de slides,
imagem recarregada, modo apresentação, notas privadas, menu profissional e
desktop/tablet/mobile sem transbordamento horizontal.
