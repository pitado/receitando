# E2E do frontend

Esta pasta contém a suíte de navegador do Receitando com **Playwright**.

Ela complementa os testes unitários do frontend e os testes de integração da API exercitando páginas reais do Next.js em Chromium.

## O que é coberto

- carregamento da home e navegação para o combinador;
- estado da despensa sem autenticação;
- inclusão de ingredientes e matching de receitas;
- validação do combinador sem ingredientes;
- login com redirecionamento para a despensa;
- garantia de que o token legado não é persistido em Web Storage;
- erro de credenciais inválidas;
- fluxo completo de recuperação de senha.

## API durante os testes

A suíte **não usa produção** e não escreve no D1.

O Playwright inicia o frontend local com:

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:3000/__e2e_api
```

As chamadas dessa URL são interceptadas pelos testes e recebem respostas determinísticas. Assim os testes de navegador validam o fluxo frontend sem depender de internet, contas reais, Resend ou dados de produção.

A API real continua protegida por sua própria suíte de integração em `backend/worker-prototype/tests/`.

## Executar localmente

Primeiro instale as dependências do frontend:

```bash
cd frontend
npm ci
```

Depois instale a suíte E2E e o Chromium:

```bash
cd e2e
npm ci
npx playwright install chromium
npm test
```

Para acompanhar o navegador:

```bash
npm run test:headed
```

Para a interface interativa do Playwright:

```bash
npm run test:ui
```

## Artefatos

Em falhas, o Playwright preserva screenshot, vídeo e trace. No GitHub Actions esses artefatos são enviados pelo workflow `E2E Playwright` e ficam disponíveis por 7 dias.

## CI

O workflow `.github/workflows/e2e.yml` roda em mudanças de frontend para `main` e em pull requests destinados à `main`.

Etapas principais:

```text
npm ci (frontend)
  ↓
npm ci (e2e)
  ↓
instala Chromium
  ↓
inicia Next.js local
  ↓
Playwright E2E
```

Nenhum secret é necessário para essa suíte.
