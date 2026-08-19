import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const SOURCE = "themealdb";
const SOURCE_NAME = "TheMealDB";
const TRANSLATION_MODEL = "@cf/meta/m2m100-1.2b";
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_TRANSLATION_CONCURRENCY = 8;

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function sql(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function hash(value, length = 20) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, length);
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function slugify(value) {
  return normalize(value).replaceAll(" ", "-").slice(0, 75) || "receita";
}

function mealType(category) {
  const value = normalize(category);
  if (/breakfast|brunch|cafe da manha/.test(value)) return "cafe-da-manha";
  if (/dessert|cake|sweet|sobremesa/.test(value)) return "sobremesa";
  if (/drink|beverage|cocktail|bebida/.test(value)) return "bebida";
  if (/starter|side|snack|entrada|lanche/.test(value)) return "lanche";
  return "almoco-jantar";
}

function difficulty(ingredientCount, instructions) {
  const steps = String(instructions ?? "").split(/\r?\n|\.\s+/).filter(Boolean).length;
  if (ingredientCount <= 7 && steps <= 6) return "FACIL";
  if (ingredientCount <= 13 && steps <= 10) return "MEDIA";
  return "DIFICIL";
}

function prepMinutes(instructions, ingredientCount) {
  const text = String(instructions ?? "");
  const minuteMatches = [...text.matchAll(/(\d{1,3})\s*(?:minutes?|mins?)/gi)].map((match) => Number(match[1]));
  const hourMatches = [...text.matchAll(/(\d{1,2})\s*(?:hours?|hrs?)/gi)].map((match) => Number(match[1]) * 60);
  const explicit = [...minuteMatches, ...hourMatches].filter((value) => Number.isFinite(value) && value > 0 && value <= 720);
  if (explicit.length) return Math.min(240, Math.max(...explicit));
  return Math.min(180, Math.max(15, 10 + ingredientCount * 3));
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function fetchMeals(apiKey) {
  const byId = new Map();
  for (const letter of "abcdefghijklmnopqrstuvwxyz") {
    const url = `https://www.themealdb.com/api/json/v1/${encodeURIComponent(apiKey)}/search.php?f=${letter}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`TheMealDB respondeu ${response.status} ao buscar letra ${letter}.`);
    const payload = await response.json();
    for (const meal of payload?.meals ?? []) {
      if (meal?.idMeal) byId.set(String(meal.idMeal), meal);
    }
    console.log(`Letra ${letter.toUpperCase()}: ${payload?.meals?.length ?? 0} receitas`);
  }
  return [...byId.values()];
}

async function translateText(text, { accountId, apiToken }, attempt = 1) {
  const value = String(text ?? "").trim();
  if (!value) return "";

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${TRANSLATION_MODEL}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: value,
      source_lang: "en",
      target_lang: "pt",
    }),
  });

  if ((response.status === 429 || response.status >= 500) && attempt < 6) {
    await sleep(Math.min(15000, 800 * 2 ** attempt));
    return translateText(value, { accountId, apiToken }, attempt + 1);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const detail = payload?.errors?.map((error) => error?.message).filter(Boolean).join("; ") || `HTTP ${response.status}`;
    throw new Error(`Workers AI falhou ao traduzir: ${detail}`);
  }

  const translated = String(payload?.result?.translated_text ?? payload?.result?.translation ?? "").trim();
  if (!translated) throw new Error("Workers AI retornou tradução vazia.");
  return translated;
}

async function translateUniqueTexts(texts, credentials, concurrency) {
  const unique = [...new Set(texts.map((value) => String(value ?? "").trim()).filter(Boolean))];
  const translations = new Map();
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= unique.length) return;
      const original = unique[index];
      const translated = await translateText(original, credentials);
      translations.set(original, translated);
      completed += 1;
      if (completed % 50 === 0 || completed === unique.length) {
        console.log(`Tradução PT-BR: ${completed}/${unique.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, () => worker()));
  return translations;
}

function rawRecipe(meal) {
  const title = String(meal.strMeal ?? "").trim();
  const imageUrl = String(meal.strMealThumb ?? "").trim();
  const instructions = String(meal.strInstructions ?? "").trim();
  if (!meal.idMeal || !title || !imageUrl || !instructions) return null;

  const ingredients = [];
  for (let index = 1; index <= 20; index += 1) {
    const name = String(meal[`strIngredient${index}`] ?? "").trim();
    if (!name) continue;
    const measure = String(meal[`strMeasure${index}`] ?? "").trim();
    ingredients.push({ name, measure });
  }
  if (!ingredients.length) return null;

  return {
    externalId: String(meal.idMeal),
    title,
    imageUrl,
    instructions,
    category: String(meal.strCategory ?? "").trim(),
    area: String(meal.strArea ?? "").trim(),
    ingredients,
  };
}

function buildRecipe(recipe, translations) {
  const translatedTitle = translations.get(recipe.title) || recipe.title;
  const translatedInstructions = translations.get(recipe.instructions) || recipe.instructions;
  const translatedCategory = translations.get(recipe.category) || recipe.category;
  const translatedArea = translations.get(recipe.area) || recipe.area;
  const translatedIngredients = recipe.ingredients.map(({ name, measure }) => ({
    name: translations.get(name) || name,
    measure: translations.get(measure) || measure,
  }));

  const id = `mealdb-${recipe.externalId}`;
  return {
    id,
    externalId: recipe.externalId,
    title: translatedTitle.slice(0, 220),
    slug: `${slugify(translatedTitle)}-${recipe.externalId}`,
    description: `${translatedTitle}, receita do TheMealDB${translatedArea ? ` · ${translatedArea}` : ""}${translatedCategory ? ` · ${translatedCategory}` : ""}.`.slice(0, 500),
    instructions: translatedInstructions.slice(0, 12000),
    prepMinutes: prepMinutes(recipe.instructions, translatedIngredients.length),
    servings: 4,
    mealType: mealType(translatedCategory || recipe.category),
    difficulty: difficulty(translatedIngredients.length, recipe.instructions),
    imageUrl: recipe.imageUrl,
    category: translatedCategory.slice(0, 120),
    area: translatedArea.slice(0, 120),
    ingredients: translatedIngredients,
  };
}

function recipeSql(recipe) {
  const lines = [];
  lines.push(
    `INSERT INTO recipes (id,title,slug,description,instructions,prep_minutes,servings,meal_type,difficulty,source_type,source_name,image_url,external_source,external_id,external_category,external_subcategory) VALUES (${sql(recipe.id)},${sql(recipe.title)},${sql(recipe.slug)},${sql(recipe.description)},${sql(recipe.instructions)},${recipe.prepMinutes},${recipe.servings},${sql(recipe.mealType)},${sql(recipe.difficulty)},'OPEN_DATASET',${sql(SOURCE_NAME)},${sql(recipe.imageUrl)},${sql(SOURCE)},${sql(recipe.externalId)},${sql(recipe.category || null)},${sql(recipe.area || null)});`,
  );

  recipe.ingredients.forEach(({ name, measure }, ingredientIndex) => {
    const normalized = normalize(name);
    if (!normalized) return;
    const ingredientId = `mealdb-ing-${hash(normalized)}`;
    const relationId = `mealdb-ri-${hash(`${recipe.id}|${normalized}`)}`;
    lines.push(`INSERT OR IGNORE INTO ingredients (id,name,normalized_name,category) VALUES (${sql(ingredientId)},${sql(name)},${sql(normalized)},'TheMealDB');`);
    lines.push(`INSERT OR IGNORE INTO recipe_ingredients (id,recipe_id,ingredient_id,quantity,unit,optional) SELECT ${sql(relationId)},${sql(recipe.id)},id,NULL,${sql(measure || null)},0 FROM ingredients WHERE normalized_name = ${sql(normalized)} LIMIT 1;`);
    if (ingredientIndex < 3) lines.push(`INSERT OR IGNORE INTO recipe_tags (recipe_id,tag) VALUES (${sql(recipe.id)},${sql(normalized.slice(0, 60))});`);
  });
  if (recipe.category) lines.push(`INSERT OR IGNORE INTO recipe_tags (recipe_id,tag) VALUES (${sql(recipe.id)},${sql(slugify(recipe.category).slice(0, 60))});`);
  if (recipe.area) lines.push(`INSERT OR IGNORE INTO recipe_tags (recipe_id,tag) VALUES (${sql(recipe.id)},${sql(slugify(recipe.area).slice(0, 60))});`);
  return lines.join("\n");
}

const apiKey = arg("api-key", process.env.THEMEALDB_API_KEY || "1");
const accountId = arg("cloudflare-account-id", process.env.CLOUDFLARE_ACCOUNT_ID || "");
const aiApiToken = arg("cloudflare-ai-token", process.env.CLOUDFLARE_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || "");
const output = resolve(arg("output", "./generated/themealdb"));
const batchSize = Math.max(5, Number(arg("batch-size", String(DEFAULT_BATCH_SIZE))) || DEFAULT_BATCH_SIZE);
const translationConcurrency = Math.max(1, Math.min(16, Number(arg("translation-concurrency", String(DEFAULT_TRANSLATION_CONCURRENCY))) || DEFAULT_TRANSLATION_CONCURRENCY));

if (!accountId || !aiApiToken) {
  throw new Error("CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_AI_API_TOKEN são obrigatórios para traduzir o catálogo para PT-BR.");
}

const meals = await fetchMeals(apiKey);
const rawRecipes = meals.map(rawRecipe).filter(Boolean);
if (!rawRecipes.length) throw new Error("Nenhuma receita válida foi retornada pelo TheMealDB.");

const textsToTranslate = [];
for (const recipe of rawRecipes) {
  textsToTranslate.push(recipe.title, recipe.instructions, recipe.category, recipe.area);
  for (const ingredient of recipe.ingredients) {
    textsToTranslate.push(ingredient.name, ingredient.measure);
  }
}

console.log(`Preparando tradução de ${rawRecipes.length} receitas para PT-BR...`);
const translations = await translateUniqueTexts(
  textsToTranslate,
  { accountId, apiToken: aiApiToken },
  translationConcurrency,
);
const recipes = rawRecipes.map((recipe) => buildRecipe(recipe, translations));

mkdirSync(output, { recursive: true });
let batchIndex = 0;
for (let index = 0; index < recipes.length; index += batchSize) {
  const batch = recipes.slice(index, index + batchSize);
  const prefix = index === 0
    ? [
        "PRAGMA foreign_keys = ON;",
        "DELETE FROM recipes;",
      ]
    : ["PRAGMA foreign_keys = ON;"];
  const sqlText = [...prefix, ...batch.map(recipeSql)].join("\n\n") + "\n";
  const filename = `batch-${String(batchIndex + 1).padStart(4, "0")}.sql`;
  writeFileSync(join(output, filename), sqlText, "utf8");
  batchIndex += 1;
}

writeFileSync(
  join(output, "manifest.json"),
  JSON.stringify({
    source: SOURCE,
    sourceName: SOURCE_NAME,
    language: "pt-BR",
    translationModel: TRANSLATION_MODEL,
    fetched: meals.length,
    imported: recipes.length,
    translations: translations.size,
    batches: batchIndex,
    batchSize,
  }, null, 2),
  "utf8",
);
console.log(`Preparadas ${recipes.length} receitas do TheMealDB em PT-BR em ${batchIndex} lotes.`);
