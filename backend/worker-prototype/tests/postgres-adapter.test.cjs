const test = require("node:test");
const assert = require("node:assert/strict");
const { convertSql } = require("../.test-dist/lib/postgres-adapter.js");

test("parameter placeholders do not rewrite SQL strings and comments", () => {
  assert.deepEqual(convertSql("SELECT '?' AS literal, id FROM users WHERE id = ? -- ?", ["id-1"]), {
    text: "SELECT '?' AS literal, id FROM users WHERE id = $1 -- ?",
    values: ["id-1"],
  });
});
test("FTS5 prefix search uses PostgreSQL tsquery", () => {
  const result = convertSql("SELECT id FROM recipe_search WHERE recipe_search MATCH ?", ['"banana"* AND "pao"*']);
  assert.match(result.text, /search_vector @@ to_tsquery/);
  assert.equal(result.values[0], "banana:* & pao:*");
});
test("SQLite INSERT OR IGNORE maps to ON CONFLICT DO NOTHING", () => {
  const result = convertSql("INSERT OR IGNORE INTO favorites (user_id, recipe_id) VALUES (?, ?)", ["a", "b"]);
  assert.equal(result.text, "INSERT INTO favorites (user_id, recipe_id) VALUES ($1, $2) ON CONFLICT DO NOTHING");
});
test("mismatched bind count fails safely", () => {
  assert.throws(() => convertSql("SELECT ? + ?", [1]), /SQL bind mismatch/);
});

test("preserves SQLite camelCase projection aliases in PostgreSQL rows", () => {
  const result = convertSql("SELECT user_id AS userId, recipe_id AS recipeId, COUNT(*) AS total FROM favorites WHERE user_id = ?", ["u"]);
  assert.equal(result.text, 'SELECT user_id AS "userId", recipe_id AS "recipeId", COUNT(*) AS total FROM favorites WHERE user_id = $1');
});
