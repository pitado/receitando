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

const MAX_CATEGORY_DEPTH = 4;
const MAX_DISCOVERY_PAGES = 4000;
const IMPORT_BATCH_SIZE = 20;
const PAGE_BATCH_SIZE = 20;
const MAX_RETRIES = 7;
const WIKIBOOKS_MIN_DELAY_MS = 450;
const COMMONS_MIN_DELAY_MS = 250;

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
  "para", "por", "um", "uma", "uns", "umas", "receita", "receitas", "caseiro", "caseira",
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<ref\b[^/>]*\/>/gi, "")
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, "$1")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/''+/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
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
  const lines = String(wikitext ?? "").replace(/\r/g, "").split("\n");
  const ingredients = [];
  const steps = [];
  let mode = null;
  let started = false;

  for (const originalLine of lines) {
    const trimmed = originalLine.trim();
    const headingMatch = trimmed.match(/^={2,6}\s*(.*?)\s*=+\s*$/);

    if (headingMatch) {
      const heading = cleanWiki(headingMatch[1]);
      const normalizedHeading = normalize(heading);

      if (started && ingredients.length >= 2 && steps.length >= 1 && isRecipeHeading(heading)) break;
      if (normalizedHeading.includes("ingrediente")) {
        if (started && ingredients.length >= 2 && steps.length >= 1) break;
        mode = "ingredients";
        started = true;
        continue;
      }
      if (
        normalizedHeading.includes("preparo") ||
        normalizedHeading.includes("preparacao") ||
        normalizedHeading.includes("modo de preparar") ||
        normalizedHeading.includes("modo de preparo") ||
        normalizedHeading.includes("procedimento")
      ) {
        mode = "steps";
        started = true;
        continue;
      }
      if (started && ingredients.length >= 2 && steps.length >= 1) break;
      continue;
    }

    if (!started || !trimmed || /^\[\[Categoria:/i.test(trimmed) || /^\{\|/.test(trimmed) || /^\|[-}]/.test(trimmed)) {
      continue;
    }

    const cleanedLine = cleanWiki(trimmed.replace(/^[:;]+/, ""));
    if (!cleanedLine) continue;

    if (mode === "ingredients" && /^(?:preparo|modo de preparo|preparacao)\s*:?$/i.test(normalize(cleanedLine))) {
      mode = "steps";
      continue;
    }

    if (mode === "ingredients") {
      if (/^[*#:;]/.test(trimmed)) {
        const item = cleanWiki(trimmed.replace(/^[*#:;]+\s*/, "")).replace(/[;,.]+$/, "").trim();
        if (item && !/^(?:preparo|modo de preparo|preparacao)\s*:?$/i.test(normalize(item))) ingredients.push(item);
      }
      continue;
    }

    if (mode === "steps") {
      const item = /^[*#:;]/.test(trimmed)
        ? cleanWiki(trimmed.replace(/^[*#:;]+\s*/, ""))
        : cleanedLine;
      const normalizedItem = item.replace(/^\d+[.)-]?\s*/, "").trim();
      if (normalizedItem.length >= 6) steps.push(normalizedItem);
    }
  }

  const uniqueIngredients = [...new Set(ingredients)].slice(0, 50);
  const uniqueSteps = [...new Set(steps)].slice(0, 40);
  if (uniqueIngredients.length < 2 || uniqueSteps.length < 1) return null;
  return { ingredients: uniqueIngredients, steps: uniqueSteps };
}

function ingredientName(raw) {
  let value = String(raw ?? "")
    .replace(/^\s*(?:\d+(?:[.,]\d+)?(?:\s+e\s+\d+\/\d+)?|\d+\/\d+|uma?|duas?|meia?)\s+/i, "")
    .replace(
      /^\s*(?:kg|g|gramas?|quilogramas?|litros?|ml|mililitros?|x[ií]caras?(?:\s*\([^)]*\))?|chávenas?|copos?(?:\s*\([^)]*\))?|colheres?(?:\s*\([^)]*\))?|latas?|pacotes?|vidros?|dentes?|unidades?|tabletes?|envelopes?|pitadas?)\s+(?:de\s+)?/i,
      "",
    )
    .replace(/^\s*de\s+/i, "")
    .replace(/\s*[;,.]+$/, "")
    .trim();

  value = value.replace(/\s*\([^)]*(?:picad|cortad|ralad|cozid|fatiad|amassad)[^)]*\)\s*/gi, " ").trim();
  if (!value || value.length < 2) value = String(raw ?? "").trim();
  return value.slice(0, 120);
}

const requestState = new Map();

function minDelayFor(baseUrl) {
  return baseUrl === API_URL ? WIKIBOOKS_MIN_DELAY_MS : COMMONS_MIN_DELAY_MS;
}

async function throttle(baseUrl) {
  const last = requestState.get(baseUrl) ?? 0;
  const minimum = minDelayFor(baseUrl);
  const wait = minimum - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  requestState.set(baseUrl, Date.now());
}

function retryAfterMs(response) {
  const raw = response.headers.get("retry-after");
  if (!raw) return 0;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(raw);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 0;
}

async function mediaWikiRequest(baseUrl, params, sourceLabel) {
  const url = new URL(baseUrl);
  const merged = {
    ...params,
    format: "json",
    formatversion: "2",
    origin: "*",
    maxlag: params.maxlag ?? "5",
  };
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    await throttle(baseUrl);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "ReceitandoAcademic/0.3 (https://receitando.miguelpita.com.br/; contato@miguelpita.com.br)",
        },
      });

      if (response.ok) {
        const payload = await response.json();
        const apiCode = String(payload?.error?.code ?? "").toLowerCase();
        if (!["maxlag", "ratelimited", "readonly"].includes(apiCode)) return payload;
        lastError = new Error(`${sourceLabel} retornou ${apiCode}`);
      } else {
        const body = await response.text().catch(() => "");
        lastError = new Error(`${sourceLabel} respondeu ${response.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
        if (![429, 500, 502, 503, 504].includes(response.status)) throw lastError;

        const headerDelay = retryAfterMs(response);
        const exponential = Math.min(45000, 1200 * 2 ** attempt);
        const jitter = Math.floor(Math.random() * 500);
        const wait = Math.max(headerDelay, exponential + jitter);
        console.warn(`  ↻ ${sourceLabel} limitou a API (${response.status}). Tentativa ${attempt + 1}/${MAX_RETRIES + 1}; aguardando ${Math.ceil(wait / 1000)}s...`);
        await sleep(wait);
        continue;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt >= MAX_RETRIES) break;
    }

    const wait = Math.min(45000, 1200 * 2 ** attempt) + Math.floor(Math.random() * 500);
    console.warn(`  ↻ ${sourceLabel}: ${lastError?.message ?? "erro temporário"}. Nova tentativa em ${Math.ceil(wait / 1000)}s...`);
    await sleep(wait);
  }

  throw lastError ?? new Error(`${sourceLabel}: falha após várias tentativas.`);
}

function mediaWiki(params) {
  return mediaWikiRequest(API_URL, params, "Wikilivros");
}

function commons(params) {
  return mediaWikiRequest(COMMONS_API_URL, params, "Wikimedia Commons");
}

function categoryTitle(value) {
  return String(value).startsWith("Categoria:") ? String(value) : `Categoria:${value}`;
}

async function crawlCategory(rootCategory, goal, sharedPages) {
  const queue = [{ title: categoryTitle(rootCategory), depth: 0 }];
  const visitedCategories = new Set();

  while (queue.length && sharedPages.size < goal) {
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
        cmlimit: "200",
        ...(cmcontinue ? { cmcontinue } : {}),
      });

      for (const member of payload?.query?.categorymembers ?? []) {
        if (member?.ns === 0 && typeof member.title === "string" && member.title.startsWith("Livro de receitas/")) {
          const key = member.pageid ?? member.title;
          if (!sharedPages.has(key)) sharedPages.set(key, { ...member, rootCategory });
        } else if (member?.ns === 14 && current.depth < MAX_CATEGORY_DEPTH && typeof member.title === "string") {
          queue.push({ title: member.title, depth: current.depth + 1 });
        }

        if (sharedPages.size >= goal) break;
      }

      cmcontinue = payload?.continue?.cmcontinue;
    } while (cmcontinue && sharedPages.size < goal);
  }
}

async function discoverRecipePages(selectedCategory, desired) {
  const goal = desired === Infinity
    ? MAX_DISCOVERY_PAGES
    : Math.min(MAX_DISCOVERY_PAGES, Math.max(300, desired * 12));

  const roots = selectedCategory === ALL_CATEGORIES
    ? [MASTER_CATEGORY, ...ALLOWED_CATEGORIES.keys()]
    : [selectedCategory];

  const pages = new Map();
  for (const root of roots) {
    if (pages.size >= goal) break;
    console.log(`Descobrindo páginas em “${root}”... (${pages.size}/${goal})`);
    await crawlCategory(root, goal, pages);
  }

  console.log(`Páginas candidatas descobertas: ${pages.size}.`);
  return [...pages.values()].sort((a, b) => String(a.title).localeCompare(String(b.title), "pt-BR"));
}

function revisionContent(page) {
  const revision = page?.revisions?.[0];
  return revision?.slots?.main?.content ?? revision?.slots?.main?.["*"] ?? revision?.content ?? revision?.["*"] ?? null;
}

async function loadRecipePages(members) {
  if (!members.length) return [];
  const memberByTitle = new Map(members.map((member) => [member.title, member]));
  const payload = await mediaWiki({
    action: "query",
    prop: "revisions|pageimages",
    titles: members.map((member) => member.title).join("|"),
    rvprop: "content",
    rvslots: "main",
    piprop: "name",
    pilicense: "free",
    redirects: "1",
  });

  const loaded = [];
  for (const page of payload?.query?.pages ?? []) {
    const wikitext = revisionContent(page);
    if (typeof wikitext !== "string") continue;
    const original = memberByTitle.get(page.title) ?? members.find((member) => member.pageid === page.pageid) ?? {};
    loaded.push({
      ...original,
      pageid: page.pageid ?? original.pageid,
      title: page.title ?? original.title,
      wikitext,
      pageimage: typeof page.pageimage === "string" ? page.pageimage : null,
    });
  }
  return loaded;
}

function embeddedImageNames(wikitext) {
  const names = [];
  const pattern = /\[\[(?:File|Ficheiro|Imagem):([^|\]\n]+)/gi;
  for (const match of String(wikitext ?? "").matchAll(pattern)) {
    const name = match[1]?.trim();
    if (name) names.push(name);
  }
  return names;
}

function acceptableCommonsImage(fileTitle, info) {
  const mime = String(info?.mime ?? "").toLowerCase();
  if (mime && !["image/jpeg", "image/png", "image/webp"].includes(mime)) return false;

  const normalizedTitle = normalize(fileTitle);
  if (/\b(?:icon|icone|logo|wikibooks|wikipedia|commons|book|livro|mapa|map|flag|bandeira)\b/.test(normalizedTitle)) {
    return false;
  }
  return Boolean(info?.thumburl || info?.url);
}

function licenseLooksFree(license) {
  const value = normalize(license);
  if (!value) return false;
  if (/\b(?:non free|fair use|all rights reserved|copyrighted free use)\b/.test(value)) return false;
  return /(?:cc0|cc by|creative commons|public domain|gfdl|gnu free|attribution)/.test(value);
}

function recipeTokens(recipeTitle) {
  return normalize(recipeTitle)
    .split(" ")
    .filter((token) => token.length >= 3 && !IMAGE_STOPWORDS.has(token));
}

function imageSearchLooksRelevant(recipeTitle, fileTitle, meta) {
  const tokens = recipeTokens(recipeTitle);
  if (!tokens.length) return false;
  const haystack = normalize([
    fileTitle,
    cleanMetadata(meta?.ObjectName?.value),
    cleanMetadata(meta?.ImageDescription?.value),
  ].filter(Boolean).join(" "));
  return tokens.some((token) => haystack.includes(token));
}

function imageFromInfo(fileTitle, info, recipeTitle, requireTitleMatch = false) {
  if (!info || !acceptableCommonsImage(fileTitle, info)) return null;
  const meta = info.extmetadata ?? {};
  const license = cleanMetadata(meta.LicenseShortName?.value || meta.UsageTerms?.value);
  if (!licenseLooksFree(license)) return null;
  if (requireTitleMatch && !imageSearchLooksRelevant(recipeTitle, fileTitle, meta)) return null;

  const imageUrl = normalizedHttpUrl(info.thumburl || info.url);
  const pageUrl = normalizedHttpUrl(info.descriptionurl);
  if (!imageUrl || !pageUrl) return null;

  return {
    url: imageUrl,
    source: IMAGE_SOURCE,
    author: (cleanMetadata(meta.Artist?.value || meta.Credit?.value) || IMAGE_SOURCE).slice(0, 240),
    pageUrl,
    license: license.slice(0, 160),
    licenseUrl: normalizedHttpUrl(meta.LicenseUrl?.value),
    alt: (cleanMetadata(meta.ObjectName?.value || meta.ImageDescription?.value) || recipeTitle).slice(0, 240),
  };
}

function normalizeFileTitle(name) {
  const raw = String(name ?? "").trim();
  if (!raw) return null;
  if (/^File:/i.test(raw)) return raw;
  return `File:${raw.replace(/^(?:Ficheiro|Imagem):/i, "")}`;
}

async function commonsFromDirectCandidates(recipeTitle, candidates) {
  const titles = [...new Set(candidates.map(normalizeFileTitle).filter(Boolean))].slice(0, 15);
  if (!titles.length) return null;

  const payload = await commons({
    action: "query",
    prop: "imageinfo",
    titles: titles.join("|"),
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "1400",
  });

  for (const page of payload?.query?.pages ?? []) {
    const info = page?.imageinfo?.[0];
    const image = imageFromInfo(page?.title ?? "", info, recipeTitle, false);
    if (image) return image;
  }
  return null;
}

async function commonsSearchImage(recipeTitle) {
  const queries = [recipeTitle, `${recipeTitle} food`, `${recipeTitle} dish`];

  for (const query of queries) {
    const payload = await commons({
      action: "query",
      generator: "search",
      gsrsearch: query,
      gsrnamespace: "6",
      gsrlimit: "10",
      prop: "imageinfo",
      iiprop: "url|mime|extmetadata",
      iiurlwidth: "1400",
    });

    for (const page of payload?.query?.pages ?? []) {
      const info = page?.imageinfo?.[0];
      const image = imageFromInfo(page?.title ?? "", info, recipeTitle, true);
      if (image) return image;
    }
  }
  return null;
}

async function freeImageForRecipe(page, recipeTitle) {
  const direct = [page.pageimage, ...embeddedImageNames(page.wikitext)].filter(Boolean);
  const linked = await commonsFromDirectCandidates(recipeTitle, direct);
  if (linked) return linked;
  return commonsSearchImage(recipeTitle);
}

function categoryForRecipe(page, selectedCategory) {
  if (selectedCategory !== ALL_CATEGORIES) return selectedCategory;
  if (ALLOWED_CATEGORIES.has(page.rootCategory)) return page.rootCategory;
  return "Wikilivros";
}

function recipeSql(recipe) {
  const id = `wikibooks-${recipe.pageid}`;
  const title = recipe.title.replace(/^Livro de receitas\//, "").trim();
  const slug = `${slugify(title)}-wikilivros`;
  const encodedTitle = recipe.title.replaceAll(" ", "_").split("/").map((part) => encodeURIComponent(part)).join("/");
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
    ${sql(recipe.image.source)}, ${sql(recipe.image.author)}, ${sql(recipe.image.pageUrl)}, ${sql(recipe.image.license)}, ${sql(recipe.image.licenseUrl)}, ${sql(recipe.image.alt)},
    ${sql(SOURCE_ID)}, ${sql(String(recipe.pageid))}, ${sql(recipe.category)}, NULL,
    ${sql(sourceUrl)}, ${sql("Colaboradores do Wikilivros")}, ${sql(SOURCE_LICENSE)}, ${sql(SOURCE_LICENSE_URL)}, 'pt-BR', ${sql(now)},
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

  const seenIngredients = new Set();
  for (const rawText of recipe.ingredients) {
    const name = ingredientName(rawText);
    const normalizedName = normalize(name);
    if (!normalizedName || seenIngredients.has(normalizedName)) continue;
    seenIngredients.add(normalizedName);

    const fallbackIngredientId = `ext-ing-${shortHash(normalizedName)}`;
    const recipeIngredientId = `wikibooks-ri-${recipe.pageid}-${shortHash(normalizedName)}`;
    statements.push(`INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category, created_at, updated_at)
      VALUES (${sql(fallbackIngredientId)}, ${sql(name)}, ${sql(normalizedName)}, 'outros', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
    statements.push(`INSERT OR REPLACE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional, raw_text)
      SELECT ${sql(recipeIngredientId)}, ${sql(id)}, id, NULL, NULL, 0, ${sql(rawText)}
      FROM ingredients WHERE normalized_name = ${sql(normalizedName)} LIMIT 1;`);
  }

  statements.push(`INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES (${sql(id)}, 'wikilivros');`);
  if (recipe.category && recipe.category !== "Wikilivros") {
    statements.push(`INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES (${sql(id)}, ${sql(slugify(recipe.category))});`);
  }
  return statements.join("\n");
}

function executeD1(sqlText, label) {
  const file = join(tmpdir(), `receitando-wikibooks-${Date.now()}-${shortHash(label)}.sql`);
  writeFileSync(file, sqlText, "utf8");
  console.log(`${label}...`);
  execFileSync("npx", ["wrangler", "d1", "execute", "receitando", "--remote", `--file=${file}`, "--yes"], {
    stdio: "inherit",
    env: process.env,
  });
}

async function main() {
  const { category, limit } = args();
  const targetLabel = limit === Infinity ? "todas as receitas possíveis" : `${limit} receitas`;
  console.log(`Meta: ${targetLabel} com imagem livre. Escopo: “${category}”.`);
  console.log("O importador respeita os limites das APIs Wikimedia e repete automaticamente requisições 429/5xx.");

  const members = await discoverRecipePages(category, limit);
  if (!members.length) throw new Error("Nenhuma página de receita foi descoberta no Wikilivros.");

  const recipes = [];
  const seenIds = new Set();
  let checked = 0;
  let invalidStructure = 0;
  let withoutImage = 0;

  for (let start = 0; start < members.length; start += PAGE_BATCH_SIZE) {
    if (limit !== Infinity && recipes.length >= limit) break;
    const batchMembers = members.slice(start, start + PAGE_BATCH_SIZE);
    const pages = await loadRecipePages(batchMembers);

    for (const page of pages) {
      if (limit !== Infinity && recipes.length >= limit) break;
      checked += 1;
      const parsed = parseRecipe(page.wikitext);
      const displayTitle = String(page.title ?? "").replace(/^Livro de receitas\//, "").trim();
      if (!parsed) {
        invalidStructure += 1;
        continue;
      }

      try {
        const image = await freeImageForRecipe(page, displayTitle);
        if (!image) {
          withoutImage += 1;
          if (withoutImage <= 20 || withoutImage % 25 === 0) console.log(`  - sem foto livre: ${displayTitle}`);
          continue;
        }

        const id = `wikibooks-${page.pageid}`;
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        recipes.push({
          ...page,
          ...parsed,
          image,
          category: categoryForRecipe(page, category),
        });
        console.log(`  ✓ ${displayTitle} · ${image.license} (${recipes.length}${limit === Infinity ? "" : `/${limit}`})`);
      } catch (error) {
        console.warn(`  - imagem ignorada em ${displayTitle}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  console.log(`Verificadas: ${checked}; estrutura inválida: ${invalidStructure}; sem imagem livre: ${withoutImage}; prontas: ${recipes.length}.`);
  if (!recipes.length) throw new Error("Nenhuma receita com estrutura aproveitável e imagem livre foi encontrada.");

  for (let index = 0; index < recipes.length; index += IMPORT_BATCH_SIZE) {
    const batch = recipes.slice(index, index + IMPORT_BATCH_SIZE);
    const sqlText = ["PRAGMA foreign_keys = ON;", ...batch.map(recipeSql)].join("\n\n");
    executeD1(sqlText, `Importando lote ${Math.floor(index / IMPORT_BATCH_SIZE) + 1}/${Math.ceil(recipes.length / IMPORT_BATCH_SIZE)} (${batch.length} receitas)`);
  }

  executeD1(
    [
      "PRAGMA foreign_keys = ON;",
      "DELETE FROM recipes WHERE COALESCE(external_source, '') <> 'wikibooks';",
      "DELETE FROM recipes WHERE external_source = 'wikibooks' AND (image_url IS NULL OR TRIM(image_url) = '');",
    ].join("\n"),
    "Limpando receitas antigas sem foto ou de outras fontes",
  );

  console.log(`Concluído: ${recipes.length} receitas do Wikilivros com imagens livres importadas/atualizadas.`);
  if (limit !== Infinity && recipes.length < limit) {
    console.log(`A meta era ${limit}; o Wikilivros/Commons forneceu ${recipes.length} receitas compatíveis dentro de ${members.length} páginas descobertas.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
