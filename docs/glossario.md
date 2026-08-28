# Glossário de Termos — Receitando

Este glossário reúne os principais termos de **negócio, produto e tecnologia** utilizados no projeto acadêmico Receitando. As definições abaixo descrevem o significado dos termos **no contexto da aplicação**, facilitando a leitura do escopo, da documentação funcional e dos documentos técnicos.

> **Objetivo:** servir como referência rápida para professores, integrantes da equipe e futuros colaboradores, evitando ambiguidades entre conceitos culinários, funcionalidades do sistema e termos técnicos.

## 1. Termos de negócio e do produto

| Termo | Definição no contexto do Receitando |
| --- | --- |
| **Alias de ingrediente** | Variação textual associada a um ingrediente canônico. Por exemplo, `cebolas` e `cebolas picadas` podem ser aliases de `cebola`. |
| **Avaliação** | Interação do usuário com uma receita por meio de `LIKE` ou `DISLIKE`. |
| **Busca textual** | Pesquisa de receitas pelo conteúdo textual, principalmente título e descrição. A implementação atual utiliza FTS5. |
| **Canonicalização de ingredientes** | Processo que consolida diferentes formas de escrever um ingrediente em uma representação única e conservadora, sem unir itens que tenham significados culinários diferentes. |
| **Catálogo de receitas** | Conjunto de receitas disponíveis para consulta no Receitando, incluindo informações como título, ingredientes, preparo, imagem e procedência. |
| **Comentário** | Texto publicado por um usuário autenticado em uma receita para registrar uma opinião ou interação com a comunidade. |
| **Compatibilidade** | Percentual que representa quanto dos ingredientes obrigatórios de uma receita o usuário possui. Ingredientes opcionais e ingredientes básicos não entram no denominador do cálculo atual. |
| **Despensa** | Lista persistente de ingredientes vinculada à conta do usuário. Pode armazenar ingrediente, quantidade, unidade e validade quando informadas. |
| **Favorito** | Receita salva pelo usuário para facilitar seu acesso posteriormente. |
| **Ingrediente** | Item culinário utilizado no preparo de uma receita e representado no sistema por uma entidade própria. |
| **Ingrediente básico (staple)** | Ingrediente considerado trivial na política atual, como água, sal, pimenta ou óleo genérico. Continua aparecendo na receita, mas não reduz a compatibilidade quando estiver ausente. |
| **Ingrediente canônico** | Representação principal de um ingrediente no banco de dados, usada para relacionar aliases, receitas e itens da despensa ao mesmo identificador. |
| **Ingrediente faltante** | Ingrediente obrigatório de uma receita que não foi encontrado entre os ingredientes informados pelo usuário ou presentes em sua despensa. |
| **Ingrediente encontrado** | Ingrediente obrigatório de uma receita que foi identificado entre os ingredientes disponíveis do usuário. |
| **Ingrediente opcional** | Ingrediente que pode participar de uma receita, mas não é obrigatório e não influencia o percentual de compatibilidade atual. |
| **Matching** | Mecanismo que compara os ingredientes disponíveis do usuário com os ingredientes exigidos pelas receitas e ordena os resultados por compatibilidade. |
| **Modo de preparo** | Sequência de instruções necessárias para preparar uma receita. |
| **Normalização de ingrediente** | Tratamento textual aplicado antes da comparação, como padronização de caixa, acentos, separadores e algumas variações conhecidas. |
| **Procedência** | Informações que identificam a origem de uma receita ou imagem, como fonte, URL, autor e licença. |
| **Receita** | Entidade central do sistema. Contém dados culinários como título, descrição, ingredientes, instruções, porções, dificuldade, categoria e informações de origem. |
| **Status de matching** | Classificação apresentada junto ao resultado da compatibilidade, como `READY`, `ALMOST_READY`, `NEAR` ou `EXPLORE`. |
| **Usuário** | Pessoa que utiliza a aplicação. Usuários autenticados podem manter despensa, favoritos, perfil, avaliações e comentários. |

## 2. Termos de requisitos e documentação

| Termo | Definição no contexto do Receitando |
| --- | --- |
| **Escopo** | Delimitação do problema, objetivos, público-alvo, funcionalidades e entregas que fazem parte do projeto. |
| **Fluxo do usuário** | Sequência de ações realizada pelo usuário para atingir um objetivo dentro da aplicação, como informar ingredientes, receber receitas compatíveis e abrir o modo de preparo. |
| **Requisito funcional (RF)** | Comportamento ou funcionalidade que o sistema deve oferecer, como visualizar receitas, realizar login ou manter uma despensa. |
| **Requisito não funcional (RNF)** | Característica de qualidade ou restrição da solução, como responsividade, segurança, separação entre frontend e banco de dados e validações automatizadas. |
| **Critério de conclusão** | Condição usada para verificar se o projeto consegue cumprir o fluxo principal e os objetivos acadêmicos definidos no escopo. |

## 3. Termos de arquitetura e desenvolvimento

| Termo | Definição no contexto do Receitando |
| --- | --- |
| **API (Application Programming Interface)** | Camada HTTP responsável por receber requisições do frontend, aplicar regras de negócio, acessar o banco de dados e devolver respostas estruturadas. |
| **Backend** | Parte do sistema responsável por autenticação, regras de negócio, catálogo, matching, persistência e demais operações executadas no servidor. A API atual roda em Cloudflare Workers. |
| **Cloudflare D1** | Banco de dados SQL baseado em SQLite utilizado como persistência de produção do Receitando. |
| **Cloudflare Workers** | Plataforma serverless utilizada para executar tanto a API quanto o frontend publicado do Receitando. |
| **CORS (Cross-Origin Resource Sharing)** | Política HTTP que controla quais origens podem realizar requisições à API. O projeto utiliza CORS com credenciais para a comunicação entre frontend e API. |
| **Cookie `HttpOnly`** | Cookie que não pode ser lido diretamente pelo JavaScript do navegador. O Receitando o utiliza para transportar a sessão autenticada com maior proteção. |
| **CSRF (Cross-Site Request Forgery)** | Tipo de ataque em que um navegador autenticado é induzido a executar uma ação não desejada. O entrypoint da API aplica verificações adicionais de origem em mutações. |
| **Deploy** | Processo de publicação de uma nova versão da aplicação em ambiente de produção. |
| **Entrypoint** | Arquivo que recebe inicialmente as requisições de um componente. Na API atual, `session-cookie-worker.ts` é o entrypoint publicado. |
| **Fallback** | Tratamento final utilizado quando nenhuma rota ou condição anterior corresponde à requisição recebida. |
| **Frontend** | Parte visual da aplicação executada no navegador, responsável pelas páginas, componentes, navegação e interação com o usuário. |
| **GitHub Actions** | Serviço de automação utilizado pelo projeto para CI, testes, validações, deploys e importação do catálogo. |
| **Integração contínua (CI)** | Processo automatizado que executa verificações como lint, typecheck, testes e build para validar alterações no código. |
| **Next.js** | Framework utilizado para estruturar o frontend do Receitando sobre React. |
| **OpenNext** | Ferramenta utilizada para adaptar a aplicação Next.js ao ambiente de execução da Cloudflare. |
| **Persistência** | Armazenamento de informações para que continuem disponíveis entre diferentes acessos e sessões, realizado principalmente por meio do Cloudflare D1. |
| **React** | Biblioteca utilizada na construção da interface do frontend. |
| **Roteamento** | Processo de direcionar uma requisição para o módulo responsável por tratá-la. Na API, `app-router.ts` centraliza esse direcionamento. |
| **Serverless** | Modelo de execução em nuvem no qual a aplicação roda em serviços gerenciados sem que a equipe precise administrar servidores tradicionais. |
| **TypeScript** | Linguagem utilizada no projeto para adicionar tipagem estática ao código JavaScript, principalmente no frontend e na API. |
| **Worker** | Unidade de código executada na infraestrutura da Cloudflare. No projeto, diferentes módulos Worker tratam autenticação, catálogo, perfil, despensa e interação social. |

## 4. Termos de banco de dados e busca

| Termo | Definição no contexto do Receitando |
| --- | --- |
| **Banco de dados** | Estrutura responsável por armazenar usuários, sessões, receitas, ingredientes, despensa, favoritos, comentários e demais informações persistentes. |
| **Chave estrangeira (Foreign Key)** | Restrição que relaciona registros de tabelas diferentes e ajuda a manter a integridade dos dados. |
| **D1 Migration** | Arquivo SQL versionado que altera de forma controlada a estrutura do banco Cloudflare D1. Migrations já aplicadas são tratadas como histórico imutável. |
| **FTS5 (Full-Text Search 5)** | Mecanismo de busca textual do SQLite usado pelo Receitando para pesquisar títulos e descrições de receitas de forma mais eficiente. |
| **Índice** | Estrutura criada no banco para acelerar determinados padrões de consulta. |
| **`ingredient_id`** | Identificador do ingrediente canônico utilizado para relacionar aliases, despensa e ingredientes das receitas. |
| **`is_staple`** | Flag que indica se um ingrediente é considerado básico e, portanto, não penaliza a compatibilidade atual. |
| **`recipe_ingredients`** | Relação entre receitas e ingredientes, armazenando também quantidade, unidade, opcionalidade e texto original quando disponível. |
| **`recipe_search`** | Tabela virtual FTS5 utilizada para indexar título e descrição das receitas. |
| **Slug** | Identificador textual amigável usado para representar uma receita em URLs ou referências legíveis. |
| **SQL (Structured Query Language)** | Linguagem utilizada para definir estruturas e consultar ou alterar dados no Cloudflare D1. |
| **Statement preparado** | Consulta SQL estruturada com valores enviados separadamente por parâmetros. A API utiliza statements preparados e `.bind()` para valores vindos das requisições. |
| **Trigger** | Regra executada automaticamente pelo banco diante de alterações em tabelas. O projeto utiliza triggers para manter o índice FTS5 sincronizado com as receitas. |

## 5. Termos de autenticação e segurança

| Termo | Definição no contexto do Receitando |
| --- | --- |
| **Autenticação** | Processo de confirmar a identidade do usuário, principalmente por cadastro, login e manutenção de sessão. |
| **Autorização** | Verificação de que um usuário autenticado possui permissão para executar determinada ação, como editar ou excluir o próprio comentário. |
| **Hash** | Resultado de uma função unidirecional aplicada a um dado. O projeto utiliza hashes para evitar armazenar determinados segredos em texto puro. |
| **PBKDF2** | Algoritmo de derivação de chave utilizado pelo projeto, por meio da Web Crypto API, para derivar hashes de senha com salt. |
| **Rate limiting** | Controle da quantidade de tentativas permitidas em um período para reduzir abuso em operações sensíveis, como login, cadastro e recuperação de senha. |
| **Resend** | Serviço utilizado para enviar o código de recuperação de senha por e-mail. |
| **Sessão** | Estado que mantém o usuário autenticado entre requisições. O navegador recebe um cookie de sessão e o D1 armazena apenas o hash do token correspondente. |
| **SHA-256** | Função de hash utilizada no projeto para armazenar de forma derivada tokens de sessão e identificadores de alguns controles de segurança. |
| **Token de sessão** | Valor aleatório usado para representar uma sessão autenticada. O valor bruto não é armazenado diretamente no banco. |
| **XSS (Cross-Site Scripting)** | Classe de vulnerabilidade em que conteúdo malicioso pode ser executado no navegador. O importador converte o conteúdo externo aproveitado em texto e o frontend não renderiza HTML bruto das receitas. |

## 6. Termos de catálogo externo e licenças

| Termo | Definição no contexto do Receitando |
| --- | --- |
| **Atribuição** | Exibição e preservação das informações necessárias para reconhecer a origem e a autoria de conteúdos externos utilizados no projeto. |
| **Importação de catálogo** | Processo automatizado que coleta receitas, imagens e metadados de fontes externas e grava os dados aceitos no banco. |
| **Licença livre** | Licença que permite determinado uso e redistribuição do conteúdo sob condições específicas. Não significa ausência de autoria ou obrigação de atribuição. |
| **MediaWiki API** | Interface utilizada pelos scripts do projeto para consultar dados do ecossistema Wikimedia. |
| **Sanitização** | Tratamento de conteúdo externo para remover ou neutralizar estruturas potencialmente perigosas antes de utilizá-lo na aplicação. |
| **Wikimedia Commons** | Repositório de mídia livre utilizado como fonte das imagens associadas às receitas. |
| **Wikilivros** | Projeto Wikimedia utilizado como fonte operacional atual do conteúdo textual das receitas em português. |

## 7. Termos que podem causar confusão

### Matching não é comparação de quantidade

Na versão atual, o matching considera a **presença ou ausência** do ingrediente. Quantidade e unidade são armazenadas e podem ser exibidas, mas ainda não alteram o percentual de compatibilidade.

### Ingrediente básico não significa ingrediente desnecessário

Um ingrediente marcado como `is_staple` continua fazendo parte da receita. A diferença é que sua ausência não reduz a pontuação de compatibilidade.

### Alias não é correspondência por palavra parcial

O sistema associa aliases conhecidos a ingredientes canônicos. Ele não considera automaticamente que dois ingredientes são iguais apenas porque um nome contém o outro. Por exemplo, `óleo` e `óleo de gergelim torrado` permanecem distintos.

### Licença livre não significa conteúdo sem autor

Receitas e imagens importadas continuam sujeitas às licenças de suas fontes. O Receitando preserva informações de origem, autoria e licença quando disponíveis.

## Documentação relacionada

- [`escopo.md`](escopo.md) — objetivos, requisitos e critérios acadêmicos;
- [`funcionalidades.md`](funcionalidades.md) — comportamento atualmente implementado;
- [`architecture.md`](architecture.md) — arquitetura e fluxo técnico;
- [`api.md`](api.md) — contrato HTTP da aplicação;
- [`database.md`](database.md) — modelo de dados, migrations e busca;
- [`catalogo.md`](catalogo.md) — origem das receitas, imagens, licenças e canonicalização;
- [`deploy.md`](deploy.md) — CI, publicação e operação.
