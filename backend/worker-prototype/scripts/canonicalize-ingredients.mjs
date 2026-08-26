import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const STAPLES = new Set([
  "agua",
  "sal",
  "pimenta",
  "pimenta do reino",
  "oleo",
  "oleo vegetal",
  "oleo de cozinha",
]);

const IRREGULAR_SINGULARS = new Map([
  ["ovos", "ovo"],
  ["cebolas", "cebola"],
  ["tomates", "tomate"],
  ["batatas", "batata"],
  ["cenouras", "cenoura"],
  ["bananas", "banana"],
  ["macas", "maca"],
  ["laranjas", "laranja"],
  ["limoes", "limao"],
  ["pimentas", "pimenta"],
]);

const PREPARATION_SUFFIXES = [
  /\s+(?:picad[oa]s?|cortad[oa]s?|ralad[oa]s?|fatiad[oa]s?|amassad[oa]s?|cozid[oa]s?|descascad[oa]s?)$/,
  /\s+(?:pequen[oa]s?|medi[oa]s?|grandes?)$/,
  /\s+(?:em\s+)?(?:cubos?|rodelas?|fatias?|pedacos?)$/,
  /\s+a\s+gosto$/,
];

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/[^a-z0-9()\s/.,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularizeHead(value) {
  const [head, ...tail] = value.split(" ");
  if (!head) return value;
  const irregular = IRREGULAR_SINGULARS.get(head);
  if (irregular) return [irregular, ...tail].join(" ");
  if (head.length > 4 && head.endsWith("oes")) return [`${head.slice(0, -3)}ao`, ...tail].join(" ");
  if (head.length > 4 && head.endsWith("ais")) return [`${head.slice(0, -3)}al`, ...tail].join(" ");
  if (head.length > 4 && head.endsWith("eis")) return [`${head.slice(0, -3)}el`, ...tail].join(" ");
  if (head.length > 4 && /[aeiou]s$/.test(head)) return [head.slice(0, -1), ...tail].join(" ");
  return value;
}

function canonicalKey(value) {
  let result = normalize(value)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let changed = true;
  while (changed && result) {
    const before = result;
    for (const suffix of PREPARATION_SUFFIXES) result = result.replace(suffix, "").trim();
    changed = result !== before;
  }
  return singularizeHead(result);
}

function canonicalDisplayName(value, key) {
  let result = String(value ?? "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const suffixes = [
    /\s+(?:picad[oa]s?|cortad[oa]s?|ralad[oa]s?|fatiad[oa]s?|amassad[oa]s?|cozid[oa]s?|descascad[oa]s?)$/i,
    /\s+(?:pequen[oa]s?|médi[oa]s?|medi[oa]s?|grandes?)$/i,
    /\s+(?:em\s+)?(?:cubos?|rodelas?|fatias?|pedaços?|pedacos?)$/i,
    /\s+a\s+gosto$/i,
  ];
  let changed = true;
  while (changed && result) {
    const before = result;
    for (const suffix of suffixes) result = result.replace(suffix, "").trim();
    changed = result !== before;
  }

  const words = result.split(" ");
  const headNormalized = normalize(words[0] ?? "");
  const singular = IRREGULAR_SINGULARS.get(headNormalized);
  if (singular && words.length) {
    const displayMap = {
      ovo: "ovo",
      cebola: "cebola",
      tomate: "tomate",
      batata: "batata",
      cenoura: "cenoura",
      banana: "banana",
      maca: "maçã",
      laranja: "laranja",
      limao: "limão",
      pimenta: "pimenta",
    };
    words[0] = displayMap[singular] ?? singular;
    result = words.join(" ");
  }

  return result || key;
}

function shortHash(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 16);
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function queryRows() {
  const command = [
    "wrangler",
    "d1",
    "execute",
    "receitando",
    "--remote",
    "--command=SELECT id, name, normalized_name AS normalizedName, category FROM ingredients ORDER BY normalized_name;",
    "--json",
  ];
  const output = execFileSync("npx", command, { encoding: "utf8", env: process.env });
  const payload = JSON.parse(output);
  const entries = Array.isArray(payload) ? payload : [payload];
  return entries.flatMap((entry) => entry?.results ?? entry?.result?.results ?? []);
}

function executeSql(statements) {
  if (!statements.length) return;
  const file = join(tmpdir(), `receitando-canonical-${Date.now()}.sql`);
  writeFileSync(file, statements.join("\n\n"), "utf8");
  execFileSync(
    "npx",
    ["wrangler", "d1", "execute", "receitando", "--remote", `--file=${file}`, "--yes"],
    { stdio: "inherit", env: process.env },
  );
}

function main() {
  const rows = queryRows();
  if (!rows.length) {
    console.log("Nenhum ingrediente encontrado para canonicalizar.");
    return;
  }

  const canonicalTargets = new Map();
  for (const row of rows) {
    const key = canonicalKey(row.normalizedName || row.name);
    if (key && normalize(row.normalizedName) === key && !canonicalTargets.has(key)) {
      canonicalTargets.set(key, row);
    }
  }

  const statements = ["PRAGMA foreign_keys = ON;"];
  let redirected = 0;
  let created = 0;

  for (const row of rows) {
    const currentNormalized = normalize(row.normalizedName || row.name);
    const key = canonicalKey(currentNormalized);
    if (!key) continue;

    let target = canonicalTargets.get(key);
    if (!target) {
      const id = `canon-ing-${shortHash(key)}`;
      const name = canonicalDisplayName(row.name, key).slice(0, 120);
      const staple = STAPLES.has(key) ? 1 : 0;
      statements.push(`INSERT OR IGNORE INTO ingredients
        (id, name, normalized_name, category, is_staple, created_at, updated_at)
        VALUES (${sql(id)}, ${sql(name)}, ${sql(key)}, ${sql(row.category || "outros")}, ${staple}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
      target = { id, name, normalizedName: key, category: row.category || "outros" };
      canonicalTargets.set(key, target);
      created += 1;
    }

    statements.push(`UPDATE ingredients SET is_staple = ${STAPLES.has(key) ? 1 : 0} WHERE id = ${sql(target.id)};`);

    const aliasNormalized = currentNormalized;
    if (aliasNormalized && aliasNormalized !== key) {
      statements.push(`INSERT INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias, created_at)
        VALUES (${sql(`canon-alias-${shortHash(`${target.id}:${aliasNormalized}`)}`)}, ${sql(target.id)}, ${sql(row.name)}, ${sql(aliasNormalized)}, CURRENT_TIMESTAMP)
        ON CONFLICT(normalized_alias) DO UPDATE SET ingredient_id = excluded.ingredient_id, alias = excluded.alias;`);
    }

    if (row.id === target.id) continue;

    statements.push(`DELETE FROM recipe_ingredients
      WHERE ingredient_id = ${sql(row.id)}
        AND EXISTS (
          SELECT 1 FROM recipe_ingredients keep
          WHERE keep.recipe_id = recipe_ingredients.recipe_id
            AND keep.ingredient_id = ${sql(target.id)}
        );`);
    statements.push(`UPDATE recipe_ingredients SET ingredient_id = ${sql(target.id)} WHERE ingredient_id = ${sql(row.id)};`);

    statements.push(`DELETE FROM pantry_items
      WHERE ingredient_id = ${sql(row.id)}
        AND EXISTS (
          SELECT 1 FROM pantry_items keep
          WHERE keep.user_id = pantry_items.user_id
            AND keep.ingredient_id = ${sql(target.id)}
        );`);
    statements.push(`UPDATE pantry_items SET ingredient_id = ${sql(target.id)} WHERE ingredient_id = ${sql(row.id)};`);

    statements.push(`UPDATE ingredient_aliases SET ingredient_id = ${sql(target.id)} WHERE ingredient_id = ${sql(row.id)};`);
    statements.push(`DELETE FROM ingredients WHERE id = ${sql(row.id)};`);
    redirected += 1;
  }

  statements.push("PRAGMA optimize;");
  executeSql(statements);
  console.log(`Canonicalização concluída: ${created} bases criadas, ${redirected} variações redirecionadas.`);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
