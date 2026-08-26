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
- catálogo: Wikilivros + Wikimedia Commons;
- implementação anterior NestJS/Prisma/PostgreSQL: arquivada na branch `legacy/nest-prisma`, fora da árvore principal.

Toda funcionalidade nova de backend deve ser implementada em `backend/worker-prototype/`.

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

### API

Ao alterar:

- normalização/canonicalização/matching → atualizar `recipe-utils` e teste de rota correspondente;
- staples → testar que não reduzem a compatibilidade;
- busca textual → testar o contrato FTS5 e evitar regressão para `%LIKE%`;
- autenticação/criptografia → `security` + regressão de rota quando aplicável;
- rate limiting → `auth-rate-limit` e entrypoint;
- rota/persistência/autorização → teste de Worker com D1 simulado;
- recuperação de senha → testar resposta genérica e limites sem enviar e-mail real;
- catálogo/licença → testar procedência e atribuição.

Rotas críticas e persistência **não devem depender apenas de testes de helpers**.

## Banco de dados

- nunca reescreva migration já aplicada;
- mudanças de schema entram em migration nova;
- migrations ficam em `backend/worker-prototype/migrations/`;
- documente índices, FTS e migrations incomuns em `docs/database.md`;
- preserve chaves estrangeiras e relações existentes;
- valide localmente antes de aplicação remota.

Valores de requisição devem chegar ao D1 por statements preparados com `.bind()`. SQL estrutural dinâmico só pode ser construído a partir de valores controlados internamente, como a quantidade de placeholders `?`.

## Catálogo e ingredientes

O fluxo operacional atual usa:

```text
import-wikibooks-v2.mjs
        ↓
canonicalize-ingredients.mjs
```

Ao alterar normalização:

- preserve `raw_text` da receita;
- preserve aliases úteis;
- não transforme equivalência semântica em simples substring;
- adicione teste para evitar falsos positivos;
- mantenha a política de `is_staple` documentada.

## Conteúdo externo e segurança

O fluxo atual persiste conteúdo culinário como texto e não renderiza HTML bruto do Wikilivros.

Não introduza `dangerouslySetInnerHTML` para conteúdo externo sem uma etapa explícita e testada de sanitização.

Nunca versione chaves, tokens, senhas, códigos de recuperação ou dados privados reais. Falhas de segurança devem seguir [`SECURITY.md`](SECURITY.md).

## Documentação

- objetivo/requisito → `docs/escopo.md`;
- comportamento → `docs/funcionalidades.md`;
- arquitetura → `docs/architecture.md`;
- rota/contrato → `docs/api.md`;
- schema/migration/índice → `docs/database.md`;
- catálogo/importação/licença → `docs/catalogo.md`;
- testes → `docs/testes.md`;
- CI/deploy → `docs/deploy.md`;
- estrutura → `docs/estrutura-repositorio.md`.

README e documentos específicos não devem contradizer o código.

## Código substituído

Quando uma implementação for substituída e o histórico já estiver preservado pelo Git:

- remova código morto da árvore ativa;
- remova scripts/workflows sem função operacional;
- mantenha apenas o que é executado ou possui justificativa explícita.

## Conteúdo e licenças

O código original do projeto é disponibilizado sob **GNU Affero General Public License v3.0 (AGPL-3.0-only)**. Contribuições ao código devem ser compatíveis com essa licença.

A licença do projeto não substitui as licenças próprias de receitas, imagens e outros conteúdos de terceiros.

Não remova fonte, autoria, licença ou URL de atribuição de conteúdo importado.

## Pull requests

Todo PR deve explicar problema, solução, validação, testes, impacto em API/banco/deploy/documentação e eventuais riscos/passos adicionais.

Prefira mudanças revisáveis e com CI verde.
