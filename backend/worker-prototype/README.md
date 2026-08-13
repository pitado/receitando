# Protótipo: NestJS no Cloudflare Workers

Este diretório valida a adaptação mínima da API existente sem mudar os controllers,
services, repositories, schema ou migrações do backend Node.js.

## Estratégia

- `node:http` + `cloudflare:node/httpServerHandler` adaptam o Express usado pelo Nest
  ao modelo `fetch()` dos Workers.
- O módulo específico de Prisma substitui o token `PrismaService` por um provider com
  escopo de requisição.
- Cada requisição cria `PrismaPg` com `HYPERDRIVE.connectionString`; o pool de conexões
  fica a cargo do Hyperdrive.
- O Nest é inicializado uma vez por isolate. Nenhuma conexão com PostgreSQL é aberta
  durante a inicialização porque o provider Prisma é request-scoped.

## Validação local

```powershell
npm install
npm run cf-typegen
npm run typecheck
npm run dry-run
npm run dev
```

O ID de Hyperdrive em `wrangler.jsonc` é deliberadamente inválido e serve apenas ao
protótipo/dry-run. Antes de um deploy real, substitua-o pelo ID criado para o banco de
produção. Não armazene a URL de produção em `vars`; o segredo fica na configuração do
Hyperdrive.

O domínio de produção também deve substituir `FRONTEND_URL` antes da publicação.
