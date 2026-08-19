import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function pick(row, names, fallback = "") {
  for (const name of names) {
    if (row?.[name] !== undefined && row?.[name] !== null && row?.[name] !== "") return row[name];
  }
  return fallback;
}

function cleanQuery(value) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^\p{L}\p{N}' -]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

async function searchPexels(query, apiKey) {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("size", "medium");
  url.searchParams.set("per_page", "1");
  url.searchParams.set("page", "1");
  url.searchParams.set("locale", "en-US");

  const response = await fetch(url, {
    headers: { Authorization: apiKey },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pexels ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  return Array.isArray(data.photos) && data.photos.length ? data.photos[0] : null;
}

const input = resolve(arg("input", "./dataset-64k/recipes-normalized.json"));
const output = resolve(arg("output", "./dataset-64k/recipes-with-images.json"));
const manifestPath = resolve(arg("manifest", "./dataset-64k/images-manifest.json"));
const offset = Math.max(0, Number(arg("offset", "0")) || 0);
const limit = Math.max(1, Number(arg("limit", "100")) || 100);
const apiKey = process.env.PEXELS_API_KEY?.trim();

if (!apiKey) {
  throw new Error("PEXELS_API_KEY não configurada. Adicione a chave como GitHub Actions secret antes de importar receitas com fotos.");
}

if (limit > 180) {
  throw new Error("Por segurança com o limite padrão da API do Pexels, use no máximo 180 receitas por execução. Recomendado: 100.");
}

const rows = JSON.parse(readFileSync(input, "utf8"));
if (!Array.isArray(rows)) throw new Error("O JSON normalizado não contém uma lista de receitas.");

const selected = rows.slice(offset, offset + limit);
const kept = [];
let withoutPhoto = 0;

for (let index = 0; index < selected.length; index += 1) {
  const row = selected[index];
  const title = cleanQuery(pick(row, ["recipe_title", "title", "Title", "name", "Name", "recipe_name"]));
  if (!title) {
    withoutPhoto += 1;
    continue;
  }

  const category = cleanQuery(pick(row, ["category", "Category", "subcategory", "Subcategory"]));
  const query = `${title}${category ? ` ${category}` : ""} food dish`;
  const photo = await searchPexels(query, apiKey);

  if (!photo?.src?.large && !photo?.src?.large2x && !photo?.src?.medium) {
    withoutPhoto += 1;
    console.log(`[sem foto] ${title}`);
    continue;
  }

  kept.push({
    ...row,
    _image_url: photo.src.large2x || photo.src.large || photo.src.medium,
    _image_source: "Pexels",
    _image_author: photo.photographer || null,
    _image_page_url: photo.url || null,
    _image_alt: photo.alt || title,
  });
  console.log(`[foto] ${title} -> ${photo.photographer || "Pexels"}`);
}

writeFileSync(output, JSON.stringify(kept, null, 2), "utf8");
writeFileSync(
  manifestPath,
  JSON.stringify({
    offset,
    requested: limit,
    checked: selected.length,
    withPhoto: kept.length,
    discardedWithoutPhoto: withoutPhoto,
    provider: "Pexels",
  }, null, 2),
  "utf8",
);

console.log(`Fotos: ${kept.length}/${selected.length} receitas mantidas; ${withoutPhoto} descartadas.`);
