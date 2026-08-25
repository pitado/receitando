const test = require("node:test");
const assert = require("node:assert/strict");

const indexWorker = require("../.test-dist/index.js").default;
const pantryWorker = require("../.test-dist/pantry-worker.js").default;
const passwordResetWorker = require("../.test-dist/password-reset-worker.js").default;
const passwordResetValidationWorker = require("../.test-dist/password-reset-validation-worker.js").default;
const profileWorker = require("../.test-dist/profile-worker.js").default;
const socialWorker = require("../.test-dist/social-worker.js").default;
const catalogWorker = require("../.test-dist/catalog64-worker.js").default;
const homeWorker = require("../.test-dist/home-worker.js").default;

function normalizeSql(sql) {
  return sql.replace(/\s+/g, " ").trim();
}

function createDb(handler = async () => undefined) {
  const calls = [];

  return {
    calls,
    prepare(sql) {
      const normalized = normalizeSql(sql);
      let args = [];
      const statement = {
        bind(...values) {
          args = values;
          return statement;
        },
        async first() {
          calls.push({ op: "first", sql: normalized, args });
          const value = await handler({ op: "first", sql: normalized, args });
          return value ?? null;
        },
        async all() {
          calls.push({ op: "all", sql: normalized, args });
          const value = await handler({ op: "all", sql: normalized, args });
          return { results: value ?? [] };
        },
        async run() {
          calls.push({ op: "run", sql: normalized, args });
          const value = await handler({ op: "run", sql: normalized, args });
          return value ?? { success: true };
        },
      };
      return statement;
    },
    async batch(statements) {
      calls.push({ op: "batch", statements });
      return statements.map(() => ({ success: true }));
    },
  };
}

function env(db = createDb()) {
  return {
    db,
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

test("index expõe healthcheck com CORS apenas para origem permitida", async () => {
  const response = await indexWorker.fetch(
    request("/api/health", { headers: { Origin: "https://app.example.test" } }),
    env(),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await body(response), { status: "ok" });
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://app.example.test");
});

test("index valida cadastro antes de acessar o banco", async () => {
  const db = createDb(() => {
    throw new Error("o banco não deveria ser consultado");
  });
  const response = await indexWorker.fetch(
    request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "A", email: "invalido", password: "123" }),
    }),
    env(db),
  );

  assert.equal(response.status, 400);
  assert.equal((await body(response)).message, "Informe um nome válido.");
  assert.equal(db.calls.length, 0);
});

test("index cria usuário e sessão no fluxo de cadastro", async () => {
  const db = createDb(async ({ op, sql }) => {
    if (op === "first" && sql.includes("SELECT id FROM users WHERE email")) return null;
    return undefined;
  });

  const response = await indexWorker.fetch(
    request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Pessoa Teste",
        email: " PESSOA@EXAMPLE.COM ",
        password: "senha-segura-123",
      }),
    }),
    env(db),
  );
  const payload = await body(response);

  assert.equal(response.status, 201);
  assert.equal(payload.user.email, "pessoa@example.com");
  assert.equal(payload.user.role, "USER");
  assert.equal(typeof payload.token, "string");
  assert.ok(payload.token.length > 20);
  assert.ok(db.calls.some((call) => call.op === "run" && call.sql.startsWith("INSERT INTO users")));
  assert.ok(db.calls.some((call) => call.op === "run" && call.sql.startsWith("INSERT INTO sessions")));
});

test("pantry worker protege despensa, favoritos e matching da despensa", async () => {
  for (const path of ["/api/pantry", "/api/favorites", "/api/recipes/match/pantry"]) {
    const response = await pantryWorker.fetch(request(path), env());
    assert.equal(response.status, 401, path);
  }
});

test("pantry worker adiciona ingrediente autenticado e devolve a despensa atualizada", async () => {
  const pantryRow = {
    id: "pantry-1",
    quantity: 2,
    unit: "un",
    expiresAt: null,
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
    ingredientId: "ingredient-1",
    ingredientName: "Ovo",
    normalizedName: "ovo",
    category: "Proteínas",
  };
  const db = createDb(async ({ op, sql }) => {
    if (op === "first" && sql.includes("FROM sessions s JOIN users u")) {
      return { id: "user-1", name: "Pessoa", email: "pessoa@example.com", role: "USER" };
    }
    if (op === "first" && sql === "SELECT id FROM ingredients WHERE id = ? LIMIT 1") return { id: "ingredient-1" };
    if (op === "first" && sql.startsWith("SELECT id FROM pantry_items")) return null;
    if (op === "all" && sql.includes("FROM pantry_items p JOIN ingredients i")) return [pantryRow];
    return undefined;
  });

  const response = await pantryWorker.fetch(
    request("/api/pantry", {
      method: "POST",
      headers: {
        Authorization: "Bearer token-teste",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ingredientId: "ingredient-1", quantity: 2, unit: "un" }),
    }),
    env(db),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await body(response), [pantryRow]);
  assert.ok(db.calls.some((call) => call.op === "run" && call.sql.startsWith("INSERT INTO pantry_items")));
});

test("profile worker exige sessão para leitura e alteração", async () => {
  const getResponse = await profileWorker.fetch(request("/api/auth/me"), env());
  const patchResponse = await profileWorker.fetch(
    request("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Pessoa" }),
    }),
    env(),
  );

  assert.equal(getResponse.status, 401);
  assert.equal(patchResponse.status, 401);
});

test("profile worker valida e persiste perfil autenticado", async () => {
  const db = createDb(async ({ op, sql }) => {
    if (op === "first" && sql.includes("FROM sessions s JOIN users u")) {
      return {
        id: "user-1",
        name: "Pessoa Antiga",
        email: "pessoa@example.com",
        role: "USER",
        handle: "pessoa_antiga",
        avatarKey: "tomato",
      };
    }
    if (op === "first" && sql.startsWith("SELECT id FROM users WHERE handle")) return null;
    return undefined;
  });

  const response = await profileWorker.fetch(
    request("/api/auth/me", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer token-teste",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Pessoa Nova", handle: "@Pessoa_Nova", avatarKey: "lemon" }),
    }),
    env(db),
  );
  const payload = await body(response);

  assert.equal(response.status, 200);
  assert.equal(payload.name, "Pessoa Nova");
  assert.equal(payload.handle, "pessoa_nova");
  assert.equal(payload.avatarKey, "lemon");
  assert.ok(db.calls.some((call) => call.op === "run" && call.sql.startsWith("UPDATE users SET name")));
});

test("social worker protege voto e criação de comentário", async () => {
  const vote = await socialWorker.fetch(
    request("/api/recipes/recipe-1/vote", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote: "LIKE" }),
    }),
    env(),
  );
  const comment = await socialWorker.fetch(
    request("/api/recipes/recipe-1/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Muito boa" }),
    }),
    env(),
  );

  assert.equal(vote.status, 401);
  assert.equal(comment.status, 401);
});

test("social worker retorna 404 para resumo de receita inexistente", async () => {
  const db = createDb(async ({ op, sql }) => {
    if (op === "first" && sql === "SELECT id FROM recipes WHERE id = ? LIMIT 1") return null;
    return undefined;
  });
  const response = await socialWorker.fetch(request("/api/recipes/inexistente/social"), env(db));

  assert.equal(response.status, 404);
  assert.equal((await body(response)).message, "Receita não encontrada.");
});

test("password reset rejeita dados malformados antes de consultar o banco", async () => {
  const invalidCode = await passwordResetWorker.fetch(
    request("/api/auth/verify-reset-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetId: "reset-1", code: "123" }),
    }),
    env(),
  );
  const shortPassword = await passwordResetWorker.fetch(
    request("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetId: "reset-1", resetToken: "token", password: "curta" }),
    }),
    env(),
  );

  assert.equal(invalidCode.status, 400);
  assert.equal(shortPassword.status, 400);
});

test("validação de recuperação diferencia e-mail inválido de conta inexistente", async () => {
  const invalidEmail = await passwordResetValidationWorker.fetch(
    request("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalido" }),
    }),
    env(),
  );
  const db = createDb(async ({ op, sql }) => {
    if (op === "first" && sql === "SELECT id FROM users WHERE email = ? LIMIT 1") return null;
    return undefined;
  });
  const missingAccount = await passwordResetValidationWorker.fetch(
    request("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "naoexiste@example.com" }),
    }),
    env(db),
  );

  assert.equal(invalidEmail.status, 400);
  assert.equal(missingAccount.status, 404);
});

test("catalog worker publica fonte Wikilivros mesmo com catálogo vazio", async () => {
  const db = createDb(async ({ op, sql }) => {
    if (op === "all" && sql.includes("GROUP BY external_source")) return [];
    return undefined;
  });
  const response = await catalogWorker.fetch(request("/api/sources"), env(db));
  const payload = await body(response);

  assert.equal(response.status, 200);
  assert.equal(payload.length, 1);
  assert.equal(payload[0].id, "wikibooks");
  assert.equal(payload[0].license, "CC BY-SA 4.0");
  assert.equal(payload[0].recipeCount, 0);
});

test("catalog worker valida matching e protege matching da despensa", async () => {
  const invalid = await catalogWorker.fetch(
    request("/api/recipes/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: [] }),
    }),
    env(),
  );
  const pantryMatch = await catalogWorker.fetch(request("/api/recipes/match/pantry"), env());

  assert.equal(invalid.status, 400);
  assert.equal(pantryMatch.status, 401);
});

test("home worker monta feed e totais com resultados do D1", async () => {
  const popular = {
    id: "recipe-1",
    title: "Bolo",
    slug: "bolo",
    description: "Bolo teste",
    prepMinutes: 30,
    servings: 8,
    mealType: "Sobremesa",
    difficulty: "FACIL",
    likes: 3,
    favorites: 2,
    comments: 1,
  };
  const db = createDb(async ({ op, sql }) => {
    if (op === "all" && sql.includes("FROM recipes r LEFT JOIN")) return [popular];
    if (op === "all" && sql.includes("FROM recipe_comments c JOIN recipes r")) return [];
    if (op === "first" && sql === "SELECT COUNT(*) AS total FROM recipes") return { total: 12 };
    if (op === "first" && sql === "SELECT COUNT(*) AS total FROM recipe_comments") return { total: 5 };
    if (op === "first" && sql === "SELECT COUNT(*) AS total FROM recipe_votes WHERE vote = 'LIKE'") return { total: 9 };
    return undefined;
  });

  const response = await homeWorker.fetch(request("/api/home-feed"), env(db));
  const payload = await body(response);

  assert.equal(response.status, 200);
  assert.deepEqual(payload.popular, [popular]);
  assert.deepEqual(payload.totals, { recipes: 12, comments: 5, likes: 9 });
});

test("entrypoint da home delega rotas não próprias até o healthcheck base", async () => {
  const response = await homeWorker.fetch(request("/api/health"), env());
  assert.equal(response.status, 200);
  assert.deepEqual(await body(response), { status: "ok" });
});
