# Escopo do Projeto Receitando

## 1. Visão do projeto

O **Receitando** é uma aplicação web acadêmica criada para ajudar pessoas a descobrir o que podem cozinhar com os ingredientes que já possuem em casa.

A proposta central é reduzir a dificuldade de escolher uma receita a partir dos alimentos disponíveis. O usuário informa ingredientes manualmente ou mantém uma despensa vinculada à sua conta, e o sistema compara esses itens com o catálogo de receitas para apresentar opções compatíveis e indicar o que ainda falta para cada preparo.

## 2. Problema

É comum ter alimentos disponíveis em casa e, mesmo assim, não saber o que preparar. As receitas normalmente são pesquisadas pelo nome do prato, enquanto a necessidade real do usuário muitas vezes começa pelos ingredientes que ele já possui.

Esse cenário pode gerar:

- dificuldade para decidir refeições;
- pouco aproveitamento dos alimentos disponíveis;
- compras desnecessárias de ingredientes;
- desperdício de alimentos;
- tempo gasto procurando receitas que realmente possam ser preparadas.

## 3. Objetivo geral

Desenvolver uma aplicação web capaz de relacionar os ingredientes disponíveis do usuário com um catálogo de receitas e apresentar as opções mais compatíveis de forma simples, visual e organizada.

## 4. Objetivos específicos

- permitir que o usuário consulte receitas e seus detalhes;
- permitir a busca de receitas a partir de ingredientes informados;
- manter uma despensa pessoal para usuários cadastrados;
- calcular o nível de compatibilidade entre os ingredientes disponíveis e cada receita;
- indicar os ingredientes encontrados e os ingredientes que ainda faltam;
- permitir que receitas sejam salvas como favoritas;
- permitir avaliações e comentários em receitas;
- manter um catálogo com imagens e informações de origem das receitas;
- disponibilizar a aplicação na web por meio de infraestrutura em nuvem.

## 5. Público-alvo

O sistema é direcionado principalmente a pessoas que cozinham em casa e desejam aproveitar melhor os ingredientes disponíveis, incluindo estudantes, pessoas que moram sozinhas, famílias e usuários que buscam praticidade na escolha de refeições.

## 6. Escopo funcional

### 6.1 Catálogo de receitas

O sistema deve disponibilizar um catálogo navegável de receitas contendo, quando disponível:

- nome da receita;
- imagem;
- descrição;
- ingredientes;
- modo de preparo;
- categoria;
- origem do conteúdo;
- informações de licença da receita e da imagem quando aplicável.

### 6.2 Busca por ingredientes

O usuário deve poder informar ingredientes e solicitar ao sistema receitas compatíveis.

Para cada resultado, o sistema deve apresentar:

- percentual de compatibilidade;
- ingredientes disponíveis;
- ingredientes faltantes;
- acesso aos detalhes da receita.

A compatibilidade é calculada considerando os ingredientes obrigatórios da receita.

### 6.3 Despensa

Usuários autenticados devem poder manter uma lista persistente de ingredientes disponíveis em sua despensa.

A despensa deve permitir:

- adicionar ingredientes;
- remover ingredientes;
- informar quantidade e unidade quando desejado;
- utilizar diretamente os itens cadastrados para buscar receitas compatíveis.

### 6.4 Conta e autenticação

O sistema deve permitir:

- criação de conta;
- login e logout;
- manutenção de sessão;
- edição de informações básicas do perfil;
- recuperação de senha.

### 6.5 Favoritos e interação

Usuários autenticados devem poder:

- salvar e remover receitas dos favoritos;
- avaliar receitas;
- publicar comentários nas receitas.

### 6.6 Página inicial

A página inicial deve apresentar conteúdo do catálogo e informações da atividade da comunidade de forma visual e responsiva, facilitando o acesso às principais áreas da aplicação.

## 7. Catálogo e fontes de conteúdo

O catálogo deve utilizar conteúdo cuja licença ou autorização permita o uso no projeto.

A estratégia atual utiliza:

- **Wikilivros em português** como fonte de receitas;
- **Wikimedia Commons** como fonte de imagens livres associadas às receitas.

O processo de importação registra informações de procedência e licença quando disponíveis. O catálogo é mantido separado da lógica principal da aplicação para que a origem dos dados possa ser auditada e atualizada sem alterar o funcionamento do sistema.

## 8. Fluxo principal do usuário

```text
Usuário acessa o Receitando
        ↓
Informa ingredientes ou utiliza sua despensa
        ↓
Sistema normaliza e identifica os ingredientes
        ↓
Sistema compara os ingredientes com as receitas
        ↓
Receitas são ordenadas por compatibilidade
        ↓
Usuário visualiza o que possui e o que ainda falta
        ↓
Usuário abre a receita e consulta o preparo
```

## 9. Requisitos funcionais

| Código | Requisito |
| --- | --- |
| RF01 | O sistema deve permitir visualizar o catálogo de receitas. |
| RF02 | O sistema deve permitir consultar os detalhes de uma receita. |
| RF03 | O sistema deve permitir informar ingredientes para buscar receitas compatíveis. |
| RF04 | O sistema deve calcular a compatibilidade entre os ingredientes informados e cada receita. |
| RF05 | O sistema deve indicar ingredientes disponíveis e faltantes. |
| RF06 | O sistema deve permitir cadastro, login e logout de usuários. |
| RF07 | O sistema deve permitir recuperação de senha. |
| RF08 | O sistema deve permitir manter uma despensa por usuário. |
| RF09 | O sistema deve permitir utilizar a despensa na busca de receitas. |
| RF10 | O sistema deve permitir salvar receitas favoritas. |
| RF11 | O sistema deve permitir avaliar receitas. |
| RF12 | O sistema deve permitir publicar comentários em receitas. |
| RF13 | O sistema deve armazenar a origem das receitas importadas. |
| RF14 | O sistema deve exibir imagens de receitas quando houver uma imagem livre válida associada. |

## 10. Requisitos não funcionais

| Código | Requisito |
| --- | --- |
| RNF01 | A aplicação deve funcionar em navegadores modernos. |
| RNF02 | A interface deve ser responsiva para desktop e dispositivos móveis. |
| RNF03 | O frontend não deve acessar o banco de dados diretamente. |
| RNF04 | Dados persistentes devem ser acessados por meio da API. |
| RNF05 | Senhas e tokens não devem ser armazenados em texto puro no banco. |
| RNF06 | Credenciais e chaves privadas não devem ser versionadas no repositório. |
| RNF07 | Conteúdo externo publicado deve possuir origem identificável e licença compatível com o uso. |
| RNF08 | A aplicação deve disponibilizar estados de carregamento e erro para as operações principais. |

## 11. Entregas do projeto

As principais entregas previstas são:

1. aplicação web responsiva;
2. catálogo de receitas com imagens;
3. mecanismo de busca e compatibilidade por ingredientes;
4. despensa vinculada ao usuário;
5. autenticação e recuperação de senha;
6. favoritos, avaliações e comentários;
7. API para comunicação entre frontend e dados;
8. banco de dados persistente;
9. processo de importação de receitas de fontes abertas;
10. publicação do frontend e da API em ambiente de produção;
11. documentação de escopo, arquitetura, API e banco de dados.

## 12. Critérios de conclusão

O projeto atende ao seu objetivo quando um usuário consegue realizar o seguinte fluxo completo:

1. acessar a aplicação;
2. visualizar receitas reais no catálogo;
3. informar ingredientes ou utilizar sua despensa;
4. receber receitas ordenadas por compatibilidade;
5. identificar quais ingredientes possui e quais ainda faltam;
6. abrir uma receita e consultar ingredientes e modo de preparo;
7. criar uma conta e manter seus dados persistentes;
8. salvar uma receita favorita e interagir com o conteúdo.

## 13. Tecnologias adotadas

A implementação atual utiliza:

- **Next.js, React e TypeScript** no frontend;
- **Cloudflare Workers** para frontend e API em produção;
- **Cloudflare D1** para persistência;
- **GitHub Actions** para integração, deploy e tarefas de importação;
- **Resend** para envio de códigos de recuperação de senha;
- APIs do **MediaWiki/Wikimedia** para obtenção de receitas e imagens livres.

Os detalhes técnicos ficam documentados separadamente em [`architecture.md`](architecture.md), [`api.md`](api.md) e [`database.md`](database.md).

## 14. Situação atual

O Receitando encontra-se em desenvolvimento acadêmico contínuo. As funções principais de catálogo, matching por ingredientes, autenticação, despensa, favoritos e interação social já possuem implementação, enquanto o catálogo de receitas e a experiência de uso continuam sendo refinados.

Este documento define o escopo funcional e acadêmico utilizado como referência para desenvolvimento, validação e apresentação do projeto.
