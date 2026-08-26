# Testes automatizados

Este documento descreve a estratégia de testes do Receitando, o que é executado no CI e os limites conhecidos da suíte.

## Objetivo

Os testes existem para proteger regras de negócio e contratos que, se quebrarem, afetam diretamente a experiência ou a segurança do usuário.

A estratégia atual separa:

1. **testes do frontend**, com Vitest e React Testing Library;
2. **testes de regras puras da API**;
3. **testes de integração dos Workers**, executando os `fetch()` reais com um D1 simulado.

## Frontend

Diretório principal:

```text
frontend/src/**/*.test.ts
frontend/src/**/*.test.tsx
```

Ferramentas:

- Vitest;
- React Testing Library;
- jest-dom;
- jsdom;
- coverage V8.

Comandos:

```bash
cd frontend
npm test
npm run test:watch
npm run test:coverage
```

### Áreas cobertas

A suíte atual cobre:

- cliente HTTP;
- montagem de URL e headers;
- tratamento de erros HTTP, rede e respostas inválidas;
- autenticação no frontend;
- armazenamento da sessão usado pelo contrato atual;
- serviços de cadastro, login, logout, perfil e recuperação;
- catálogo e matching;
- despensa;
- favoritos;
- votos e comentários;
- feed da home;
- normalização de ingredientes;
- formatadores;
- componentes/estados compartilhados de UI.

### Cobertura

`frontend/vitest.config.mts` define limites mínimos para os módulos monitorados. O objetivo não é perseguir 100% artificialmente, mas impedir regressão silenciosa em serviços e regras centrais.

O CI executa `npm run test:coverage` antes do build.

## API Worker

Comandos:

```bash
cd backend/worker-prototype
npm test
```

O script primeiro compila `src/**/*.ts` para `.test-dist/` usando `tsconfig.tests.json` e depois executa `node --test tests/*.test.cjs`.

### Regras puras

Os testes cobrem:

- normalização de ingredientes;
- percentual e classificação do matching;
- PBKDF2;
- verificação de senha;
- salt aleatório;
- rejeição de hashes inválidos;
- SHA-256;
- políticas e janelas de rate limiting.

### Integração dos Workers

`tests/worker-routes.test.cjs` chama os Workers compilados reais e injeta um D1 fake controlado.

Isso permite testar roteamento e persistência sem escrever em produção.

Casos protegidos incluem:

- entrypoint `auth-rate-limit-worker.ts` e healthcheck;
- cadastro e criação de sessão;
- ausência das antigas rotas duplicadas de catálogo em `index.ts`;
- autorização da despensa;
- catálogo como implementação canônica de receitas/matching;
- limite de 40 ingredientes;
- rotas sociais sem colisão com `/api/recipes/:slug`;
- atribuição completa de imagem;
- favoritos;
- perfil;
- votos e comentários;
- recuperação de senha sem enumeração de e-mail;
- feed da home.

## O que não é E2E

Os testes da API não utilizam:

- D1 remoto de produção;
- Cloudflare Worker publicado;
- envio real do Resend;
- contas reais;
- dados privados de usuários.

Portanto, eles são testes unitários/integração de aplicação, não uma suíte E2E contra a infraestrutura externa.

## CI

### Frontend

```text
npm ci
  ↓
lint
  ↓
typecheck
  ↓
test:coverage
  ↓
build
```

### API

```text
npm ci
  ↓
typecheck
  ↓
test
  ↓
dry-run
```

Os workflows de deploy repetem as validações aplicáveis antes de publicar.

## Testes e segurança

Mudanças nas seguintes áreas devem receber teste de regressão sempre que possível:

- autenticação e sessão;
- rate limiting;
- recuperação de senha;
- autorização/IDOR;
- despensa e favoritos;
- comentários/votos;
- contratos do catálogo;
- licenças/atribuição externa;
- migrations que alterem persistência de dados críticos.

## Backend histórico

O NestJS/Prisma diretamente em `backend/` não faz parte da produção atual. Seu teste antigo é preservado como histórico, mas essa implementação não participa do CI oficial do produto.

Isso é intencional: o projeto não trata código histórico como um segundo backend ativo. Novas funcionalidades e testes devem ser adicionados à API em `backend/worker-prototype/`.

## Regra para novas mudanças

Uma mudança deve, quando aplicável:

1. adicionar/ajustar teste no mesmo PR;
2. manter testes determinísticos;
3. não depender de dados reais;
4. não exigir secrets para a suíte comum;
5. passar pelos checks do CI antes do merge.

## Documentos relacionados

- [`architecture.md`](architecture.md)
- [`api.md`](api.md)
- [`deploy.md`](deploy.md)
- [`estrutura-repositorio.md`](estrutura-repositorio.md)
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
