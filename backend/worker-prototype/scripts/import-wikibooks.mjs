import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const API_URL = "https://pt.wikibooks.org/w/api.php";
const COMMONS_API_URL = "https://commons.wikimedia.org/w/api.php";
const SOURCE_NAME = "Wikilivros";
const SOURCE_ID = "wikibooks";
const SOURCE_LICENSE = "CC BY-SA 4.0";
const SOURCE_LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/";
const IMAGE_SOURCE = "Wikimedia Commons";
const ALL_CATEGORIES = "Todas as categorias";
const MASTER_CATEGORY = "Livro/Livro de receitas";
const MAX_CATEGORY_DEPTH = 3;
const MAX_DISCOVERY_PAGES = 5000;
const IMPORT_BATCH_SIZE = 20;

const ALLOWED_CATEGORIES = new Map([
  ["Doces", "sobremesa"],
  ["Entradas", "entrada"],
  ["Massas", "almoco-jantar"],
  ["Quitandas", "lanche"],
  ["Salgados, Lanches e Sanduíches", "lanche"],
  ["Sobremesas", "sobremesa"],
]);

const IMAGE_STOPWORDS = new Set([
  "a", "as", "ao", "aos", "com", "da", "das", "de", "do", "dos", "e", "em", "na", "nas", "no", "nos",
  "para", "por", "um", "uma", "uns", "umas", "receita", "receitas",
]);

function args() {
  const values = process.argv.slice(2);
  const result = { category: ALL_CATEGORIES, limit: 100 };

  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === "--category" && values[index + 1]) result.category = values[++index];
    if (values[index] === "--limit" && values[index + 1]) {
      const raw = String(values[++index]).trim().toLowerCase();
      result.limit = ["all", "todas", "todos", "0"].includes(raw) ? Infinity : Number(raw);
    }
  }

  if (result.limit !== Infinity) {
    result.limit = Math.max(1, Math.min(1000, Number.isFinite(result.limit) ? result.limit : 100));
  }

  if (result.category !== ALL_CATEGORIES && !ALLOWED_CATEGORIES.has(result.category)) {
    throw new Error(
      `Categoria não permitida: ${result.category}. Use “${ALL_CATEGORIES}” ou uma destas: ${[
        ...ALLOWED_CATEGORIES.keys(),
      ].join(", ")}`,
    );
  }

  return result;
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
  return String(value ?? "")
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

function cleanMetadata(value) {
  if (!value) return null;
  const cleaned = String(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
}

function normalizedHttpUrl(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (raw.startsWith("//")) return `https:${raw}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  return null;
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
      if (
        normalizedHeading.includes("preparo") ||
        normalizedHeading.includes("modo de preparar") ||
        normalizedHeading.includes("modo de preparo")
      ) {
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
      const item = cleanWiki(originalLine.trim().replace(/^(?:#+|\*#+)\s*/, ""))
        .replace(/^\d+[.)]\s*/, "")
        .trim();
      if (item) steps.push(item);
      continue;
    }

    if (
      mode === "steps" &&
      cleanedLine &&
      !cleanedLine.startsWith("[[Categoria:") &&
      !cleanedLine.startsWith("Categoria:")
    ) {
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
    .replace(
      /^\s*(?:\d+(?:[.,]\d+)?(?:\s+e\s+\d+\/\d+)?|\d+\/\d+|uma?|duas?|meia?)\s+/i,
      "",
    )
    .replace(
      /^\s*(?:kg|g|gramas?|quilogramas?|litros?|ml|mililitros?|x[ií]caras?(?:\s*\([^)]*\))?|chávenas?|copos?(?:\s*\([^)]*\))?|colheres?(?:\s*\([^)]*\))?|latas?|pacotes?|vidros?|dentes?|unidades?|tabletes?|envelopes?|pitadas?)\s+(?:de\s+)?/i,
      "",
    )
    .replace(/^\s*de\s+/i, "")
    .replace(/\s*[;,.]+$/, "")
    .trim();

  value = value.replace(/\s*\([^)]*(?:picad|cortad|ralad|cozid|fatiad|amassad)[^)]*\)\s*/gi, " ").trim();
  if (!value || value.length < 2) value = raw;
  return value.slice(0, 120);
}

async function mediaWikiRequest(baseUrl, params, sourceLabel) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries({ ...params, format: "json", formatversion: "2", origin: "*" })) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { "User-Agent": "ReceitandoAcademic/0.2 (https://receitando.miguelpita.com.br/)" },
  });
  if (!response.ok) throw new Error(`${sourceLabel} respondeu ${response.status}`);
  return response.json();
}

function mediaWiki(params) {
  return mediaWikiRequest(API_URL, params, "Wikilivros");
}

function commons(params) {
  return mediaWikiRequest(COMMONS_API_URL, params, "Wikimedia Commons");
}

function categoryTitle(value) {
  return value.startsWith("Categoria:") ? value : `Categoria:${value}`;
}

async function crawlCategory(rootCategory) {
  const pages = new Map();
  const queue = [{ title: categoryTitle(rootCategory), depth: 0 }];
  const visitedCategories = new Set();

  while (queue.length && pages.size < MAX_DISCOVERY_PAGES) {
    const current = queue.shift();
    if (!current || visitedCategories.has(current.title)) continue;
    visitedCategories.add(current.title);

    let cmcontinue;
    do {
      const payload = await mediaWiki({
        action: "query",
        list: "categorymembers",
        cmtitle: current.title,
        cmtype: "page|subcat",
        cmlimit: "500",
        ...(cmcontinue ? { cmcontinue } : {}),
      });

      for (const member of payload?.query?.categorymembers ?? []) {
        if (
          member?.ns === 0 &&
          typeof member.title === "string" &&
          member.title.startsWith("Livro de receitas/")
        ) {
          pages.set(member.pageid ?? member.title, { ...member, rootCategory });
        } else if (
          member?.ns === 14 &&
          current.depth < MAX_CATEGORY_DEPTH &&
          typeof member.title === "string"
        ) {
          queue.push({ title: member.title, depth: current.depth + 1 });
        }

        if (pages.size >= MAX_DISCOVERY_PAGES) break;
      }

      cmcontinue = payload?.continue?.cmcontinue;
    } while (cmcontinue && pages.size < MAX_DISCOVERY_PAGES);
  }

  return [...pages.values()];
}

async function discoverRecipePages(selectedCategory) {
  const roots =
    selectedCategory === ALL_CATEGORIES
      ? [MASTER_CATEGORY, ...ALLOWED_CATEGORIES.keys()]
      : [selectedCategory];

  const pages = new Map();
  for (const root of roots) {
    console.log(`Descobrindo páginas em “${root}”...`);
    const found = await crawlCategory(root);
    for (const page of found) {
      const key = page.pageid ?? page.title;
      if (!pages.has(key)) pages.set(key, page);
    }
  }

  return [...pages.values()].sort((a, b) => String(a.title).localeCompare(String(b.title), "pt-BR"));
}

async function pageSource(title) {
  const payload = await mediaWiki({
    action: "parse",
    page: title,
    prop: "wikitext|categories",
  });
  const raw = payload?.parse?.wikitext;
  const wikitext = typeof raw === "string" ? raw : raw?.["*"];
  if (typeof wikitext !== "string") return null;

  const categories = (payload?.parse?.categories ?? [])
    .map((item) => item?.category)
    .filter((item) => typeof item === "string");

  return { wikitext, categories };
}

function embeddedImageNames(wikitext) {
  const names = [];
  const pattern = /\[\[(?:File|Ficheiro|Imagem):([^|\]\n]+)/gi;
  for (const match of wikitext.matchAll(pattern)) {
    const name = match[1]?.trim();
    if (name) names.push(name);
  }
  return names;
}

async function pageImageCandidates(title, wikitext) {
  const candidates = [];
  const payload = await mediaWiki({
    action: "query",
    prop: "pageimages|images",
    titles: title,
    piprop: "name",
    pilicense: "free",
    imlimit: "max",
  });

  const page = payload?.query?.pages?.[0];
  if (typeof page?.pageimage === "string") candidates.push(page.pageimage);

  for (const image of page?.images ?? []) {
    if (typeof image?.title === "string") candidates.push(image.title);
  }

  candidates.push(...embeddedImageNames(wikitext));
  return [...new Set(candidates.map((name) => String(name).trim()).filter(Boolean))].slice(0, 40);
}

function acceptableCommonsImage(fileTitle, info) {
  const mime = String(info?.mime ?? "").toLowerCase();
  if (mime && !["image/jpeg", "image/png", "image/webp"].includes(mime)) return false;

  const normalizedTitle = normalize(fileTitle);
  if (/\b(?:icon|icone|logo|wikibooks|wikipedia|commons|book|livro|mapa|map)\b/.test(normalizedTitle)) {
    return false;
  }

  return Boolean(info?.thumburl || info?.url);
}

function licenseLooksFree(license) {
  const value = normalize(license);
  if (!value) return false;
  if (/\b(?:non free|fair use|all rights reserved)\b/.test(value)) return false;
  return true;
}

function recipeTokens(recipeTitle) {
  return normalize(recipeTitle)
    .split(" ")
    .filter((token) => token.length >= 3 && !IMAGE_STOPWORDS.has(token))
    .map((token) => (token.length > 4 && token.endsWith("s") ? token.slice(0, -1) : token));
}

function imageLooksRelevant(recipeTitle, fileTitle, metadata) {
  const tokens = recipeTokens(recipeTitle);
  if (!tokens.length) return true;

  const metadataText = [
    fileTitle,
    cleanMetadata(metadata?.ObjectName?.value),
    cleanMetadata(metadata?.ImageDescription?.value),
    cleanMetadata(metadata?.Categories?.value),
    cleanMetadata(metadata?.Keywords?.value),
  ]
    .filter(Boolean)
    .join(" ");

  const haystack = normalize(metadataText);
  const matched = tokens.filter((token) => haystack.includes(token)).length;
  if (tokens.length === 1) return matched === 1;
  return matched >= 2 || matched / tokens.length >= 0.5;
}

async function commonsImage(fileName, recipeTitle, requireRelevance = false) {
  const fileTitle = /^(?:File|Ficheiro|Imagem):/i.test(fileName)
    ? fileName.replace(/^(?:Ficheiro|Imagem):/i, "File:")
    : `File:${fileName}`;

  const payload = await commons({
    action: "query",
    prop: "imageinfo",
    titles: fileTitle,
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "1400",
  });

  const page = payload?.query?.pages?.[0];
  const info = page?.imageinfo?.[0];
  if (!info || !acceptableCommonsImage(fileTitle, info)) return null;

  const metadata = info.extmetadata ?? {};
  const license = cleanMetadata(metadata.LicenseShortName?.value || metadata.UsageTerms?.value);
  if (!license || !licenseLooksFree(license)) return null;
  if (requireRelevance && !imageLooksRelevant(recipeTitle, fileTitle, metadata)) return null;

  const imageUrl = normalizedHttpUrl(info.thumburl || info.url);
  const pageUrl = normalizedHttpUrl(info.descriptionurl);
  if (!imageUrl || !pageUrl) return null;

  return {
    url: imageUrl,
    source: IMAGE_SOURCE,
    author:
      cleanMetadata(metadata.Artist?.value || metadata.Credit?.value || IMAGE_SOURCE)?.slice(0, 240) ??
      IMAGE_SOURCE,
    pageUrl,
    license: license.slice(0, 160),
    licenseUrl: normalizedHttpUrl(metadata.LicenseUrl?.value),
    alt: recipeTitle.slice(0, 240),
  };
}

async function searchCommonsImage(recipeTitle) {
  const significant = recipeTokens(recipeTitle);
  const queries = [
    `"${recipeTitle}"`,
    recipeTitle,
    `${recipeTitle} food`,
    significant.length > 1 ? significant.join(" ") : null,
  ].filter(Boolean);

  const candidates = [];
  for (const query of queries) {
    const payload = await commons({
      action: "query",
      list: "search",
      srsearch: query,
      srnamespace: "6",
      srlimit: "20",
    });

    for (const result of payload?.query?.search ?? []) {
      if (typeof result?.title === "string") candidates.push(result.title);
    }

    if (candidates.length >= 30) break;
  }

  for (const fileTitle of [...new Set(candidates)].slice(0, 30)) {
    const image = await commonsImage(fileTitle, recipeTitle, true);
    if (image) return image;
  }

  return null;
}

async function freeImageForPage(title, wikitext) {
  const recipeTitle = title.replace(/^Livro de receitas\//, "").trim();
  const associatedCandidates = await pageImageCandidates(title, wikitext);

  for (const fileName of associatedCandidates) {
    const image = await commonsImage(fileName, recipeTitle, false);
    if (image) return image;
  }

  return searchCommonsImage(recipeTitle);
}

function canonicalCategory(categories, fallback) {
  const normalizedCategories = categories.map(normalize);

  for (const allowed of ALLOWED_CATEGORIES.keys()) {
    const needle = normalize(allowed);
    if (normalizedCategories.some((category) => category === needle || category.includes(needle))) {
      return allowed;
    }
  }

  return ALLOWED_CATEGORIES.has(fallback) ? fallback : "Outros";
}

function recipeSql(recipe) {
  const id = `wikibooks-${recipe.pageid}`;
  const title = recipe.title.replace(/^Livro de receitas\//, "").trim();
  const slug = `${slugify(title)}-wikilivros`;
  const encodedTitle = recipe.title
    .replaceAll(" ", "_")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const sourceUrl = `https://pt.wikibooks.org/wiki/${encodedTitle}`;
  const mealType = ALLOWED_CATEGORIES.get(recipe.category) ?? "outros";
  const now = new Date().toISOString();
  const description = "Receita publicada no Wikilivros em português.";
  const statements = [];

  statements.push(`INSERT INTO recipes (
    id, title, slug, description, instructions, prep_minutes, servings,
    meal_type, difficulty, source_type, source_name, image_url,
    image_source, image_author, image_page_url, image_license, image_license_url, image_alt,
    external_source, external_id, external_category, external_subcategory,
    source_url, source_author, source_license, source_license_url, source_language, imported_at,
    created_at, updated_at
  ) VALUES (
    ${sql(id)}, ${sql(title)}, ${sql(slug)}, ${sql(description)}, ${sql(recipe.steps.join("\n"))}, 0, 0,
    ${sql(mealType)}, 'FACIL', 'OPEN_DATASET', ${sql(SOURCE_NAME)}, ${sql(recipe.image.url)},
    ${sql(recipe.image.source)}, ${sql(recipe.image.author)}, ${sql(recipe.image.pageUrl)}, ${sql(
      recipe.image.license,
    )}, ${sql(recipe.image.licenseUrl)}, ${sql(recipe.image.alt)},
    ${sql(SOURCE_ID)}, ${sql(String(recipe.pageid))}, ${sql(recipe.category)}, NULL,
    ${sql(sourceUrl)}, ${sql("Colaboradores do Wikilivros")}, ${sql(SOURCE_LICENSE)}, ${sql(
      SOURCE_LICENSE_URL,
    )}, 'pt-BR', ${sql(now)},
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ) ON CONFLICT(id) DO UPDATE SET
    title = excluded.title,
    slug = excluded.slug,
    description = excluded.description,
    instructions = excluded.instructions,
    meal_type = excluded.meal_type,
    source_name = excluded.source_name,
    image_url = excluded.image_url,
    image_source = excluded.image_source,
    image_author = excluded.image_author,
    image_page_url = excluded.image_page_url,
    image_license = excluded.image_license,
    image_license_url = excluded.image_license_url,
    image_alt = excluded.image_alt,
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
      VALUES (${sql(fallbackIngredientId)}, ${sql(name)}, ${sql(
        normalizedName,
      )}, 'outros', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);

    statements.push(`INSERT OR REPLACE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional, raw_text)
      SELECT ${sql(recipeIngredientId)}, ${sql(id)}, id, NULL, NULL, 0, ${sql(rawText)}
      FROM ingredients WHERE normalized_name = ${sql(normalizedName)} LIMIT 1;`);
  }

  statements.push(`INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES (${sql(id)}, 'wikilivros');`);
  statements.push(
    `INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES (${sql(id)}, ${sql(slugify(recipe.category))});`,
  );

  return statements.join("\n");
}

function executeSql(sqlText, label) {
  const safeLabel = slugify(label || "lote") || "lote";
  const file = join(tmpdir(), `receitando-wikibooks-${safeLabel}-${Date.now()}.sql`);
  writeFileSync(file, sqlText, "utf8");

  execFileSync("npx", ["wrangler", "d1", "execute", "receitando", "--remote", `--file=${file}`, "--yes"], {
    stdio: "inherit",
    env: process.env,
  });
}

async function main() {
  const { category, limit } = args();
  const targetLabel = limit === Infinity ? "todas as receitas possíveis" : `${limit} receitas`;

  console.log(`Meta: ${targetLabel} com imagem livre. Escopo: “${category}”.`);
  const members = await discoverRecipePages(category);
  console.log(`Páginas de receitas descobertas: ${members.length}.`);

  const recipes = [];
  let validWithoutImage = 0;
  let invalidStructure = 0;

  for (let index = 0; index < members.length; index += 1) {
    if (limit !== Infinity && recipes.length >= limit) break;

    const member = members[index];
    const shortTitle = member.title.replace(/^Livro de receitas\//, "").trim();

    try {
      const page = await pageSource(member.title);
      if (!page) continue;

      const parsed = parseRecipe(page.wikitext);
      if (!parsed) {
        invalidStructure += 1;
        continue;
      }

      const image = await freeImageForPage(member.title, page.wikitext);
      if (!image) {
        validWithoutImage += 1;
        console.log(`  - sem imagem encontrada: ${shortTitle}`);
        continue;
      }

      const recipeCategory = canonicalCategory(page.categories, member.rootCategory);
      recipes.push({ ...member, ...parsed, image, category: recipeCategory });
      console.log(`  ✓ ${shortTitle} · ${image.license} · ${recipes.length}/${targetLabel}`);
    } catch (error) {
      console.warn(`  - ignorada ${member.title}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (!recipes.length) {
    throw new Error("Nenhuma receita com estrutura suficiente e imagem livre foi encontrada.");
  }

  console.log(
    `Encontradas ${recipes.length} receitas com foto. Sem foto: ${validWithoutImage}. Estrutura inválida: ${invalidStructure}.`,
  );

  executeSql(
    [
      "PRAGMA foreign_keys = ON;",
      "DELETE FROM recipes WHERE COALESCE(external_source, '') <> 'wikibooks';",
      "DELETE FROM recipes WHERE external_source = 'wikibooks' AND (image_url IS NULL OR TRIM(image_url) = '');",
    ].join("\n\n"),
    "limpeza",
  );

  for (let index = 0; index < recipes.length; index += IMPORT_BATCH_SIZE) {
    const batch = recipes.slice(index, index + IMPORT_BATCH_SIZE);
    const batchNumber = Math.floor(index / IMPORT_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(recipes.length / IMPORT_BATCH_SIZE);

    console.log(`Importando lote ${batchNumber}/${totalBatches} (${batch.length} receitas)...`);
    executeSql(
      ["PRAGMA foreign_keys = ON;", ...batch.map((recipe) => recipeSql(recipe))].join("\n\n"),
      `lote-${batchNumber}`,
    );
  }

  console.log(`Concluído: ${recipes.length} receitas do Wikilivros com imagens livres estão no catálogo.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
