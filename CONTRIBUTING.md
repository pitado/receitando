# Contribuindo com o Receitando

O Receitando é um projeto acadêmico, mas o repositório segue práticas de manutenção próximas às de um projeto de produção para manter código, documentação e infraestrutura coerentes.

## Antes de começar

Leia:

1. [`README.md`](README.md)
2. [`docs/escopo.md`](docs/escopo.md)
3. [`docs/estrutura-repositorio.md`](docs/estrutura-repositorio.md)
4. [`docs/architecture.md`](docs/architecture.md)
5. [`docs/testes.md`](docs/testes.md)
6. a documentação específica da área alterada.

## Arquitetura atual

- frontend: `frontend/` — Next.js/React;
- API: `backend/worker-prototype/` — Cloudflare Workers + D1;
- backend NestJS/Prisma diretamente em `backend/`: histórico;
- catálogo: Wikilivros + Wikimedia Commons.

Não implemente funcionalidades novas no backend histórico.

## Fluxo

1. crie branch a partir de `main`;
2. mantenha a mudança focada;
3. atualize testes e documentação no mesmo PR quando o comportamento mudar;
4. rode as validações locais;
5. abra PR usando o template;
6. aguarde CI verde antes do merge.

Exemplos:

```text
feat/nome-da-funcionalidade
fix/resumo-do-problema
test/area-coberta
docs/assunto
chore/manutencao
```

## Validação obrigatória

### Frontend

```bash
cd frontend
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

### API

```bash
cd backend/worker-prototype
npm ci
npm run typecheck
npm test
npm run dry-run
```

Não faça merge com validação obrigatória falhando.

## Testes

### Frontend

Mudanças em serviços, utilitários ou componentes com comportamento relevante devem atualizar/adicionar testes Vitest/Testing Library.

Exemplos:

- contrato HTTP → teste de `services/`;
- autenticação no cliente → teste de serviço/armazenamento;
- normalização/formatação → teste unitário;
- estado reutilizável de UI → teste de componente.

### API

Ao alterar:

- matching → atualizar testes de `recipe-utils` e/ou rota;
- autenticação/criptografia → `security` + regressão de rota quando aplicável;
- rate limiting → `auth-rate-limit`;
- rota/persistência/autorização → atualizar `worker-routes.test.cjs`;
- recuperação de senha → testar resposta genérica, validação e autorização sem enviar e-mail real;
- catálogo/licença → testar o contrato público de procedência/atribuição.

Rotas críticas e persistência **não devem depender apenas de testes de helpers**. Quando o comportamento atravessa Worker + D1, inclua teste de integração com o D1 simulado.

Evite testes acoplados à implementação interna quando é possível validar um comportamento observável.

## Banco de dados

- nunca reescreva migration já aplicada;
- mudanças de schema entram em migration nova;
- migrations ficam em `backend/worker-prototype/migrations/`;
- documente migrations incomuns ou correções históricas em `docs/database.md`;
- valide localmente antes de aplicação remota.

## Documentação

- objetivo/requisito → `docs/escopo.md`;
- comportamento implementado → `docs/funcionalidades.md`;
- arquitetura/entrypoint → `docs/architecture.md`;
- rota/contrato → `docs/api.md`;
- schema/migration → `docs/database.md`;
- catálogo/importação/licença → `docs/catalogo.md`;
- testes → `docs/testes.md`;
- CI/deploy → `docs/deploy.md`;
- estrutura → `docs/estrutura-repositorio.md`.

README e documentos específicos não devem contradizer o código. Se uma mudança altera uma afirmação documentada, corrija o texto no mesmo PR.

## Código substituído

Evite manter implementações antigas executáveis apenas “por garantia”.

Quando uma versão é substituída e o histórico já está no Git:

- remova código morto da árvore ativa;
- remova scripts/workflows que não possuem função operacional;
- mantenha somente o que ainda é usado ou possui motivo explícito de preservação.

## Segurança e secrets

Nunca versione:

- chaves de API;
- tokens Cloudflare/GitHub;
- senhas;
- tokens de sessão;
- códigos de recuperação;
- dados privados reais.

Falhas de segurança devem seguir [`SECURITY.md`](SECURITY.md).

## Conteúdo e licenças

MIT cobre o código original do projeto; não substitui licenças de terceiros.

Não remova fonte, autoria, licença ou URL de atribuição de conteúdo importado. Alterações no contrato de receita devem preservar os campos necessários para atribuição do Wikilivros/Wikimedia Commons.

## Pull requests

Todo PR deve explicar:

- problema;
- solução;
- validação;
- testes adicionados/alterados;
- impacto em API/banco/deploy/documentação;
- riscos ou passos adicionais.

Prefira mudanças revisáveis e com CI verde.
