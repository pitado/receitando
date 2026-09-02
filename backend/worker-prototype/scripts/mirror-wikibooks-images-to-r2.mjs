import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DATABASE = "receitando";
const BUCKET = "receitando-recipe-images";
const PUBLIC_PREFIX =
  "https://api.receitando.miguelpita.com.br/api/recipe-submission-images/submissions/catalog/wikibooks/";
const OBJECT_PREFIX = "submissions/catalog/wikibooks";
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_RETRIES = 3;

function sql(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function runWrangler(args, capture = false) {
  return execFileSync("npx", ["wrangler", ...args], {
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
}

function rowsFromWranglerJson(raw) {
  const parsed = JSON.parse(raw);
  const groups = Array.isArray(parsed) ? parsed : [parsed];
  const rows = [];

  for (const group of groups) {
    if (Array.isArray(group?.results)) rows.push(...group.results);
    if (Array.isArray(group?.result)) {
      for (const result of group.result) {
        if (Array.isArray(result?.results)) rows.push(...result.results);
      }
    }
  }

  return rows;
}

function contentTypeInfo(rawType, url) {
  const type = String(rawType ?? "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();

  if (type === "image/jpeg") return { type, extension: "jpg" };
  if (type === "image/png") return { type, extension: "png" };
  if (type === "image/webp") return { type, extension: "webp" };

  const pathname = new URL(url).pathname.toLowerCase();
  if (/\.jpe?g$/.test(pathname)) return { type: "image/jpeg", extension: "jpg" };
  if (/\.png$/.test(pathname)) return { type: "image/png", extension: "png" };
  if (/\.webp$/.test(pathname)) return { type: "image/webp", extension: "webp" };
  return null;
}

async function downloadImage(imageUrl) {
  const url = new URL(imageUrl);
  if (url.protocol !== "https:" || url.hostname !== "upload.wikimedia.org") {
    throw new Error(`origem de imagem não permitida: ${url.hostname}`);
  }

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
          "User-Agent":
            "ReceitandoAcademic/0.4 (https://receitando.miguelpita.com.br/; contato@miguelpita.com.br)",
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const declaredLength = Number(response.headers.get("content-length") ?? 0);
      if (declaredLength > MAX_IMAGE_BYTES) {
        throw new Error(`imagem acima de ${MAX_IMAGE_BYTES} bytes`);
      }

      const info = contentTypeInfo(response.headers.get("content-type"), imageUrl);
      if (!info) throw new Error("formato de imagem não suportado");

      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) {
        throw new Error("tamanho de imagem inválido");
      }

      return { bytes, ...info };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError ?? new Error("falha ao baixar imagem");
}

function objectStem(recipeId) {
  return createHash("sha256").update(String(recipeId)).digest("hex").slice(0, 32);
}

const query = `
  SELECT id, image_url AS imageUrl
  FROM recipes
  WHERE lower(COALESCE(external_source, '')) = 'wikibooks'
    AND image_url IS NOT NULL
    AND trim(image_url) <> ''
    AND image_url LIKE 'https://upload.wikimedia.org/%'
  ORDER BY id
  LIMIT 1000
`;

const rawRows = runWrangler(
  ["d1", "execute", DATABASE, "--remote", "--json", "--command", query],
  true,
);
const rows = rowsFromWranglerJson(rawRows);

if (!rows.length) {
  console.log("✅ Nenhuma imagem externa do Wikilivros precisa ser copiada para o R2.");
  process.exit(0);
}

console.log(`🖼️ ${rows.length} imagem(ns) do catálogo serão copiadas para o R2.`);
const workDir = mkdtempSync(join(tmpdir(), "receitando-r2-"));
let migrated = 0;
let failed = 0;

try {
  for (const [index, row] of rows.entries()) {
    const recipeId = String(row.id ?? "").trim();
    const imageUrl = String(row.imageUrl ?? "").trim();
    if (!recipeId || !imageUrl) continue;

    try {
      const image = await downloadImage(imageUrl);
      const filename = `${objectStem(recipeId)}.${image.extension}`;
      const objectKey = `${OBJECT_PREFIX}/${filename}`;
      const filePath = join(workDir, filename);
      writeFileSync(filePath, image.bytes);

      runWrangler([
        "r2",
        "object",
        "put",
        `${BUCKET}/${objectKey}`,
        "--file",
        filePath,
        "--content-type",
        image.type,
        "--cache-control",
        "public, max-age=31536000, immutable",
        "--remote",
      ]);

      const publicUrl = `${PUBLIC_PREFIX}${filename}`;
      const update = `
        UPDATE recipes
        SET image_url = ${sql(publicUrl)}
        WHERE id = ${sql(recipeId)}
          AND image_url = ${sql(imageUrl)}
      `;
      runWrangler(["d1", "execute", DATABASE, "--remote", "--command", update, "--yes"]);

      migrated += 1;
      console.log(`✅ ${index + 1}/${rows.length} ${recipeId}`);
    } catch (error) {
      failed += 1;
      console.error(
        `⚠️ ${index + 1}/${rows.length} ${recipeId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
} finally {
  rmSync(workDir, { force: true, recursive: true });
}

console.log(`\nR2 concluído: ${migrated} migrada(s), ${failed} falha(s).`);
if (failed > 0 && migrated === 0) process.exitCode = 1;
