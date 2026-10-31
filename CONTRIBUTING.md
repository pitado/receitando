# Contribuindo com o Receitando

O Receitando é um projeto acadêmico com aplicação publicada. Toda alteração deve manter alinhados o código, os testes, a documentação técnica e o ambiente real.

## Comece por aqui

- [README](README.md) e [System Design (Fase 4)](docs/system-design-fase4.md).
- [Arquitetura](docs/architecture.md), [modelo de dados](docs/database.md) e [contratos REST](docs/api.md).
- [Testes](docs/testes.md), [deploy](docs/deploy.md), [licenças e origens](docs/catalogo.md).

## Arquitetura atual

| Componente | Tecnologia real |
| --- | --- |
| Frontend responsivo/PWA | `frontend/` — Next.js 16, React 19, TypeScript, Workers/OpenNext |
| API REST stateless | `backend/worker-prototype/` — Cloudflare Workers e TypeScript |
| Persistência | **Neon PostgreSQL 17**, via **Cloudflare Hyperdrive** e `pg` |
| Fotos | Cloudflare R2 |
| Cozinhar junto | Durable Objects + WebSocket |
| E-mails | Resend |
| CI/CD | GitHub Actions |

O schema de produção é definido por `backend/worker-prototype/migrations/postgres/`. Não existe configuração de D1 na API publicada. O adaptador `src/lib/postgres-adapter.ts` ainda traduz algumas consultas SQL dos módulos existentes para PostgreSQL; **não é um banco antigo em execução**.

## Fluxo de trabalho

1. Criar branch a partir de `main`.
2. Fazer alterações pequenas, revisáveis, com testes para mudanças de comportamento.
3. Atualizar documentação e migrações quando houver mudança de contrato/schema.
4. Executar as validações locais e revisar os relatórios no GitHub Actions.
5. Abrir pull request e integrar **somente depois** dos checks obrigatórios.

### Backend

```bash
cd backend/worker-prototype
npm ci
npm run typecheck
npm test
npm run test:postgres
npm run test:ws
npm run dry-run
```

A integração PostgreSQL usa **banco temporário isolado** (`POSTGRES_TEST_URL` apontando para localhost). O teste WebSocket também ocorre em ambiente local isolado. Não usar a branch Neon `production` em testes destrutivos ou cargas sintéticas.

### Frontend

```bash
cd frontend
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

Quando alterar autenticação, navegação ou jornadas principais, executar também os testes em `frontend/e2e/` usando mocks e Playwright.

## Banco e consultas

- Criar migration **PostgreSQL** numerada em `migrations/postgres/`; nunca editar uma migration já aplicada sem análise explícita.
- Preferir consultas SQL PostgreSQL parametrizadas, índices adequados e transações para operações relacionadas.
- Verificar consistência, integridade referencial e plano das consultas.
- Considerar que a camada atual `postgres-adapter` preserva a interface usada pelos módulos: modificá-la requer testes de regressão.
- Credenciais do Neon e do Hyperdrive ficam em secrets, nunca no Git. Aplicar migrações de produção de forma revisada, **não** implicitamente no deploy.

## Catálogo e licenças

As receitas de autoria própria são versionadas em migrações PostgreSQL. Referências de sites brasileiros são **metadados e URLs**, não cópias de textos/fotos protegidos. O procedimento operacional para links autorizados usa:

```text
scripts/external-references-br.json
     → scripts/import-external-references.mjs
     → PostgreSQL isolado (validar) / destino autorizado (--apply)
```

O workflow manual é `.github/workflows/import-external-references.yml`. Não fazer scraping nem importar obras de terceiros sem licença compatível. O campo de origem `wikibooks` pode existir em dados ou contratos históricos e **não autoriza novos espelhamentos sem licença**.

Ao editar matching, preserve aliases, nomes originais, casos semânticos distintos e o tratamento de ingredientes `is_staple`.

## Segurança e privacidade

Nunca commitar senhas, tokens, registros de usuários, códigos de recuperação ou URLs privadas de conexão. Não usar `dangerouslySetInnerHTML` com conteúdo externo não sanitizado. Mudanças nas rotas de autenticação devem preservar respostas genéricas anti-enumeração e rate limiting. Seguir [SECURITY.md](SECURITY.md).

## Limpeza de código

Remover scripts, workflows e arquivos operacionais obsoletos somente depois de confirmar que **não são referenciados** pelo código ou CI. Manter histórico no Git. Não eliminar uma abstração em uso apenas por seu nome histórico.

## Licença

Código original: [AGPL-3.0](LICENSE). Textos, imagens e receitas de terceiros possuem licenças/autorias próprias, que devem ser respeitadas.
