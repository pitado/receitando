# Testes automatizados

Este documento descreve a estratégia de testes do Receitando, o que é executado no CI e os limites conhecidos da suíte.

## Objetivo

Os testes existem para proteger regras de negócio e contratos que, se quebrarem, afetam diretamente a experiência ou a segurança do usuário.

A estratégia atual separa quatro camadas:

1. **testes unitários/componentes do frontend**, com Vitest e React Testing Library;
2. **testes de regras puras da API**;
3. **testes de integração dos Workers**, executando os `fetch()` reais com um D1 simulado;
4. **testes E2E do frontend**, com Playwright em navegador Chromium real.

## Frontend — Vitest

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
- armazenamento do indicador não sensível de sessão;
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

O Frontend CI executa `npm run test:coverage` antes do build.

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
- políticas e janelas de rate limiting;
- construção/leitura/expiração do cookie de sessão.

### Integração dos Workers

`tests/worker-routes.test.cjs` chama os Workers compilados reais e injeta um D1 fake controlado. `tests/app-router.test.cjs` protege o dispatcher central e verifica que famílias de rotas chegam ao módulo correto.

Isso permite testar roteamento e persistência sem escrever em produção.

Casos protegidos incluem:

- healthcheck e handlers base;
- roteamento central de perfil, despensa, matching, social e autenticação limitada;
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

## E2E — Playwright

Diretório:

```text
frontend/e2e/
```

A suíte usa `@playwright/test` e executa o frontend real em Chromium. Ela não substitui os testes unitários nem os testes dos Workers; verifica se as camadas do frontend funcionam juntas dentro de um navegador.

### Fluxos cobertos

- home e navegação para `/combinar`;
- estado da despensa quando não há sessão;
- inclusão de ingredientes e matching;
- validação do combinador vazio;
- login e redirecionamento para `/despensa`;
- ausência do token legado em `localStorage`/`sessionStorage`;
- erro de credenciais inválidas;
- recuperação de senha em três etapas.

### Isolamento da API

Os E2E não utilizam produção. O Playwright inicia o Next.js localmente com uma URL de API reservada para a suíte:

```text
http://127.0.0.1:3000/__e2e_api
```

As requisições dessa URL são interceptadas e recebem respostas determinísticas. Dessa forma:

- nenhum D1 remoto é alterado;
- nenhuma conta real é necessária;
- nenhum e-mail real é enviado;
- os testes não dependem de rede externa;
- falhas do frontend podem ser reproduzidas sem depender do estado da produção.

O contrato real da API continua protegido pelos testes de integração dos Workers.

### Execução local

```bash
cd frontend
npm ci
cd e2e
npm ci
npx playwright install chromium
npm test
```

Também existem:

```bash
npm run test:headed
npm run test:ui
```

### Evidências de falha

O Playwright mantém:

- screenshot em falha;
- vídeo em falha;
- trace em falha;
- relatório HTML.

No GitHub Actions esses artefatos são enviados pelo workflow `E2E Playwright` e retidos por 7 dias.

## O que não é testado contra produção

As suítes comuns não utilizam:

- D1 remoto de produção;
- contas reais;
- envio real do Resend;
- dados privados de usuários.

O objetivo é manter validações determinísticas e seguras. Verificações manuais ou smoke tests de produção podem complementar a suíte quando necessário, sem transformar a infraestrutura real em fixture de teste.

## CI

### Frontend CI

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

### API Worker CI

```text
npm ci
  ↓
typecheck
  ↓
test
  ↓
dry-run
```

### E2E Playwright

```text
npm ci (frontend)
  ↓
npm ci (frontend/e2e)
  ↓
instala Chromium
  ↓
inicia Next.js local
  ↓
Playwright E2E
```

Os workflows de deploy repetem as validações aplicáveis antes de publicar. O E2E fica separado do deploy para manter o diagnóstico claro e evitar que instalação de navegador seja confundida com a etapa de publicação.

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

Quando uma alteração muda um fluxo completo de usuário, deve-se avaliar também um cenário Playwright.

## Backend histórico

O NestJS/Prisma arquivado não faz parte da produção atual e não participa do CI oficial do produto.

Isso é intencional: o projeto não trata código histórico como um segundo backend ativo. Novas funcionalidades e testes devem ser adicionados à API em `backend/worker-prototype/`.

## Regra para novas mudanças

Uma mudança deve, quando aplicável:

1. adicionar/ajustar teste no mesmo PR;
2. manter testes determinísticos;
3. não depender de dados reais;
4. não exigir secrets para a suíte comum;
5. incluir E2E quando o risco estiver no fluxo entre páginas/componentes;
6. passar pelos checks do CI antes do merge.

## Documentos relacionados

- [`architecture.md`](architecture.md)
- [`api.md`](api.md)
- [`deploy.md`](deploy.md)
- [`estrutura-repositorio.md`](estrutura-repositorio.md)
- [`../frontend/e2e/README.md`](../frontend/e2e/README.md)
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
