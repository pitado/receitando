import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const SOURCE = "recipes-dataset-64k-dishes";
const SOURCE_NAME = "Recipes Dataset 64K Dishes (CC0)";
const DEFAULT_BATCH_SIZE = 100;

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
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
  return normalize(value).replaceAll(" ", "-").slice(0, 70) || "receita";
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return trimmed.split(/\r?\n|\s*;\s*/).filter(Boolean);
}

function cleanIngredient(value) {
  return String(value ?? "")
    .replace(/^[-•*]\s*/, "")
    .replace(/^\s*\d+(?:[.,/]\d+)?\s*(?:x|g|kg|mg|ml|l|oz|lb|lbs|cup|cups|tbsp|tsp|tablespoons?|teaspoons?|colheres?|xic(?:ara|aras)?|xícaras?|unidades?|unidade)?\s*/i, "")
    .replace(/^\s*(?:a|an|one|two|three|four|five|six|seven|eight|nine|ten)\s+/i, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function pick(row, names, fallback = "") {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== "") return row[name];
  }
  return fallback;
}

function findJsonFiles(root) {
  const entries = readdirSync(root);
  const output = [];
  for (const entry of entries) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) output.push(...findJsonFiles(full));
    else if (extname(entry).toLowerCase() === ".json") output.push(full);
  }
  return output;
}

function loadRows(inputPath) {
  const full = resolve(inputPath);
  const files = statSync(full).isDirectory() ? findJsonFiles(full) : [full];
  if (!files.length) throw new Error("Nenhum arquivo JSON encontrado no dataset.");

  const candidates = files.sort((a, b) => statSync(b).size - statSync(a).size);
  for (const file of candidates) {
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8"));
      if (Array.isArray(parsed) && parsed.length) {
        console.log(`Dataset: ${basename(file)} (${parsed.length} registros)`);
        return parsed;
      }
      if (parsed && Array.isArray(parsed.recipes) && parsed.recipes.length) {
        console.log(`Dataset: ${basename(file)} (${parsed.recipes.length} registros)`);
        return parsed.recipes;
      }
    } catch {}
  }
  throw new Error("Não foi possível encontrar um JSON com uma lista de receitas.");
}

function difficulty(ingredientCount, stepCount) {
  if (ingredientCount <= 7 && stepCount <= 5) return "FACIL";
  if (ingredientCount <= 13 && stepCount <= 9) return "MEDIA";
  return "DIFICIL";
}

function mealType(category) {
  const value = normalize(category);
  if (/breakfast|brunch|cafe da manha/.test(value)) return "cafe-da-manha";
  if (/dessert|cake|sweet|sobremesa/.test(value)) return "sobremesa";
  if (/drink|beverage|bebida/.test(value)) return "bebida";
  if (/snack|appetizer|lanche/.test(value)) return "lanche";
  return "almoco-jantar";
}

function buildRecipe(row, index) {
  const title = String(pick(row, ["recipe_title", "Title", "title", "Name", "name", "recipe_name", "Recipe"])).trim();
  const imageUrl = String(pick(row, ["_image_url", "image_url", "Image", "image"])).trim();
  if (!title || !imageUrl) return null;

  const category = String(pick(row, ["Category", "category", "Course", "course"])).trim();
  const subcategory = String(pick(row, ["Subcategory", "subcategory", "SubCategory", "sub_category"])).trim();
  const rawIngredients = asArray(pick(row, ["Ingredients", "ingredients", "ingredient_list", "RecipeIngredientParts"]));
  const directions = asArray(pick(row, ["Directions", "directions", "Instructions", "instructions", "Steps", "steps"]));
  const cleanedIngredients = [...new Map(rawIngredients.map((item) => {
    const display = cleanIngredient(item);
    return [normalize(display), display];
  }).filter(([key, display]) => key && display)).values()];

  if (!cleanedIngredients.length || !directions.length) return null;

  const externalId = String(pick(row, ["id", "ID", "recipe_id", "RecipeId"], `${index}-${title}`));
  const recipeId = `ext64-${hash(`${externalId}|${title}`)}`;
  const slug = `${slugify(title)}-${hash(externalId, 7)}`;
  const instructionText = directions.map((step, stepIndex) => `${stepIndex + 1}. ${String(step).trim()}`).join("\n");
  const datasetDescription = String(pick(row, ["description", "Description"])).trim();
  const description = datasetDescription || (category
    ? `${title}, receita da categoria ${category}${subcategory ? ` · ${subcategory}` : ""}.`
    : `${title}, receita do catálogo aberto do Receitando.`);

  return {
    recipeId,
    externalId,
    title: title.slice(0, 220),
    slug,
    description: description.slice(0, 500),
    instructions: instructionText.slice(0, 12000),
    category: category.slice(0, 120),
    subcategory: subcategory.slice(0, 120),
    mealType: mealType(category),
    difficulty: difficulty(cleanedIngredients.length, directions.length),
    prepMinutes: Math.min(180, Math.max(10, 10 + directions.length * 4)),
    servings: 4,
    ingredients: cleanedIngredients,
    imageUrl,
    imageSource: String(pick(row, ["_image_source", "image_source"], "Pexels")).slice(0, 80),
    imageAuthor: String(pick(row, ["_image_author", "image_author"])).slice(0, 160) || null,
    imagePageUrl: String(pick(row, ["_image_page_url", "image_page_url"])).slice(0, 800) || null,
    imageAlt: String(pick(row, ["_image_alt", "image_alt"], title)).slice(0, 300),
  };
}

function recipeSql(recipe) {
  const lines = [];
  lines.push(
    `INSERT OR IGNORE INTO recipes (id,title,slug,description,instructions,prep_minutes,servings,meal_type,difficulty,source_type,source_name,image_url,image_source,image_author,image_page_url,image_alt,external_source,external_id,external_category,external_subcategory) VALUES (${sql(recipe.recipeId)},${sql(recipe.title)},${sql(recipe.slug)},${sql(recipe.description)},${sql(recipe.instructions)},${recipe.prepMinutes},${recipe.servings},${sql(recipe.mealType)},${sql(recipe.difficulty)},'OPEN_DATASET',${sql(SOURCE_NAME)},${sql(recipe.imageUrl)},${sql(recipe.imageSource)},${sql(recipe.imageAuthor)},${sql(recipe.imagePageUrl)},${sql(recipe.imageAlt)},${sql(SOURCE)},${sql(recipe.externalId)},${sql(recipe.category || null)},${sql(recipe.subcategory || null)});`,
  );

  recipe.ingredients.forEach((displayName, ingredientIndex) => {
    const normalized = normalize(displayName);
    const ingredientId = `exting-${hash(normalized)}`;
    const relationId = `extri-${hash(`${recipe.recipeId}|${ingredientId}`)}`;
    lines.push(`INSERT OR IGNORE INTO ingredients (id,name,normalized_name,category) VALUES (${sql(ingredientId)},${sql(displayName)},${sql(normalized)},'dataset aberto');`);
    lines.push(`INSERT OR IGNORE INTO recipe_ingredients (id,recipe_id,ingredient_id,quantity,unit,optional) SELECT ${sql(relationId)},${sql(recipe.recipeId)},id,NULL,NULL,0 FROM ingredients WHERE normalized_name = ${sql(normalized)} LIMIT 1;`);
    if (ingredientIndex < 3) lines.push(`INSERT OR IGNORE INTO recipe_tags (recipe_id,tag) VALUES (${sql(recipe.recipeId)},${sql(normalized.slice(0, 60))});`);
  });
  if (recipe.category) lines.push(`INSERT OR IGNORE INTO recipe_tags (recipe_id,tag) VALUES (${sql(recipe.recipeId)},${sql(slugify(recipe.category).slice(0, 60))});`);
  return lines.join("\n");
}

const input = arg("input", "./dataset");
const output = resolve(arg("output", "./generated/64k"));
const offset = Math.max(0, Number(arg("offset", "0")) || 0);
const limit = Math.max(1, Number(arg("limit", "2000")) || 2000);
const batchSize = Math.max(10, Number(arg("batch-size", String(DEFAULT_BATCH_SIZE))) || DEFAULT_BATCH_SIZE);

const rows = loadRows(input);
const selected = rows.slice(offset, offset + limit);
const recipes = selected.map((row, localIndex) => buildRecipe(row, offset + localIndex)).filter(Boolean);
mkdirSync(output, { recursive: true });

let batchIndex = 0;
for (let index = 0; index < recipes.length; index += batchSize) {
  const batch = recipes.slice(index, index + batchSize);
  const sqlText = ["PRAGMA foreign_keys = ON;", ...batch.map(recipeSql)].join("\n\n") + "\n";
  const filename = `batch-${String(batchIndex + 1).padStart(4, "0")}.sql`;
  writeFileSync(join(output, filename), sqlText, "utf8");
  batchIndex += 1;
}

writeFileSync(
  join(output, "manifest.json"),
  JSON.stringify({ source: SOURCE, sourceName: SOURCE_NAME, offset, requested: limit, imported: recipes.length, batches: batchIndex, batchSize, requiresPhoto: true }, null, 2),
  "utf8",
);

console.log(`Preparadas ${recipes.length} receitas com foto em ${batchIndex} lotes.`);
