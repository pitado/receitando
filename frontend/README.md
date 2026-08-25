# Frontend do Receitando

Aplicação web do Receitando construída com **Next.js**, **React** e **TypeScript**, publicada em **Cloudflare Workers** por meio do OpenNext.

## Responsabilidades

O frontend é responsável por:

- navegação e layout;
- autenticação no cliente;
- catálogo e detalhes de receitas;
- busca e combinação por ingredientes;
- uso da despensa do usuário;
- favoritos;
- perfil;
- recuperação de senha;
- avaliações e comentários;
- feed da página inicial;
- tratamento de carregamento, erros e página 404.

Toda persistência é feita pela API. O frontend não acessa o D1 diretamente.

## Estrutura principal

```text
frontend/
├── public/                 arquivos públicos
├── src/
│   ├── app/                rotas e páginas do App Router
│   ├── components/         componentes reutilizáveis e testes de UI
│   ├── lib/                utilitários e testes de regras do cliente
│   ├── services/           acesso à API e testes de contratos
│   ├── test/               setup compartilhado do ambiente de testes
│   ├── types/              tipos TypeScript
│   └── ...
├── vitest.config.mts       configuração do Vitest e cobertura V8
├── next.config.ts          configuração do Next.js
├── open-next.config.ts     integração OpenNext
├── wrangler.jsonc          configuração do Worker
├── package.json            scripts e dependências
└── .env.example            exemplo de configuração local
```

A regra é manter acesso à API concentrado na camada de serviços sempre que possível e testar comportamento observável em vez de detalhes internos dos componentes.

## Requisitos

- Node.js 20.9 ou superior;
- npm 10 ou superior.

## Instalação

```bash
cd frontend
npm ci
```

## Ambiente local

Crie `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8787
```

Inicie:

```bash
npm run dev
```

A aplicação fica disponível normalmente em:

```text
http://localhost:3000
```

## Testes automatizados

O frontend utiliza **Vitest**, **React Testing Library**, **jest-dom**, **jsdom** e cobertura pelo provider **V8**.

Comandos disponíveis:

```bash
npm test
npm run test:watch
npm run test:coverage
```

A suíte cobre áreas como:

- cliente HTTP e tratamento de erros;
- autenticação e armazenamento de sessão;
- cadastro, login, logout, perfil e recuperação de senha;
- contratos de catálogo, matching, despensa e favoritos;
- contratos de votos, comentários e feed da home;
- normalização de ingredientes e formatadores;
- componentes compartilhados de botão, loading, erro, estado vazio e títulos de seção.

O relatório de cobertura é gerado por `npm run test:coverage`. A configuração mantém limites mínimos para linhas, statements, funções e branches; o CI falha se o piso definido for quebrado.

A documentação detalhada da estratégia está em [`../docs/testes.md`](../docs/testes.md).

## Validação

Antes de abrir ou concluir uma alteração relevante:

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

Essas etapas também fazem parte do CI. O workflow de deploy repete as validações relevantes antes de publicar o frontend.

## API

Produção:

```text
https://api.receitando.miguelpita.com.br
```

A documentação de rotas está em:

[`../docs/api.md`](../docs/api.md)

## Imagens de receitas

O frontend aceita imagens remotas das fontes utilizadas pelo catálogo atual. A configuração de host remoto e política de conteúdo fica em `next.config.ts`.

O catálogo atual utiliza receitas do Wikilivros e imagens livres do Wikimedia Commons.

## Deploy

O frontend é compilado com OpenNext e publicado como Cloudflare Worker.

A automação está documentada em:

[`../docs/deploy.md`](../docs/deploy.md)

## Segurança

Nunca coloque no frontend secrets reais, tokens administrativos ou credenciais privadas.

Variáveis com prefixo `NEXT_PUBLIC_` são acessíveis ao navegador e, portanto, devem conter apenas informações que podem ser públicas.

## Documentação relacionada

- [`../README.md`](../README.md)
- [`../docs/escopo.md`](../docs/escopo.md)
- [`../docs/architecture.md`](../docs/architecture.md)
- [`../docs/api.md`](../docs/api.md)
- [`../docs/testes.md`](../docs/testes.md)
- [`../docs/deploy.md`](../docs/deploy.md)
