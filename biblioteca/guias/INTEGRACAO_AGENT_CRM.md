# Integração com RealTalent CRM e RealTalent Agent

## Fonte de conhecimento única

- Tratar `DISC` e `ACER` como **aliases de uma única metodologia** no campo `methodology_key = "DISC_ACER"`.
- Não transformar resultados da biblioteca em decisões automatizadas sobre pessoas.
- Usar `data/indice_pesquisa.json` como fonte de busca e resposta, com filtros por `group` e `kind`.
- No Agent, devolver recomendações como **hipóteses comportamentais**, acompanhadas de contexto e perguntas de confirmação.
- Registrar fonte e versão do conteúdo em cada recomendação.

## Exemplo de registro de conhecimento

```json
{"methodology_key":"DISC_ACER","type":"perfil","canonical_factor":"S","title":"Estabilidade","content_version":"1.0.0","visibility":"educational"}
```

## Esquema sugerido (não executado)

```sql
CREATE TABLE knowledge_articles (
 id text PRIMARY KEY,
 methodology_key text NOT NULL DEFAULT 'DISC_ACER',
 kind text NOT NULL,
 category text NOT NULL,
 title text NOT NULL,
 body jsonb NOT NULL,
 content_version text NOT NULL,
 published boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
```

Se integrado ao banco real, definir RLS, papéis e política editorial antes de publicar. Esta tabela é apenas um **esboço**, nenhuma migration foi aplicada.

## Roteamento de perguntas na IA

1. Detectar intenção: aprender, entender resultado, comunicação, vendas, liderança ou ética.
2. Recuperar capítulos/perfis relevantes, não inventar associações entre letras ACER e DISC.
3. Se depender de resultado individual, solicitar autorização e contexto; respeitar permissões de acesso.
4. Não inferir capacidade, aptidão, diagnóstico ou futuro de pessoa avaliada.
5. Usar exemplos concretos e sugerir perguntas que o interlocutor possa confirmar.

## Publicação web

`index.html` pode ser disponibilizado como página estática em `/biblioteca/disc-acer/`, **separada do código do aplicativo original**. Integrar navegação do CRM exigirá tarefa adicional no repositório que estiver implantado; este ZIP não altera produção nem preview.
