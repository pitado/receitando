import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const SOURCE = "themealdb";
const SOURCE_NAME = "TheMealDB";
const DEFAULT_BATCH_SIZE = 20;

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
  if (/breakfast|brunch/.test(value)) return "cafe-da-manha";
  if (/dessert|cake|sweet/.test(value)) return "sobremesa";
  if (/drink|beverage|cocktail/.test(value)) return "bebida";
  if (/starter|side|snack/.test(value)) return "lanche";
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

function buildRecipe(meal) {
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

  const id = `mealdb-${meal.idMeal}`;
  return {
    id,
    externalId: String(meal.idMeal),
    title: title.slice(0, 220),
    slug: `${slugify(title)}-${meal.idMeal}`,
    description: `${title}, receita do TheMealDB${meal.strArea ? ` · ${meal.strArea}` : ""}${meal.strCategory ? ` · ${meal.strCategory}` : ""}.`.slice(0, 500),
    instructions: instructions.slice(0, 12000),
    prepMinutes: prepMinutes(instructions, ingredients.length),
    servings: 4,
    mealType: mealType(meal.strCategory),
    difficulty: difficulty(ingredients.length, instructions),
    imageUrl,
    category: String(meal.strCategory ?? "").slice(0, 120),
    area: String(meal.strArea ?? "").slice(0, 120),
    sourceUrl: String(meal.strSource ?? "").trim(),
    youtubeUrl: String(meal.strYoutube ?? "").trim(),
    ingredients,
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
const output = resolve(arg("output", "./generated/themealdb"));
const batchSize = Math.max(5, Number(arg("batch-size", String(DEFAULT_BATCH_SIZE))) || DEFAULT_BATCH_SIZE);

const meals = await fetchMeals(apiKey);
const recipes = meals.map(buildRecipe).filter(Boolean);
if (!recipes.length) throw new Error("Nenhuma receita válida foi retornada pelo TheMealDB.");

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
  JSON.stringify({ source: SOURCE, sourceName: SOURCE_NAME, fetched: meals.length, imported: recipes.length, batches: batchIndex, batchSize }, null, 2),
  "utf8",
);
console.log(`Preparadas ${recipes.length} receitas do TheMealDB em ${batchIndex} lotes.`);
