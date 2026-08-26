# Funcionalidades do Receitando

Este documento registra o que existe atualmente no sistema do ponto de vista do usuário e relaciona cada área à implementação de produção.

## 1. Catálogo de receitas

O usuário pode navegar pelo catálogo e abrir detalhes de cada receita.

Cada receita pode apresentar:

- título e descrição;
- ingredientes e quantidades;
- modo de preparo;
- categoria/tipo de refeição;
- dificuldade;
- imagem;
- tags;
- origem do conteúdo;
- autoria e licença da receita quando aplicáveis;
- autoria, fonte, página e licença específicas da imagem quando disponíveis.

O catálogo operacional é alimentado pelo fluxo **Wikilivros + Wikimedia Commons**.

## 2. Busca e matching por ingredientes

O usuário informa de 1 a 40 ingredientes. A API normaliza os nomes, resolve aliases conhecidos e procura receitas candidatas.

O resultado informa:

- percentual de compatibilidade;
- status (`READY`, `ALMOST_READY`, `NEAR` ou `EXPLORE`);
- ingredientes obrigatórios encontrados;
- ingredientes faltantes;
- ingredientes opcionais;
- acesso ao detalhe da receita.

## 3. Despensa

Usuários autenticados possuem uma despensa persistente no D1.

É possível:

- listar itens;
- adicionar ingredientes;
- atualizar quantidade/unidade adicionando novamente o mesmo ingrediente;
- remover itens;
- utilizar a despensa diretamente no matching.

Toda leitura/escrita da despensa é vinculada ao `user_id` da sessão autenticada.

## 4. Autenticação e sessão

O sistema possui:

- cadastro;
- login;
- logout;
- consulta da sessão atual;
- sessão persistente;
- rate limiting para reduzir força bruta e criação automatizada de contas.

Senhas são derivadas com PBKDF2 e o D1 guarda somente o hash do token de sessão.

## 5. Perfil

Usuários autenticados podem consultar e editar:

- nome;
- identificador `@` único;
- avatar predefinido.

A API protege handles reservados e impede duplicidade.

## 6. Recuperação de senha

O fluxo utiliza um código de seis dígitos enviado por e-mail via Resend.

Proteções implementadas:

- resposta genérica ao solicitar recuperação, sem revelar se o e-mail está cadastrado;
- cooldown de reenvio;
- código com validade limitada;
- limite de tentativas;
- código armazenado de forma derivada;
- token temporário de reset armazenado apenas como hash;
- invalidação das sessões existentes depois da troca de senha.

## 7. Favoritos

Usuários autenticados podem:

- listar favoritos;
- salvar uma receita;
- remover uma receita.

A relação é persistida por usuário e receita no D1.

## 8. Avaliações

Usuários autenticados podem registrar `LIKE` ou `DISLIKE` e remover o próprio voto. A API também disponibiliza o resumo social da receita.

## 9. Comentários

É possível listar comentários publicamente. Usuários autenticados podem criar comentários e editar/excluir apenas os próprios registros.

## 10. Feed da home

`GET /api/home-feed` consolida:

- receitas populares;
- comentários recentes;
- totais da comunidade/catálogo.

## 11. Estados de interface

O frontend possui tratamento para:

- carregamento;
- erro;
- conteúdo vazio;
- página 404 personalizada;
- feedback de ações autenticadas.

## 12. Importação de receitas

A importação é uma tarefa operacional separada da navegação do usuário.

O fluxo atual:

1. consulta o Wikilivros;
2. descobre páginas candidatas;
3. interpreta ingredientes e preparo;
4. procura imagem no Wikimedia Commons;
5. valida relevância e licença;
6. registra procedência da receita e da imagem;
7. grava em lotes no D1.

O único script operacional mantido na árvore atual é `backend/worker-prototype/scripts/import-wikibooks-v2.mjs`.

## 13. Proveniência e licenças

A API pública retorna um objeto `source` para a procedência da receita e um objeto `image` para os créditos específicos da imagem.

O detalhe da receita apresenta essas informações ao usuário quando disponíveis, incluindo links para a fonte original e para a licença. Dessa forma, os metadados de atribuição não ficam apenas armazenados no D1.

Mais detalhes em [`catalogo.md`](catalogo.md).

## 14. API

As funcionalidades são agrupadas em:

- healthcheck;
- autenticação e perfil;
- recuperação de senha;
- fontes;
- ingredientes;
- receitas e matching;
- despensa;
- favoritos;
- votos;
- comentários;
- feed da home.

A lista completa de métodos, rotas e contratos está em [`api.md`](api.md).

## 15. Persistência

A produção usa Cloudflare D1 para usuários, sessões, catálogo, aliases, despensa, favoritos, recuperação de senha, interação social, procedência e rate limiting.

Detalhes em [`database.md`](database.md).

## 16. Qualidade

O frontend possui testes automatizados com Vitest/Testing Library cobrindo serviços, armazenamento de autenticação, utilitários e componentes compartilhados.

A API possui testes de regras puras e testes de rota com D1 simulado para fluxos críticos, incluindo autenticação, autorização, despensa, perfil, catálogo, matching, favoritos, comunidade, recuperação de senha, atribuição de imagem e delegação entre Workers.

CI também executa lint/typecheck/build/dry-run conforme o componente.

## 17. Relação com o escopo

Este documento descreve **o que existe na implementação**. O documento [`escopo.md`](escopo.md) define objetivos, requisitos e critérios acadêmicos usados como referência para o projeto.
