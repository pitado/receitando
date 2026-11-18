# Execução de 18/11/2026 · ba09a81

Node 24.22.3. PostgreSQL 17.11 descartável em 127.0.0.1:55432, Worker em 8787 e Next em 3000. A fixture associava Banana a Bolo de banana. As duas contas eram sintéticas.

| Diretório | Comando | Resultado |
|---|---|---|
| frontend | npm ci | 747 pacotes instalados |
| frontend | npm run lint | Saída 0, ESLint com max-warnings=0 |
| frontend | npm run typecheck | Saída 0 |
| frontend | npm run test:coverage | 66/66 em 10 arquivos. Statements 91,34%, branches 81,15%, funções 98,70%, linhas 97,76%, no escopo configurado |
| frontend | npm run build | Saída 0, build Next 16.3.2 |
| backend/worker-prototype | npm ci | 59 pacotes instalados |
| backend/worker-prototype | npm run typecheck | Saída 0 |
| backend/worker-prototype | npm test | 72/72 |
| backend/worker-prototype | npm run test:postgres | 5/5 do adaptador; incluídos também na suíte backend |
| backend/worker-prototype | npm run test:ws | Troca bidirecional, reconexão e fechamento verificados em WebSocket local |
| backend/worker-prototype | npm run dry-run | Empacotamento Wrangler, saída 0 |
| backend/worker-prototype | npm run test:postgres:integration | Saída 0 com POSTGRES_TEST_URL local. Esquema, FTS, rollback e rotas em PostgreSQL real |

## Prova funcional suplementar

O navegador acessou o build Next em http://localhost:3000 e o Worker original, com binding Hyperdrive local apontando ao PostgreSQL descartável. A política connect-src em next.config.ts exigiu recompilar com NEXT_PUBLIC_API_URL=http://localhost:8787. O executor forneceu ao Wrangler a interface loopback para descoberta de rede. O cliente HTTP enviou requisições reais ao Worker. Nenhuma resposta da API foi interceptada nessas duas provas.

- Cadastro 201 e login 200 de duas contas com cookie de sessão.
- Despensa sem sessão: GET, POST e DELETE 401.
- CREATE/READ/UPDATE 200. Mesmo id, 1 linha, quantidade 1 → 3 e validade 2027-02-01.
- Conta B enviou DELETE do id de A e gravou o mesmo ingrediente. A manteve id e quantidade.
- Matching 200 incluiu Bolo de banana para o ingrediente Banana.
- DELETE próprio 200 e GET posterior vazio.
- Comentários: POST, GET público, PATCH e DELETE 200; edição lida em novo GET e exclusão confirmada; conta B 403, criação anônima 401.
- Chromium + Next + Worker + PostgreSQL: login, inclusão, edição 4 unidades, validade conservada após F5 e exclusão após F5.

A primeira tentativa com Chromium de desktop esbarrou na restrição de sockets Unix do executor. O ensaio final usou Chromium headless. Após F5, a quantidade e a unidade apareceram no controle de edição e a data permaneceu no campo. Após excluir e recarregar, a lista montou novamente sem o botão de remoção da Banana.

## Extrato do Worker local

Os IDs abaixo são de fixtures descartáveis.
    [wrangler:info] POST /api/auth/register 201 Created (31ms)
    [wrangler:info] POST /api/auth/login 200 OK (27ms)
    [wrangler:info] POST /api/auth/register 201 Created (22ms)
    [wrangler:info] POST /api/auth/login 200 OK (22ms)
    [wrangler:info] GET /api/pantry 401 Unauthorized (5ms)
    [wrangler:info] POST /api/pantry 401 Unauthorized (4ms)
    [wrangler:info] DELETE /api/pantry/unused 401 Unauthorized (4ms)
    [wrangler:info] POST /api/pantry 200 OK (9ms)
    [wrangler:info] POST /api/pantry 200 OK (9ms)
    [wrangler:info] GET /api/pantry 200 OK (6ms)
    [wrangler:info] DELETE /api/pantry/f877e7cf-42cb-4145-815e-2bbb6e4de0b6 200 OK (6ms)
    [wrangler:info] POST /api/pantry 200 OK (7ms)
    [wrangler:info] GET /api/pantry 200 OK (6ms)
    [wrangler:info] GET /api/recipes/match/pantry 200 OK (13ms)
    [wrangler:info] DELETE /api/pantry/f877e7cf-42cb-4145-815e-2bbb6e4de0b6 200 OK (6ms)
    [wrangler:info] GET /api/pantry 200 OK (5ms)
    [wrangler:info] POST /api/recipes/fixture-recipe/comments 200 OK (8ms)
    [wrangler:info] PATCH /api/recipe-comments/a4c2c7bd-8a6d-4e51-a9a7-82a3cdb8afe9 403 Forbidden (5ms)
    [wrangler:info] DELETE /api/recipe-comments/a4c2c7bd-8a6d-4e51-a9a7-82a3cdb8afe9 403 Forbidden (7ms)
    [wrangler:info] POST /api/recipes/fixture-recipe/comments 401 Unauthorized (5ms)
    [wrangler:info] PATCH /api/recipe-comments/a4c2c7bd-8a6d-4e51-a9a7-82a3cdb8afe9 200 OK (9ms)
    [wrangler:info] GET /api/recipes/fixture-recipe/comments 200 OK (6ms)
    [wrangler:info] DELETE /api/recipe-comments/a4c2c7bd-8a6d-4e51-a9a7-82a3cdb8afe9 200 OK (7ms)
    [wrangler:info] GET /api/recipes/fixture-recipe/comments 200 OK (6ms)
    [wrangler:info] GET /api/recipes/bolo-banana-test 200 OK (14ms)
    [wrangler:info] POST /api/auth/login 200 OK (24ms)
    [wrangler:info] GET /api/recipes/bolo-banana-test 200 OK (11ms)
    [wrangler:info] GET /api/pantry 200 OK (12ms)
    [wrangler:info] POST /api/pantry 200 OK (9ms)
    [wrangler:info] POST /api/pantry 200 OK (9ms)
    [wrangler:info] GET /api/pantry 200 OK (20ms)
    [wrangler:info] GET /api/recipes/bolo-banana-test 200 OK (8ms)
    [wrangler:info] DELETE /api/pantry/ec0163bd-70cb-44fa-8c4e-6b7182c3d533 200 OK (37ms)
    [wrangler:info] GET /api/recipes/match/pantry 200 OK (10ms)
    [wrangler:info] GET /api/pantry 200 OK (8ms)

## Limites da evidência

O teste PostgreSQL do repositório chama app-router diretamente e valida um token interno. O teste suplementar passou pelo entrypoint de sessão e usou cookies no transporte HTTP. O Playwright existente em frontend/e2e/tests/auth-pantry.spec.ts instala installApiMock. A suíte Playwright completa ficou sem execução nesta auditoria. O ciclo de comentários foi validado por HTTP; a operação visual no detalhe da receita segue para o ensaio da equipe.
