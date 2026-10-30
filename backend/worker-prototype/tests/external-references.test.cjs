const { test } = require("node:test");
const assert = require("node:assert/strict");

test("referências só aceitam links, sem fotografias ou textos copiados", async () => {
  const { validateReference, loadReferences } = await import("../scripts/import-external-references.mjs");
  const items = await loadReferences();
  assert.equal(items.length, 15);
  assert.equal(new Set(items.map((item) => item.url)).size, 15);
  assert.ok(items.every((item) => item.rights === "link_only"));
  assert.throws(() => validateReference({ ...items[0], imageUrl: "https://example.com/copyright.jpg" }), /Campo proibido/);
  assert.throws(() => validateReference({ ...items[0], instructions: "Copiar texto" }), /Campo proibido/);
  assert.throws(() => validateReference({ ...items[0], url: "https://example.com/recipe" }), /lista permitida/);
  assert.throws(() => validateReference({ ...items[0], rights: "public_domain" }), /não aprovados/);
});
