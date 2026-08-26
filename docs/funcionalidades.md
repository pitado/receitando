# Funcionalidades do Receitando

Este documento registra o que existe atualmente no sistema do ponto de vista do usuário e relaciona cada área à implementação de produção.

## 1. Catálogo de receitas

O usuário pode navegar pelo catálogo e abrir detalhes de cada receita.

Cada receita pode apresentar título, descrição, ingredientes/quantidades, modo de preparo, categoria, dificuldade, imagem, tags e informações de procedência/licença.

O catálogo operacional é alimentado pelo fluxo **Wikilivros + Wikimedia Commons**.

## 2. Busca textual

A listagem de receitas permite pesquisa textual por `q`.

A API utiliza SQLite **FTS5** sobre título e descrição, com busca por termos/prefixos e ordenação por relevância. A busca principal não depende mais de `LIKE '%termo%'` em toda a tabela de receitas.

## 3. Matching por ingredientes

O usuário informa de 1 a 40 ingredientes. A API:

1. normaliza o texto;
2. gera a forma completa e uma forma canônica conservadora;
3. resolve nomes e aliases exatos para `ingredient_id`;
4. busca receitas candidatas;
5. ignora opcionais e ingredientes básicos no denominador;
6. calcula compatibilidade.

Variações comuns podem apontar para o mesmo ingrediente:

```text
cebola / cebolas / cebolas picadas → cebola
```

A regra evita inferência por substring. Portanto, compostos semanticamente distintos continuam separados, como `óleo` e `óleo de gergelim torrado`.

O resultado informa:

- percentual de compatibilidade;
- status (`READY`, `ALMOST_READY`, `NEAR` ou `EXPLORE`);
- ingredientes obrigatórios encontrados;
- ingredientes faltantes;
- ingredientes opcionais;
- ingredientes básicos (`stapleIngredients`);
- acesso ao detalhe da receita.

### Ingredientes básicos

Ingredientes marcados `is_staple = true` — como água, sal, pimenta e óleo genérico na política atual — continuam fazendo parte da receita, mas não reduzem a compatibilidade nem entram na lista principal de faltantes.

### Quantidades

O matching atual é booleano (`tem` / `não tem`). Quantidade e unidade são armazenadas e exibidas, porém ainda não alteram a porcentagem de compatibilidade.

## 4. Despensa

Usuários autenticados possuem uma despensa persistente no D1.

É possível listar, adicionar, atualizar quantidade/unidade, remover itens e usar a despensa diretamente no matching. Toda operação é vinculada ao `user_id` autenticado.

## 5. Autenticação e sessão

O sistema possui cadastro, login, logout, consulta da sessão atual e sessão persistente.

Senhas são derivadas com PBKDF2 e o D1 guarda somente o hash do token de sessão.

## 6. Rate limiting

O entrypoint da API reduz abuso em:

- login por e-mail;
- login por IP;
- cadastro por IP;
- solicitação de recuperação por e-mail;
- solicitação de recuperação por IP.

Os identificadores dos buckets são persistidos apenas como SHA-256. Limites atingidos retornam `429` com `Retry-After`.

## 7. Perfil

Usuários autenticados podem consultar e editar nome, identificador `@` único e avatar predefinido. Handles reservados e duplicados são rejeitados.

## 8. Recuperação de senha

O fluxo utiliza código de seis dígitos enviado via Resend.

Proteções implementadas:

- resposta genérica para não enumerar contas;
- rate limiting antes do fluxo de envio;
- cooldown de reenvio;
- validade limitada;
- limite de tentativas;
- código armazenado de forma derivada;
- token temporário armazenado apenas como hash;
- invalidação de sessões depois da troca de senha.

## 9. Favoritos, avaliações e comentários

Usuários autenticados podem salvar/remover favoritos e registrar/remover `LIKE` ou `DISLIKE`.

Comentários podem ser listados publicamente. Criação exige autenticação e edição/exclusão validam o dono do registro.

## 10. Feed da home

`GET /api/home-feed` consolida receitas populares, comentários recentes e totais usados pela página inicial.

## 11. Estados de interface

O frontend possui tratamento de carregamento, erro, conteúdo vazio, página 404 e feedback de ações autenticadas.

A tela `/combinar` também explica que a versão atual usa presença/ausência e não quantidade, e que ingredientes básicos não penalizam a compatibilidade.

## 12. Importação e canonicalização

A operação de catálogo é separada da navegação do usuário.

O fluxo atual:

1. consulta o Wikilivros;
2. descobre páginas candidatas;
3. interpreta ingredientes/preparo como texto;
4. procura imagem no Wikimedia Commons;
5. valida relevância/licença;
6. registra procedência;
7. grava receitas em lotes;
8. canonicaliza variações de ingredientes;
9. preserva aliases;
10. marca staples e otimiza o banco.

Scripts ativos:

```text
backend/worker-prototype/scripts/import-wikibooks-v2.mjs
backend/worker-prototype/scripts/canonicalize-ingredients.mjs
```

## 13. Tratamento de conteúdo externo

O conteúdo culinário aproveitado do Wikilivros é convertido para texto pelo importador. A tela de receita renderiza strings React e não HTML bruto da fonte externa.

Metadados da receita e da imagem são preservados separadamente para atribuição.

## 14. API e persistência

A API é organizada em autenticação/perfil, recuperação, fontes, ingredientes, receitas/matching, despensa, favoritos, votos, comentários e home.

A produção usa Cloudflare D1 para usuários, sessões, catálogo canônico, aliases, FTS5, despensa, favoritos, recuperação, comunidade, procedência e rate limiting.

Detalhes:

- [`api.md`](api.md)
- [`database.md`](database.md)

## 15. Qualidade

O frontend possui testes com Vitest/Testing Library.

A API possui testes de regras puras e testes de rota com D1 simulado, incluindo canonicalização, staples, FTS5, autenticação, autorização, rate limiting, catálogo, matching, recuperação e interação social.

CI também executa lint/typecheck/build/dry-run conforme o componente.

## 16. Relação com o escopo

Este documento descreve **o que existe na implementação**. [`escopo.md`](escopo.md) define objetivos, requisitos e critérios acadêmicos usados como referência para o projeto.
