import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const TERMS = Object.freeze({
  TudoGostoso: { domain: "www.tudogostoso.com.br", terms: "https://www.tudogostoso.com.br/termos-de-uso" },
  Receiteria: { domain: "www.receiteria.com.br", terms: "https://www.receiteria.com.br/termos-de-uso/" },
  Panelinha: { domain: "panelinha.com.br", terms: "https://panelinha.com.br/termos-de-uso" }
});
const ALLOWED_FIELDS = ["id", "title", "category", "source", "url", "author", "rights", "termsUrl"];

export function validateReference(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Referência inválida");
  for (const key of Object.keys(item)) {
    if (!ALLOWED_FIELDS.includes(key)) throw new Error("Campo proibido: " + key + ". Não copie imagens, ingredientes ou preparo.");
  }
  const entry = TERMS[item.source];
  if (!entry || item.rights !== "link_only" || item.termsUrl !== entry.terms) {
    throw new Error("Fonte, termos ou direitos não aprovados: " + String(item.id));
  }
  if (!/^(tg|re|pa)-[a-z0-9-]{3,80}$/.test(item.id ?? "")) throw new Error("ID inválido");
  if (typeof item.title !== "string" || item.title.trim().length < 3 || item.title.length > 160) throw new Error("Título inválido");
  if (!["almoço", "jantar", "lanche", "sobremesa", "café da manhã"].includes(item.category)) throw new Error("Categoria inválida");
  const parsed = new URL(item.url);
  if (parsed.protocol !== "https:" || parsed.hostname !== entry.domain || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("URL fora da lista permitida");
  }
  if (item.author !== null && item.author !== undefined && (typeof item.author !== "string" || item.author.length > 100)) {
    throw new Error("Autor inválido");
  }
  return { ...item, title: item.title.trim() };
}

export async function loadReferences() {
  const file = new URL("./external-references-br.json", import.meta.url);
  const data = JSON.parse(await readFile(file, "utf8"));
  if (!Array.isArray(data)) throw new Error("Arquivo deve conter uma lista");
  const items = data.map(validateReference);
  if (new Set(items.map((item) => item.id)).size !== items.length ||
      new Set(items.map((item) => item.url)).size !== items.length) {
    throw new Error("Referências duplicadas");
  }
  return items;
}

async function main() {
  const items = await loadReferences();
  const apply = process.argv.includes("--apply");
  if (!apply) {
    console.log(JSON.stringify({ mode: "dry-run", validReferences: items.length, fullRecipesCopied: 0, thirdPartyImagesCopied: 0 }));
    return;
  }
  if (process.env.ALLOW_EXTERNAL_REFERENCES_WRITE !== "true" || !process.env.POSTGRES_IMPORT_URL) {
    throw new Error("Escrita requer --apply, ALLOW_EXTERNAL_REFERENCES_WRITE=true e POSTGRES_IMPORT_URL");
  }
  const { Client } = await import("pg");
  const client = new Client({ connectionString: process.env.POSTGRES_IMPORT_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    const migration = await readFile(new URL("../migrations/postgres/0002_external_recipe_references.sql", import.meta.url), "utf8");
    await client.query(migration);
    for (const item of items) {
      await client.query(
        `INSERT INTO external_recipe_references
           (id,title,category,source_name,source_url,source_author,terms_url,rights)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (source_url) DO UPDATE SET
           title=EXCLUDED.title, category=EXCLUDED.category,
           source_name=EXCLUDED.source_name, source_author=EXCLUDED.source_author,
           terms_url=EXCLUDED.terms_url, rights=EXCLUDED.rights, updated_at=now()`,
        [item.id,item.title,item.category,item.source,item.url,item.author ?? null,item.termsUrl,item.rights]
      );
    }
    await client.query("COMMIT");
    console.log(JSON.stringify({ mode: "applied", references: items.length, fullRecipesCopied: 0, thirdPartyImagesCopied: 0 }));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
