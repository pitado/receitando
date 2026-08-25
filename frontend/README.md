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
├── public/                arquivos públicos
├── src/
│   ├── app/               rotas e páginas do App Router
│   ├── components/        componentes reutilizáveis
│   ├── services/          acesso à API
│   ├── types/             tipos TypeScript
│   └── ...
├── next.config.ts         configuração do Next.js
├── open-next.config.ts    integração OpenNext
├── wrangler.jsonc         configuração do Worker
├── package.json           scripts e dependências
└── .env.example           exemplo de configuração local
```

A estrutura interna de `src/` pode evoluir, mas a regra é manter acesso à API concentrado na camada de serviços sempre que possível.

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

## Validação

Antes de abrir ou concluir uma alteração relevante:

```bash
npm run lint
npm run typecheck
npm run build
```

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
