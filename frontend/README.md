# Frontend do Receitando

Aplicação web construída com **Next.js**, **React** e **TypeScript**, publicada em Cloudflare Workers por meio do OpenNext.

## Responsabilidades

- navegação/layout;
- catálogo e detalhe de receitas;
- matching por ingredientes;
- despensa e favoritos;
- cadastro/login/logout;
- perfil e recuperação de senha;
- votos e comentários;
- feed da home;
- estados de loading, erro, vazio e 404;
- apresentação de procedência/licença das receitas e imagens.

Toda persistência passa pela API; o frontend não acessa D1 diretamente.

## Estrutura

```text
frontend/
├── e2e/                         Playwright e testes de navegador
├── public/
├── src/
│   ├── app/                     páginas App Router
│   ├── components/              UI reutilizável
│   ├── lib/                     utilitários
│   ├── services/                contratos HTTP
│   ├── test/                    setup da suíte Vitest
│   └── types/                   tipos da API
├── vitest.config.mts
├── next.config.ts
├── open-next.config.ts
├── wrangler.jsonc
├── package.json
└── package-lock.json
```

## Requisitos

- Node.js 20.9+;
- npm 10+.

## Desenvolvimento

```bash
cd frontend
npm ci
npm run dev
```

`frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8787
```

Padrão:

```text
http://localhost:3000
```

## Validação completa

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

Além dessas validações, o workflow **E2E Playwright** executa fluxos reais de navegador em Chromium.

## Testes unitários e de componentes

Ferramentas:

- Vitest;
- React Testing Library;
- jest-dom;
- jsdom;
- cobertura V8.

Scripts:

```bash
npm test
npm run test:watch
npm run test:coverage
```

A suíte cobre serviços HTTP, autenticação no cliente, armazenamento de sessão, catálogo/matching, despensa, favoritos, perfil, recuperação, social/home, utilitários e componentes compartilhados.

`vitest.config.mts` define limites mínimos para evitar regressão silenciosa de cobertura nos módulos monitorados.

## Testes E2E com Playwright

A suíte de navegador fica em `frontend/e2e/` e usa uma instalação isolada do Playwright para não misturar dependências de automação com o runtime da aplicação.

Ela cobre os fluxos críticos da interface:

- home → combinador;
- estado de despensa sem sessão;
- matching de receitas;
- login → despensa;
- credenciais inválidas;
- ausência de token legado no Web Storage;
- recuperação completa de senha.

Execução local:

```bash
cd frontend
npm ci
cd e2e
npm ci
npx playwright install chromium
npm test
```

Durante os E2E, a API é interceptada em uma URL local dedicada. A suíte não usa contas reais, não envia e-mail e não escreve no D1 de produção.

Em caso de falha, screenshots, vídeos e traces são preservados e enviados como artefatos no GitHub Actions.

Mais detalhes: [`e2e/README.md`](e2e/README.md) e [`../docs/testes.md`](../docs/testes.md).

## API

Produção:

```text
https://api.receitando.miguelpita.com.br
```

A camada `src/services/` concentra chamadas HTTP. A rota canônica de detalhe é:

```text
GET /api/recipes/:slug
```

Contrato: [`../docs/api.md`](../docs/api.md).

## Autenticação no navegador

A credencial da sessão não é persistida em `localStorage` nem em `sessionStorage`.

A API entrega a sessão em cookie `HttpOnly`; o cliente HTTP usa `credentials: "include"` para que o navegador envie esse cookie automaticamente. O JavaScript do frontend mantém apenas um indicador não sensível para sincronização de UX e remove tokens legados que ainda possam existir no Web Storage.

Em produção, a API usa cookie `__Host-` com `HttpOnly`, `Secure`, `SameSite=Strict` e `Path=/`, além de CORS credenciado restrito às origens configuradas e validação de `Origin` em operações mutáveis do navegador.

## Imagens e atribuição

O tipo `Recipe` recebe:

- `source`: procedência do conteúdo da receita;
- `image`: URL, fonte, autor, página, licença, URL da licença e texto alternativo da imagem;
- `imageUrl`: mantido por compatibilidade.

A página de detalhe utiliza o `alt` importado quando disponível e exibe os créditos específicos da imagem com links para o arquivo original e licença.

A configuração do Next.js restringe os hosts remotos de imagem às fontes necessárias ao catálogo atual.

## Segurança

Nunca coloque secrets em variáveis `NEXT_PUBLIC_*`: elas são entregues ao navegador.

A autenticação no navegador usa cookie `HttpOnly`; o token bruto de sessão não faz parte do contrato público consumido pelo frontend e não fica disponível ao JavaScript.

Detalhes: [`../SECURITY.md`](../SECURITY.md).

## Deploy

O workflow executa instalação, lint, typecheck, testes com cobertura, build OpenNext e publicação. A suíte E2E roda em workflow separado para validar os fluxos de navegador sem acoplar a automação de Chromium ao deploy.

Detalhes: [`../docs/deploy.md`](../docs/deploy.md).

## Documentação relacionada

- [`../README.md`](../README.md)
- [`../docs/escopo.md`](../docs/escopo.md)
- [`../docs/funcionalidades.md`](../docs/funcionalidades.md)
- [`../docs/architecture.md`](../docs/architecture.md)
- [`../docs/api.md`](../docs/api.md)
- [`../docs/testes.md`](../docs/testes.md)
- [`e2e/README.md`](e2e/README.md)
