# Testes e qualidade

Este documento descreve a estratégia de testes automatizados do Receitando e quais partes da aplicação são protegidas pelo CI.

## Objetivo

A suíte de testes existe para detectar regressões antes de uma alteração chegar à produção. Ela complementa, e não substitui, as outras validações do projeto:

- lint;
- typecheck;
- testes automatizados;
- cobertura de código no frontend;
- build do frontend;
- dry-run do Cloudflare Worker.

O foco está nos dois componentes atualmente usados em produção: o frontend Next.js e a API em Cloudflare Workers. O backend NestJS/Prisma preservado em `backend/` é histórico e não faz parte da cadeia de produção nem do CI principal.

## Frontend

### Ferramentas

O frontend utiliza:

- **Vitest** como test runner;
- **React Testing Library** para validar componentes pelo comportamento visível ao usuário;
- **jest-dom** para assertions de DOM e acessibilidade;
- **jsdom** como ambiente de navegador nos testes;
- **V8 coverage** para medir cobertura.

Configuração:

```text
frontend/vitest.config.mts
```

Preparação do ambiente:

```text
frontend/src/test/setup.ts
```

### Comandos

```bash
cd frontend
npm test
npm run test:watch
npm run test:coverage
```

`npm test` executa a suíte uma vez. `npm run test:watch` é útil durante o desenvolvimento. `npm run test:coverage` executa a suíte e aplica os limites mínimos configurados para os módulos monitorados.

### O que é coberto

A suíte atual do frontend verifica, entre outros pontos:

- cliente HTTP e montagem correta da URL da API;
- envio do token `Bearer` quando há sessão;
- respostas `204`;
- erros HTTP, respostas inválidas, falhas de conexão e cancelamento por `AbortError`;
- persistência de autenticação em `localStorage` e `sessionStorage`;
- limpeza da sessão no logout;
- contratos das rotas de cadastro, login, perfil e recuperação de senha;
- contratos de catálogo e matching;
- contratos de despensa e favoritos;
- contratos de votos e comentários;
- consulta do feed da home;
- normalização de nomes de ingredientes;
- formatação de tempo e quantidades;
- componentes compartilhados de botão, loading, erro, estado vazio e título de seção.

Os testes de serviços usam mocks apenas na fronteira HTTP para validar qual rota, método, corpo e sinal cada função envia. Os testes de componentes priorizam papéis acessíveis, texto apresentado e ações observáveis em vez de detalhes internos de implementação.

### Cobertura

A cobertura é calculada pelo provider V8. O CI falha se os módulos monitorados ficarem abaixo dos limites definidos em `vitest.config.mts`.

Os limites atuais são:

| Métrica | Mínimo |
| --- | ---: |
| linhas | 70% |
| statements | 70% |
| funções | 70% |
| branches | 60% |

Esses valores são um piso, não uma meta final. Novas regras críticas devem chegar acompanhadas de testes e a cobertura não deve ser mantida artificialmente excluindo código importante.

## API Cloudflare Worker

### Ferramentas

A API utiliza o test runner nativo do Node.js (`node:test`) e `node:assert/strict`.

Antes de executar os testes, o TypeScript atual da API é compilado por:

```text
backend/worker-prototype/tsconfig.tests.json
```

A saída temporária fica em `.test-dist/`, que é ignorada pelo Git.

### Comando

```bash
cd backend/worker-prototype
npm test
```

### Testes de regras puras

Os arquivos de helpers cobrem regras usadas diretamente pelo código de produção, incluindo:

- normalização de ingredientes;
- percentual de compatibilidade;
- classificação `READY`, `ALMOST_READY`, `NEAR` e `EXPLORE`;
- PBKDF2 para senhas;
- verificação de senha correta e incorreta;
- geração de salts diferentes;
- rejeição de hashes inválidos;
- SHA-256 usado para tokens.

### Testes de rotas dos Workers

Além dos helpers, a suíte carrega os Workers compilados e chama seus métodos `fetch()` com `Request` reais. Um D1 fake controlado pelo teste simula `prepare`, `bind`, `first`, `all`, `run` e `batch`, permitindo verificar comportamento de rotas sem acessar o banco de produção.

A cobertura de fluxo inclui as camadas ativas:

```text
home-worker
   ↓
catalog64-worker
   ↓
social-worker
   ↓
profile-worker
   ↓
password-reset-validation-worker
   ↓
password-reset-worker
   ↓
pantry-worker
   ↓
index
```

Entre os cenários automatizados estão:

- healthcheck e CORS;
- validação e criação de usuário/sessão;
- proteção de rotas autenticadas;
- inclusão de item na despensa;
- leitura/alteração de perfil;
- proteção de votos e comentários;
- receita inexistente em recursos sociais;
- validações do fluxo de recuperação de senha;
- fonte Wikilivros retornada pelo catálogo;
- validação de matching e matching por despensa;
- montagem do feed da home e seus totais;
- delegação correta de uma rota através de toda a cadeia de Workers.

Esses testes são **testes de rota/contrato com D1 simulado**. Eles não devem ser descritos como testes end-to-end contra a infraestrutura real da Cloudflare.

## O que o CI executa

### Frontend CI

A sequência esperada é:

```text
npm ci
→ lint
→ typecheck
→ test:coverage
→ build
```

O deploy do frontend também executa as validações antes da publicação.

### API Worker CI

A sequência esperada é:

```text
npm ci
→ typecheck
→ npm test
→ dry-run
```

No deploy da API, testes e dry-run acontecem antes de migrations remotas e da publicação do Worker.

## Quando adicionar um teste

Um teste deve ser criado ou atualizado quando uma mudança:

- corrige um bug que pode voltar;
- altera uma regra de matching;
- muda autenticação, sessão ou recuperação de senha;
- altera um contrato entre frontend e API;
- adiciona ou modifica rota do Worker;
- muda comportamento de despensa, favoritos, perfil ou comunidade;
- altera um componente compartilhado com comportamento relevante;
- introduz tratamento novo de loading, erro ou estado vazio.

## Limites da suíte atual

A suíte reduz bastante o risco de regressões, mas não significa que todo comportamento possível esteja coberto. Atualmente:

- os testes dos Workers usam D1 simulado, não um D1 real isolado;
- envio real pelo Resend não é disparado pelos testes;
- navegação completa no navegador não é coberta por E2E neste momento;
- o backend NestJS/Prisma histórico não faz parte do CI principal.

Caso o projeto passe a exigir testes end-to-end, a evolução natural é adicionar uma camada separada de browser tests e um ambiente de integração isolado, sem usar credenciais ou dados de produção.

## Regra de manutenção

Uma alteração não deve enfraquecer ou remover testes apenas para deixar o CI verde. Quando uma regra de negócio mudar intencionalmente, o código e os testes correspondentes devem ser atualizados juntos e a mudança deve estar explicada no Pull Request.
