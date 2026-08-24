import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const API_URL = "https://pt.wikibooks.org/w/api.php";
const SOURCE_NAME = "Wikilivros";
const SOURCE_ID = "wikibooks";
const SOURCE_LICENSE = "CC BY-SA 4.0";
const SOURCE_LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/";

const ALLOWED_CATEGORIES = new Map([
  ["Doces", "sobremesa"],
  ["Entradas", "entrada"],
  ["Massas", "almoco-jantar"],
  ["Quitandas", "lanche"],
  ["Salgados, Lanches e Sanduíches", "lanche"],
  ["Sobremesas", "sobremesa"],
]);

function args() {
  const values = process.argv.slice(2);
  const result = { category: "Salgados, Lanches e Sanduíches", limit: 12 };
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === "--category" && values[index + 1]) result.category = values[++index];
    if (values[index] === "--limit" && values[index + 1]) result.limit = Number(values[++index]);
  }
  result.limit = Math.max(1, Math.min(50, Number.isFinite(result.limit) ? result.limit : 12));
  if (!ALLOWED_CATEGORIES.has(result.category)) {
    throw new Error(`Categoria não permitida: ${result.category}. Use uma destas: ${[...ALLOWED_CATEGORIES.keys()].join(", ")}`);
  }
  return result;
}

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, "-").slice(0, 100);
}

function shortHash(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 16);
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function cleanWiki(value) {
  return value
    .replace(/<!--.*?-->/g, "")
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<ref\b[^/>]*\/>/gi, "")
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, "$1")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/''+/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isRecipeHeading(value) {
  const normalized = normalize(value);
  return /^receita(?:\s+\d+)?$/.test(normalized) || /\s[-–—]\s*\d+$/.test(value);
}

function parseRecipe(wikitext) {
  const lines = wikitext.replace(/\r/g, "").split("\n");
  const ingredients = [];
  const steps = [];
  let mode = null;
  let started = false;

  for (const originalLine of lines) {
    const headingMatch = originalLine.match(/^={2,6}\s*(.*?)\s*=+\s*$/);
    if (headingMatch) {
      const heading = cleanWiki(headingMatch[1]);
      const normalizedHeading = normalize(heading);

      if (started && ingredients.length >= 3 && steps.length >= 2 && isRecipeHeading(heading)) break;
      if (normalizedHeading.includes("ingrediente")) {
        if (started && ingredients.length >= 3 && steps.length >= 2) break;
        mode = "ingredients";
        started = true;
        continue;
      }
      if (normalizedHeading.includes("preparo") || normalizedHeading.includes("modo de preparar") || normalizedHeading.includes("modo de preparo")) {
        mode = "steps";
        started = true;
        continue;
      }
      if (started && ingredients.length >= 3 && steps.length >= 2) break;
      continue;
    }

    const cleanedLine = cleanWiki(originalLine.replace(/^[:;]+/, "").trim());
    if (mode === "ingredients" && /^preparo\s*:?$/i.test(cleanedLine)) {
      mode = "steps";
      continue;
    }

    if (mode === "ingredients" && /^\*+/.test(originalLine.trim())) {
      const item = cleanWiki(originalLine.trim().replace(/^\*+\s*/, "")).replace(/[;,.]+$/, "").trim();
      if (item && !/^preparo\s*:?$/i.test(item)) ingredients.push(item);
      continue;
    }

    if (mode === "steps" && /^(?:#+|\*#+)/.test(originalLine.trim())) {
      const item = cleanWiki(originalLine.trim().replace(/^(?:#+|\*#+)\s*/, "")).replace(/^\d+[.)]\s*/, "").trim();
      if (item) steps.push(item);
      continue;
    }

    if (mode === "steps" && cleanedLine && !cleanedLine.startsWith("[[Categoria:") && !cleanedLine.startsWith("Categoria:")) {
      if (!/^\{\|/.test(originalLine.trim()) && !/^\|/.test(originalLine.trim())) steps.push(cleanedLine);
    }
  }

  const uniqueIngredients = [...new Set(ingredients)].slice(0, 40);
  const uniqueSteps = [...new Set(steps)].slice(0, 30);
  if (uniqueIngredients.length < 3 || uniqueSteps.length < 2) return null;
  return { ingredients: uniqueIngredients, steps: uniqueSteps };
}

function ingredientName(raw) {
  let value = raw
    .replace(/^\s*(?:\d+(?:[.,]\d+)?(?:\s+e\s+\d+\/\d+)?|\d+\/\d+|uma?|duas?|meia?)\s+/i, "")
    .replace(/^\s*(?:kg|g|gramas?|quilogramas?|litros?|ml|mililitros?|x[ií]caras?(?:\s*\([^)]*\))?|chávenas?|copos?(?:\s*\([^)]*\))?|colheres?(?:\s*\([^)]*\))?|latas?|pacotes?|vidros?|dentes?|unidades?|tabletes?|envelopes?|pitadas?)\s+(?:de\s+)?/i, "")
    .replace(/^\s*de\s+/i, "")
    .replace(/\s*[;,.]+$/, "")
    .trim();

  value = value.replace(/\s*\([^)]*(?:picad|cortad|ralad|cozid|fatiad|amassad)[^)]*\)\s*/gi, " ").trim();
  if (!value || value.length < 2) value = raw;
  return value.slice(0, 120);
}

async function mediaWiki(params) {
  const url = new URL(API_URL);
  for (const [key, value] of Object.entries({ ...params, format: "json", formatversion: "2", origin: "*" })) {
    url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    headers: { "User-Agent": "ReceitandoAcademic/0.1 (https://receitando.miguelpita.com.br/)" },
  });
  if (!response.ok) throw new Error(`Wikilivros respondeu ${response.status}`);
  return response.json();
}

async function categoryMembers(category, desired) {
  const members = [];
  let cmcontinue;
  const target = Math.min(200, Math.max(desired * 4, 40));
  while (members.length < target) {
    const payload = await mediaWiki({
      action: "query",
      list: "categorymembers",
      cmtitle: `Categoria:${category}`,
      cmnamespace: "0",
      cmtype: "page",
      cmlimit: "50",
      ...(cmcontinue ? { cmcontinue } : {}),
    });
    members.push(...(payload?.query?.categorymembers ?? []));
    cmcontinue = payload?.continue?.cmcontinue;
    if (!cmcontinue) break;
  }
  return members.filter((page) => typeof page.title === "string" && page.title.startsWith("Livro de receitas/"));
}

async function pageSource(title) {
  const payload = await mediaWiki({ action: "parse", page: title, prop: "wikitext|categories" });
  const raw = payload?.parse?.wikitext;
  const wikitext = typeof raw === "string" ? raw : raw?.["*"];
  if (typeof wikitext !== "string") return null;
  return { wikitext };
}

function recipeSql(recipe, category) {
  const id = `wikibooks-${recipe.pageid}`;
  const title = recipe.title.replace(/^Livro de receitas\//, "").trim();
  const slug = `${slugify(title)}-wikilivros`;
  const encodedTitle = recipe.title.replaceAll(" ", "_").split("/").map((part) => encodeURIComponent(part)).join("/");
  const sourceUrl = `https://pt.wikibooks.org/wiki/${encodedTitle}`;
  const mealType = ALLOWED_CATEGORIES.get(category) ?? "outros";
  const now = new Date().toISOString();
  const description = `Receita publicada no Wikilivros em português.`;
  const statements = [];

  statements.push(`INSERT INTO recipes (
    id, title, slug, description, instructions, prep_minutes, servings,
    meal_type, difficulty, source_type, source_name, image_url,
    external_source, external_id, external_category, external_subcategory,
    source_url, source_author, source_license, source_license_url, source_language, imported_at,
    created_at, updated_at
  ) VALUES (
    ${sql(id)}, ${sql(title)}, ${sql(slug)}, ${sql(description)}, ${sql(recipe.steps.join("\n"))}, 0, 0,
    ${sql(mealType)}, 'FACIL', 'OPEN_DATASET', ${sql(SOURCE_NAME)}, NULL,
    ${sql(SOURCE_ID)}, ${sql(String(recipe.pageid))}, ${sql(category)}, NULL,
    ${sql(sourceUrl)}, ${sql("Colaboradores do Wikilivros")}, ${sql(SOURCE_LICENSE)}, ${sql(SOURCE_LICENSE_URL)}, 'pt-BR', ${sql(now)},
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ) ON CONFLICT(id) DO UPDATE SET
    title = excluded.title,
    slug = excluded.slug,
    description = excluded.description,
    instructions = excluded.instructions,
    meal_type = excluded.meal_type,
    source_name = excluded.source_name,
    external_source = excluded.external_source,
    external_id = excluded.external_id,
    external_category = excluded.external_category,
    source_url = excluded.source_url,
    source_author = excluded.source_author,
    source_license = excluded.source_license,
    source_license_url = excluded.source_license_url,
    source_language = excluded.source_language,
    imported_at = excluded.imported_at,
    updated_at = CURRENT_TIMESTAMP;`);

  statements.push(`DELETE FROM recipe_ingredients WHERE recipe_id = ${sql(id)};`);
  statements.push(`DELETE FROM recipe_tags WHERE recipe_id = ${sql(id)};`);

  for (const rawText of recipe.ingredients) {
    const name = ingredientName(rawText);
    const normalizedName = normalize(name);
    if (!normalizedName) continue;
    const fallbackIngredientId = `ext-ing-${shortHash(normalizedName)}`;
    const recipeIngredientId = `wikibooks-ri-${recipe.pageid}-${shortHash(normalizedName)}`;
    statements.push(`INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category, created_at, updated_at)
      VALUES (${sql(fallbackIngredientId)}, ${sql(name)}, ${sql(normalizedName)}, 'outros', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
    statements.push(`INSERT OR REPLACE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional, raw_text)
      SELECT ${sql(recipeIngredientId)}, ${sql(id)}, id, NULL, NULL, 0, ${sql(rawText)}
      FROM ingredients WHERE normalized_name = ${sql(normalizedName)} LIMIT 1;`);
  }

  statements.push(`INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES (${sql(id)}, 'wikilivros');`);
  statements.push(`INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES (${sql(id)}, ${sql(slugify(category))});`);
  return statements.join("\n");
}

async function main() {
  const { category, limit } = args();
  console.log(`Buscando até ${limit} receitas válidas em “${category}”...`);
  const members = await categoryMembers(category, limit);
  const recipes = [];

  for (const member of members) {
    if (recipes.length >= limit) break;
    try {
      const page = await pageSource(member.title);
      if (!page) continue;
      const parsed = parseRecipe(page.wikitext);
      if (!parsed) continue;
      recipes.push({ ...member, ...parsed });
      console.log(`  ✓ ${member.title.replace(/^Livro de receitas\//, "")}`);
    } catch (error) {
      console.warn(`  - ignorada ${member.title}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (!recipes.length) throw new Error("Nenhuma receita com estrutura suficiente foi encontrada.");

  const sqlText = [
    "PRAGMA foreign_keys = ON;",
    ...recipes.map((recipe) => recipeSql(recipe, category)),
  ].join("\n\n");

  const file = join(tmpdir(), `receitando-wikibooks-${Date.now()}.sql`);
  writeFileSync(file, sqlText, "utf8");
  console.log(`Importando ${recipes.length} receitas no D1...`);
  execFileSync("npx", ["wrangler", "d1", "execute", "receitando", "--remote", `--file=${file}`, "--yes"], {
    stdio: "inherit",
    env: process.env,
  });
  console.log(`Concluído: ${recipes.length} receitas importadas do Wikilivros.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
