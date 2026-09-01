const assert = require("node:assert/strict");
const test = require("node:test");

const worker = require("../.test-dist/recipe-submission-worker.js").default;

function createDb() {
  const writes = [];
  return {
    writes,
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async run() {
              writes.push({ sql, values });
              return { success: true };
            },
            async first() {
              return null;
            },
          };
        },
      };
    },
  };
}

function createBucket() {
  const objects = new Map();
  return {
    objects,
    async put(key, value, options) {
      const response = new Response(value);
      objects.set(key, {
        body: await response.arrayBuffer(),
        httpMetadata: options?.httpMetadata ?? {},
        httpEtag: '"test-etag"',
      });
    },
    async get(key) {
      const stored = objects.get(key);
      if (!stored) return null;
      return {
        body: new Blob([stored.body]).stream(),
        httpMetadata: stored.httpMetadata,
        httpEtag: stored.httpEtag,
      };
    },
    async delete(key) {
      objects.delete(key);
    },
  };
}

function jpegFile() {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43])], "prato.jpg", {
    type: "image/jpeg",
  });
}

test("salva foto da receita no R2 e registra a URL no D1", async () => {
  const db = createDb();
  const bucket = createBucket();
  const form = new FormData();
  form.set("authorName", "Maria");
  form.set("title", "Bolo de banana");
  form.set("description", "Receita simples para o café da tarde.");
  form.append("ingredients", "2 bananas");
  form.append("ingredients", "2 ovos");
  form.append("instructions", "Misture tudo");
  form.set("difficulty", "FACIL");
  form.set("image", jpegFile());

  const request = new Request("https://api.receitando.miguelpita.com.br/api/recipe-submissions", {
    method: "POST",
    headers: { Origin: "https://receitando.miguelpita.com.br" },
    body: form,
  });
  const response = await worker.fetch(request, {
    db,
    FRONTEND_URL: "https://receitando.miguelpita.com.br",
    RECIPE_IMAGES: bucket,
  });

  assert.equal(response.status, 201);
  assert.equal(bucket.objects.size, 1);
  assert.equal(db.writes.length, 1);
  const imageUrl = db.writes[0].values[12];
  assert.match(imageUrl, /^https:\/\/api\.receitando\.miguelpita\.com\.br\/api\/recipe-submission-images\/submissions\//);
});

test("rejeita arquivo que não é uma imagem suportada", async () => {
  const db = createDb();
  const bucket = createBucket();
  const form = new FormData();
  form.set("authorName", "Maria");
  form.set("title", "Receita teste");
  form.set("description", "Descrição suficientemente longa.");
  form.append("ingredients", "ingrediente um");
  form.append("ingredients", "ingrediente dois");
  form.append("instructions", "Faça a receita");
  form.set("image", new File(["not-image"], "arquivo.jpg", { type: "image/jpeg" }));

  const request = new Request("https://api.receitando.miguelpita.com.br/api/recipe-submissions", {
    method: "POST",
    body: form,
  });
  const response = await worker.fetch(request, {
    db,
    FRONTEND_URL: "https://receitando.miguelpita.com.br",
    RECIPE_IMAGES: bucket,
  });

  assert.equal(response.status, 400);
  assert.equal(bucket.objects.size, 0);
  assert.equal(db.writes.length, 0);
});
