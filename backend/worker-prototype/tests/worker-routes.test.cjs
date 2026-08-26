const test = require("node:test");
const assert = require("node:assert/strict");

const entryWorker = require("../.test-dist/auth-rate-limit-worker.js").default;
const indexWorker = require("../.test-dist/index.js").default;
const pantryWorker = require("../.test-dist/pantry-worker.js").default;
const passwordResetWorker = require("../.test-dist/password-reset-worker.js").default;
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

test("entrypoint real delega até o healthcheck base", async () => {
  const response = await entryWorker.fetch(
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

test("index cria usuário e sessão no cadastro", async () => {
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
  assert.ok(db.calls.some((call) => call.op === "run" && call.sql.startsWith("INSERT INTO users")));
  assert.ok(db.calls.some((call) => call.op === "run" && call.sql.startsWith("INSERT INTO sessions")));
});

test("index não mantém mais rotas duplicadas de catálogo", async () => {
  const response = await indexWorker.fetch(request("/api/recipes"), env());
  assert.equal(response.status, 404);
});

test("pantry worker protege e persiste a despensa", async () => {
  const unauthorized = await pantryWorker.fetch(request("/api/pantry"), env());
  assert.equal(unauthorized.status, 401);

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

test("catalog worker é o único dono das rotas de receitas e limita matching a 40 itens", async () => {
  const tooMany = Array.from({ length: 41 }, (_, index) => `ingrediente-${index}`);
  const response = await catalogWorker.fetch(
    request("/api/recipes/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: tooMany }),
    }),
    env(),
  );

  assert.equal(response.status, 400);
  assert.equal((await body(response)).message, "Informe entre 1 e 40 ingredientes.");
});

test("rota social GET não é interceptada pelo detalhe por slug", async () => {
  const db = createDb(async ({ op, sql }) => {
    if (sql.includes("WHERE slug = ?")) {
      throw new Error("a rota social não pode cair no detalhe por slug");
    }
    if (op === "first" && sql === "SELECT id FROM recipes WHERE id = ? LIMIT 1") {
      return { id: "recipe-1" };
    }
    if (op === "first" && sql.includes("FROM recipe_votes WHERE recipe_id")) {
      return { likes: 2, dislikes: 1 };
    }
    return undefined;
  });

  const response = await catalogWorker.fetch(request("/api/recipes/recipe-1/social"), env(db));
  assert.equal(response.status, 200);
  assert.deepEqual(await body(response), { likes: 2, dislikes: 1, myVote: null });
});

test("rota de comentários GET também atravessa o catálogo até o worker social", async () => {
  const db = createDb(async ({ op, sql }) => {
    if (sql.includes("WHERE slug = ?")) {
      throw new Error("comentários não podem cair no detalhe por slug");
    }
    if (op === "first" && sql === "SELECT id FROM recipes WHERE id = ? LIMIT 1") {
      return { id: "recipe-1" };
    }
    if (op === "all" && sql.includes("FROM recipe_comments c JOIN users u")) return [];
    return undefined;
  });

  const response = await catalogWorker.fetch(request("/api/recipes/recipe-1/comments"), env(db));
  assert.equal(response.status, 200);
  assert.deepEqual(await body(response), []);
});

test("detalhe da receita expõe atribuição completa da imagem", async () => {
  const db = createDb(async ({ op, sql }) => {
    if (op === "first" && sql === "SELECT id FROM recipes WHERE slug = ? LIMIT 1") {
      return { id: "recipe-1" };
    }
    if (op === "all" && sql.startsWith("SELECT id, title, slug")) {
      return [{
        id: "recipe-1",
        title: "Bolo",
        slug: "bolo",
        description: "Teste",
        instructions: "Misture tudo",
        prepMinutes: 20,
        servings: 4,
        mealType: "Sobremesa",
        difficulty: "FACIL",
        sourceType: "OPEN_DATASET",
        sourceName: "Wikilivros",
        sourceUrl: "https://pt.wikibooks.org/wiki/Bolo",
        sourceAuthor: "Wikilivros",
        sourceLicense: "CC BY-SA 4.0",
        sourceLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        sourceLanguage: "pt-BR",
        externalSource: "wikibooks",
        imageUrl: "https://upload.wikimedia.org/bolo.jpg",
        imageSource: "Wikimedia Commons",
        imageAuthor: "Autor da foto",
        imagePageUrl: "https://commons.wikimedia.org/wiki/File:Bolo.jpg",
        imageLicense: "CC BY-SA 4.0",
        imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        imageAlt: "Bolo sobre uma mesa",
      }];
    }
    if (op === "all" && sql.includes("FROM recipe_ingredients ri")) return [];
    if (op === "all" && sql.includes("FROM recipe_tags")) return [];
    return undefined;
  });

  const response = await catalogWorker.fetch(request("/api/recipes/bolo"), env(db));
  const payload = await body(response);

  assert.equal(response.status, 200);
  assert.equal(payload.image.author, "Autor da foto");
  assert.equal(payload.image.source, "Wikimedia Commons");
  assert.equal(payload.image.license, "CC BY-SA 4.0");
  assert.equal(payload.image.alt, "Bolo sobre uma mesa");
});

test("favoritos são protegidos pela camada canônica do catálogo", async () => {
  for (const init of [
    {},
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipeId: "recipe-1" }) },
    { method: "DELETE" },
  ]) {
    const path = init.method === "DELETE" ? "/api/favorites/recipe-1" : "/api/favorites";
    const response = await catalogWorker.fetch(request(path, init), env());
    assert.equal(response.status, 401);
  }
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

test("recuperação não enumera e-mail inexistente", async () => {
  const db = createDb(async ({ op, sql }) => {
    if (op === "first" && sql === "SELECT id, email FROM users WHERE email = ? LIMIT 1") return null;
    return undefined;
  });

  const response = await passwordResetWorker.fetch(
    request("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "naoexiste@example.com" }),
    }),
    env(db),
  );
  const payload = await body(response);

  assert.equal(response.status, 200);
  assert.equal(payload.message, "Se este e-mail estiver cadastrado, você receberá um código de recuperação.");
  assert.equal(typeof payload.resetId, "string");
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
