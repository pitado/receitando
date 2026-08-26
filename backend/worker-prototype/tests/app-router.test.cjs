const test = require("node:test");
const assert = require("node:assert/strict");

const appRouter = require("../.test-dist/app-router.js").default;

function createDb() {
  return {
    prepare() {
      throw new Error("o banco não deveria ser acessado neste teste");
    },
  };
}

function env() {
  return {
    db: createDb(),
    FRONTEND_URL: "https://app.example.test,http://localhost:3000",
    RESEND_API_KEY: "",
    EMAIL_FROM: "",
  };
}

function request(path, init = {}) {
  return new Request(`https://api.example.test${path}`, init);
}

async function body(response) {
  return response.status === 204 ? undefined : response.json();
}

test("roteador central envia healthcheck direto ao worker base", async () => {
  const response = await appRouter.fetch(request("/api/health"), env());
  assert.equal(response.status, 200);
  assert.deepEqual(await body(response), { status: "ok" });
});

test("roteador central envia perfil direto ao worker de perfil", async () => {
  const response = await appRouter.fetch(request("/api/auth/me"), env());
  assert.equal(response.status, 401);
});

test("roteador central envia despensa direto ao worker da despensa", async () => {
  const response = await appRouter.fetch(request("/api/pantry"), env());
  assert.equal(response.status, 401);
});

test("roteador central envia matching ao catálogo e preserva limite de 40 itens", async () => {
  const ingredients = Array.from({ length: 41 }, (_, index) => `ingrediente-${index}`);
  const response = await appRouter.fetch(
    request("/api/recipes/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients }),
    }),
    env(),
  );

  assert.equal(response.status, 400);
  assert.equal((await body(response)).message, "Informe entre 1 e 40 ingredientes.");
});

test("roteador central envia matching da despensa ao catálogo", async () => {
  const response = await appRouter.fetch(request("/api/recipes/match/pantry"), env());
  assert.equal(response.status, 401);
});

test("roteador central prioriza rotas sociais antes do detalhe de receita", async () => {
  const response = await appRouter.fetch(
    request("/api/recipes/recipe-1/vote", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote: "LIKE" }),
    }),
    env(),
  );

  assert.equal(response.status, 401);
});

test("roteador central mantém login sob rate limiting", async () => {
  const response = await appRouter.fetch(
    request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),
    env(),
  );

  assert.equal(response.status, 400);
  assert.equal((await body(response)).message, "Informe e-mail e senha.");
});

test("rota desconhecida termina no handler base com 404", async () => {
  const response = await appRouter.fetch(request("/api/nao-existe"), env());
  assert.equal(response.status, 404);
});
