# Funcionalidades do Receitando

Este documento resume o que já existe no sistema do ponto de vista do usuário e como cada área se relaciona com a arquitetura.

## 1. Catálogo de receitas

O usuário pode navegar por receitas disponíveis e abrir uma página de detalhes.

Cada receita pode possuir:

- título;
- descrição;
- ingredientes;
- modo de preparo;
- categoria;
- dificuldade;
- imagem;
- origem externa;
- metadados de fonte e licença.

O catálogo atual é alimentado principalmente pelo fluxo Wikilivros + Wikimedia Commons.

## 2. Busca por ingredientes

O sistema permite informar ingredientes para encontrar receitas compatíveis.

O backend normaliza nomes e utiliza aliases quando necessário para aproximar variações conhecidas.

O resultado pode informar:

- percentual de compatibilidade;
- ingredientes encontrados;
- ingredientes faltantes;
- receitas ordenadas por aderência.

## 3. Despensa

Usuários autenticados podem manter uma despensa persistente.

Itens podem possuir quantidade e unidade opcionais.

A despensa pode ser usada diretamente como entrada do matching, evitando que a pessoa precise informar os mesmos ingredientes novamente.

## 4. Autenticação e sessão

O sistema possui:

- cadastro;
- login;
- logout;
- consulta da sessão atual;
- sessão persistente por token.

A API armazena apenas representação derivada/hash do token de sessão no banco.

## 5. Perfil

Usuários autenticados podem manter informações de perfil como:

- nome;
- identificador `@`;
- avatar.

## 6. Recuperação de senha

O fluxo de recuperação utiliza código temporário enviado por e-mail.

A integração de envio usa Resend.

Códigos e tokens sensíveis são tratados de forma derivada/hash no backend.

## 7. Favoritos

Usuários autenticados podem salvar e remover receitas favoritas.

Os favoritos são persistidos no D1 e ficam associados ao usuário.

## 8. Avaliações

Receitas podem receber avaliação simples de gostei/não gostei.

A API mantém o voto associado ao usuário e à receita.

## 9. Comentários

Usuários podem comentar em receitas.

Os comentários alimentam a área social e podem aparecer em contextos de feed.

## 10. Feed da home

A página inicial pode exibir dados derivados da atividade da comunidade e do catálogo.

O backend possui uma camada própria para montar esse feed.

## 11. Estados de interface

O frontend possui tratamento para:

- carregamento;
- erro;
- ausência de conteúdo;
- página 404 personalizada.

## 12. Importação de receitas

A importação é independente da navegação do usuário.

Ela ocorre por GitHub Actions e grava o catálogo no D1.

O fluxo atual:

1. consulta o Wikilivros;
2. identifica páginas de receitas;
3. interpreta ingredientes e preparo;
4. procura imagem livre;
5. valida metadados;
6. grava no D1;
7. disponibiliza o conteúdo pela API.

## 13. Proveniência e licenças

O banco possui campos para registrar origem de receitas e imagens.

Isso permite manter informações como:

- fonte;
- URL original;
- autor;
- licença;
- URL da licença;
- idioma;
- data de importação.

## 14. API

As funcionalidades acima são expostas por rotas agrupadas em áreas:

- autenticação;
- perfil;
- recuperação de senha;
- ingredientes;
- receitas;
- matching;
- despensa;
- favoritos;
- votos;
- comentários;
- feed.

A lista detalhada está em [`api.md`](api.md).

## 15. Persistência

A produção usa Cloudflare D1.

Principais entidades:

- usuários;
- sessões;
- ingredientes;
- aliases de ingredientes;
- receitas;
- ingredientes das receitas;
- tags;
- despensa;
- favoritos;
- perfis;
- recuperação de senha;
- votos;
- comentários.

Detalhes em [`database.md`](database.md).

## 16. Relação com o escopo

Este documento descreve o que existe na implementação atual.

A definição formal do projeto, seus objetivos, requisitos e critérios de conclusão está em [`escopo.md`](escopo.md).
