# Contribuindo com o Receitando

Obrigado pelo interesse em contribuir com o Receitando. O projeto é acadêmico, mas o repositório segue práticas próximas às de um projeto de produção para manter código, documentação e infraestrutura coerentes.

## Antes de começar

Leia, nesta ordem:

1. [`README.md`](README.md)
2. [`docs/escopo.md`](docs/escopo.md)
3. [`docs/estrutura-repositorio.md`](docs/estrutura-repositorio.md)
4. [`docs/architecture.md`](docs/architecture.md)
5. [`docs/testes.md`](docs/testes.md)
6. a documentação específica da área que será alterada.

## Arquitetura atual

- frontend: `frontend/` — Next.js/React;
- API atual: `backend/worker-prototype/` — Cloudflare Worker + D1;
- backend NestJS/Prisma diretamente em `backend/`: histórico, não é a implementação de produção;
- catálogo atual: Wikilivros + Wikimedia Commons.

Não implemente novas funcionalidades no backend histórico.

## Fluxo de contribuição

1. crie uma branch a partir de `main`;
2. faça alterações pequenas e focadas;
3. atualize testes e documentação quando o comportamento mudar;
4. rode as validações locais;
5. abra um pull request usando o template do repositório;
6. aguarde o CI ficar verde antes do merge.

Sugestões de nomes de branch:

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

Mudanças no frontend não devem ser mescladas se lint, typecheck, testes/cobertura ou build falharem.

### API Worker

```bash
cd backend/worker-prototype
npm ci
npm run typecheck
npm test
npm run dry-run
```

Mudanças na API não devem ser mescladas se os testes, o typecheck ou o dry-run falharem.

## Testes

Os dois componentes ativos possuem suíte automatizada e os testes devem crescer junto com o produto.

### Frontend

Ao alterar:

- cliente HTTP → teste status, headers, autenticação, erros e cancelamento quando aplicável;
- `services/` → valide rota, método, payload e parâmetros relevantes;
- autenticação no cliente → valide armazenamento e limpeza da sessão;
- componentes compartilhados → teste comportamento observável e acessibilidade, não classes CSS internas;
- normalização/formatação → mantenha casos de borda como testes de regressão.

Use Vitest + React Testing Library. O comando oficial do CI é `npm run test:coverage`, que também aplica os limites mínimos definidos em `vitest.config.mts`.

### API Worker

Ao alterar:

- matching/normalização de ingredientes → atualize testes de `recipe-utils`;
- autenticação/criptografia → atualize testes de `security`;
- rotas dos Workers → atualize `worker-routes.test.cjs` com o cenário afetado;
- acesso ao D1 → use o fake controlado para validar o contrato sem tocar em produção;
- comportamento que depende realmente da infraestrutura → considere uma camada de integração isolada em vez de usar recursos de produção em testes.

Evite testes que apenas reproduzam a implementação sem validar comportamento observável.

A estratégia completa está em [`docs/testes.md`](docs/testes.md).

## Banco de dados

- nunca reescreva uma migration já aplicada em produção;
- mudanças de schema devem entrar em uma nova migration;
- migrations ficam em `backend/worker-prototype/migrations/`;
- valide localmente antes de qualquer aplicação remota.

## Documentação

A documentação deve mudar junto com o código.

- objetivo/requisito → `docs/escopo.md`;
- funcionalidade → `docs/funcionalidades.md`;
- arquitetura → `docs/architecture.md`;
- rota → `docs/api.md`;
- schema → `docs/database.md`;
- catálogo/importação → `docs/catalogo.md`;
- estratégia/cobertura de testes → `docs/testes.md`;
- CI/deploy → `docs/deploy.md`;
- estrutura → `docs/estrutura-repositorio.md`.

## Segurança e secrets

Nunca versione:

- chaves de API;
- tokens Cloudflare/GitHub;
- senhas;
- tokens de sessão;
- códigos de recuperação;
- dados privados reais de usuários.

Use apenas placeholders seguros em arquivos `.env.example`.

Falhas de segurança devem seguir [`SECURITY.md`](SECURITY.md), e não ser publicadas com detalhes exploráveis em uma issue comum.

## Conteúdo e licenças

A licença MIT cobre o código e a documentação originais do projeto conforme descrito no repositório.

Receitas, textos, imagens e outros conteúdos de terceiros continuam sujeitos às licenças de suas fontes. Não remova metadados de autoria, procedência ou licença de conteúdo importado.

## Pull requests

Um PR deve explicar:

- qual problema resolve;
- o que mudou;
- como foi validado;
- quais testes foram adicionados ou atualizados;
- se altera banco, API, deploy ou documentação;
- riscos e passos adicionais, quando existirem.

Prefira PRs pequenos e revisáveis a mudanças muito grandes sem separação lógica.
