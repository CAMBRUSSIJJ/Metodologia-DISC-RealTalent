# RealTalent V11.4 — Apresentador Profissional 2.0

## Escopo entregue
Mantém a Biblioteca como origem do material; não reintroduz editor de slides.
O apresentador agora permite:

- PDFs: renderização de cada página com PDF.js, controle real de número/total,
  miniaturas com carregamento sob demanda e cliques para qualquer página.
- Imagens e acervo editorial: ajuste proporcional à tela, à largura e zoom.
- Marcações: caneta e marca-texto em coordenadas normalizadas da página. Ao avançar,
  voltar, alterar zoom ou redimensionar janela, a marcação permanece alinhada
  à página durante **a mesma sessão de apresentação**.
- Desfazer, refazer, apagar marcas da página e exportar as marcações em
  **JSON separado** (não modifica o arquivo original; exportação não inclui notas).
- Modo foco, teclado, tela cheia e panel de páginas recolhível, compatível com
  mouse e toque.

## Instalação PDF.js
A versão é **4.10.38** (Apache-2.0, Mozilla); os dois módulos precisam ter
a mesma versão. No Linux, execute `abrir-linux.sh`; ele confere o manifesto
SHA256 dos arquivos versionados e tenta baixar os módulos pinados por HTTPS
para `vendor/pdfjs` antes de iniciar o servidor. O diretório gerado não faz
parte do manifesto versionado. Após instalar, PDF.js pode funcionar sem rede.

Na prévia web (ou se a instalação local falhar), o apresentador tenta buscar
o par de módulos no CDN público da versão pinada. Nenhum PDF é enviado à CDN
pelo aplicativo; o download de JavaScript externo ainda implica uma dependência
de disponibilidade e integridade da distribuição. Para uma release profissional,
a dependência deverá vir **empacotada no build** e validada com hashes fixos.

Se ambas as alternativas estiverem indisponíveis, o programa ativa o leitor
nativo do navegador como **modo básico**, sem afirmar paginação ou anotações
por página. O arquivo continua legível quando o navegador oferece PDF nativo.

Referências: Mozilla PDF.js, `https://github.com/mozilla/pdf.js`,
`https://mozilla.github.io/pdf.js/`.
Licença da biblioteca: Apache 2.0.

## Experiência de apresentação
1. Professional → Biblioteca → Meus arquivos → importe material fictício.
2. Clique ▶ Apresentar; o documento aparece numa janela dedicada.
3. Use Páginas → miniaturas para ir a qualquer página ou use ←/→.
4. Ajustar / Largura / + / − controlam a área de leitura. Altura e posição
   das marcas seguem o conteúdo, inclusive após ampliação.
5. Selecione Caneta ou Marca-texto e desenhe sobre a página.
   Desfazer e Refazer funcionam na página selecionada.
6. Volte à página marcada; a tinta é recomposta automaticamente.
7. Clique Exportar marcas para salvar **JSON** separado, sem modificar PDF.
8. Esc sai do foco; o botão flutuante Mostrar controles também está disponível.

## Limites / segurança
- Somente demonstração com arquivos fictícios; arquivos em IndexedDB.
- Não carregar informações clínicas, identificáveis ou confidenciais.
- Anotações permanecem somente na memória até exportar o JSON; nenhuma
  sincronização ou persistência de marcações por conta.
- Notas da lateral aparecem na mesma tela projetada, **não são privadas**.
- Não existem ainda importação PPTX, sincronização com Minha Jornada, tela de
  apresentador separada, autenticação para arquivos nem busca por conteúdo PDF.
- A beta Supabase V11.2 continua isolada e não homologada para dados reais.
- PDFs complexos (XFA, fontes especiais, camadas avançadas) precisam de
  testes adicionais de fidelidade, desempenho e acessibilidade.

## Testes
```bash
python3 scripts/verify-build.py
python3 scripts/ensure-pdfjs-v114.py
node qa/testar-apresentador-v114.mjs
python3 qa/testar-apresentador-v114.py  # Playwright e Chromium instalados
```
O E2E gera PDF fictício de 3 páginas, importa-o pela Biblioteca e valida
contagem, miniaturas, navegação, zoom, tinta por página, desfazer/refazer
e exportação. Testes herdados da V11.3 continuam na suíte.

## Critérios antes de Production
- CI e Playwright aprovados no Chromium e testes manuais Firefox, inclusive
  1280×720, telas móveis, teclado e PDF de 100+ páginas.
- Verificar memória/cancelamento ao avançar rapidamente e renderização de
  PDFs de alta resolução.
- Garantir integração com autenticação/Storage de acesso privado, RLS e
  retenção de arquivos, sem reutilizar IndexedDB demonstrativo para dados reais.
