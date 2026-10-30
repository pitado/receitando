import assert from "node:assert/strict";
import test from "node:test";
import { convertSql } from "../src/lib/postgres-adapter.ts";

test("bound parameters do not rewrite literal question marks", () => {
  assert.deepEqual(convertSql("SELECT '?' AS literal, id FROM users WHERE id = ? -- ?", ["id-1"]), {
    text: "SELECT '?' AS literal, id FROM users WHERE id = $1 -- ?",
    values: ["id-1"],
  });
});
test("FTS5 prefix matches are converted into parameterized PostgreSQL tsquery", () => {
  const result = convertSql("SELECT id FROM recipe_search WHERE recipe_search MATCH ?", ['"banana"* AND "pao"*']);
  assert.match(result.text, /search_vector @@ to_tsquery/);
  assert.equal(result.values[0], "banana:* & pao:*");
});
test("SQLite INSERT OR IGNORE becomes PostgreSQL ON CONFLICT DO NOTHING", () => {
  const result = convertSql("INSERT OR IGNORE INTO favorites (user_id, recipe_id) VALUES (?, ?)", ["a", "b"]);
  assert.equal(result.text, "INSERT INTO favorites (user_id, recipe_id) VALUES ($1, $2) ON CONFLICT DO NOTHING");
});
test("mismatched binds fail instead of interpolating user input", () => {
  assert.throws(() => convertSql("SELECT ? + ?", [1]), /SQL bind mismatch/);
});
