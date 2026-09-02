import { normalizeIngredient } from "./lib/recipe-utils";
import { sha256 } from "./lib/security";
import {
  apiError,
  authenticatedUserId,
  bearerToken,
  corsHeaders,
  type Env,
  json,
  readJson,
} from "./lib/worker-http";

const MAX_INGREDIENTS = 50;
const MAX_STEPS = 30;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const IMAGE_ROUTE_PREFIX = "/api/recipe-submission-images/";
const ADMIN_ROUTE = "/api/admin/recipe-submissions";

type AllowedImageType = "image/jpeg" | "image/png" | "image/webp";
type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

type SubmissionInput = Record<string, unknown> & {
  imageFile?: File;
};

type AdminUserRow = {
  id: string;
  role: "USER" | "ADMIN";
};

type SubmissionRow = {
  id: string;
  userId: string | null;
  authorName: string;
  authorEmail: string | null;
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  prepMinutes: number | null;
  servings: number | null;
  mealType: string | null;
  difficulty: "FACIL" | "MEDIA" | "DIFICIL";
  imageUrl: string | null;
  status: SubmissionStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  publishedRecipeId: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanLines(value: unknown, maxItems: number, maxLength = 180): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function optionalPositiveInt(value: unknown, max: number): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.min(max, Math.floor(parsed));
}

function validImageUrl(value: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      : [];
  } catch {
    return [];
  }
}

function publicSubmission(row: SubmissionRow) {
  return {
    ...row,
    ingredients: parseStringArray(row.ingredients),
    instructions: parseStringArray(row.instructions),
  };
}

async function readSubmissionInput(request: Request): Promise<SubmissionInput | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.toLowerCase().includes("multipart/form-data")) {
    try {
      const form = await request.formData();
      const image = form.get("image");
      return {
        authorName: form.get("authorName"),
        authorEmail: form.get("authorEmail"),
        title: form.get("title"),
        description: form.get("description"),
        ingredients: form.getAll("ingredients").map((item) => String(item)),
        instructions: form.getAll("instructions").map((item) => String(item)),
        prepMinutes: form.get("prepMinutes"),
        servings: form.get("servings"),
        mealType: form.get("mealType"),
        difficulty: form.get("difficulty"),
        website: form.get("website"),
        imageFile: image instanceof File && image.size > 0 ? image : undefined,
      };
    } catch {
      return null;
    }
  }

  const body = await readJson(request);
  return body ?? null;
}

async function detectImageType(file: File): Promise<AllowedImageType | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

function imageExtension(type: AllowedImageType): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

async function uploadImage(
  request: Request,
  env: Env,
  submissionId: string,
  file: File,
  now: string,
): Promise<{ imageUrl: string; objectKey: string } | Response> {
  if (!env.RECIPE_IMAGES) {
    return apiError(request, env, 503, "O envio de fotos está temporariamente indisponível.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return apiError(request, env, 413, "A foto pode ter no máximo 12 MB.");
  }

  const detectedType = await detectImageType(file);
  if (!detectedType) {
    return apiError(request, env, 400, "Envie uma foto JPG, PNG ou WebP válida.");
  }

  const [year, month] = now.slice(0, 7).split("-");
  const objectKey = `submissions/${year}/${month}/${submissionId}.${imageExtension(detectedType)}`;

  await env.RECIPE_IMAGES.put(objectKey, file.stream(), {
    httpMetadata: {
      contentType: detectedType,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      submissionId,
    },
  });

  const origin = new URL(request.url).origin;
  return {
    imageUrl: `${origin}${IMAGE_ROUTE_PREFIX}${objectKey}`,
    objectKey,
  };
}

async function serveSubmissionImage(request: Request, env: Env, path: string): Promise<Response> {
  if (!env.RECIPE_IMAGES) {
    return apiError(request, env, 404, "Imagem não encontrada.");
  }

  let key = "";
  try {
    key = decodeURIComponent(path.slice(IMAGE_ROUTE_PREFIX.length));
  } catch {
    return apiError(request, env, 400, "Endereço de imagem inválido.");
  }

  if (!key || key.includes("..") || !key.startsWith("submissions/")) {
    return apiError(request, env, 404, "Imagem não encontrada.");
  }

  const object = await env.RECIPE_IMAGES.get(key);
  if (!object) return apiError(request, env, 404, "Imagem não encontrada.");

  const headers = corsHeaders(request, env);
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream");
  headers.set("Cache-Control", object.httpMetadata?.cacheControl ?? "public, max-age=31536000, immutable");
  headers.set("ETag", object.httpEtag);
  headers.set("X-Content-Type-Options", "nosniff");

  return new Response(object.body, { status: 200, headers });
}

async function submitRecipe(request: Request, env: Env): Promise<Response> {
  const body = await readSubmissionInput(request);
  if (!body) return apiError(request, env, 400, "Dados inválidos.");

  // Honeypot simples para robôs. Usuários reais nunca preenchem este campo.
  if (cleanText(body.website, 200)) {
    return json(request, env, { message: "Receita recebida para análise." }, 201);
  }

  const authorName = cleanText(body.authorName, 100);
  const authorEmail = cleanText(body.authorEmail, 160).toLowerCase();
  const title = cleanText(body.title, 140);
  const description = cleanText(body.description, 600);
  const ingredients = cleanLines(body.ingredients, MAX_INGREDIENTS);
  const instructions = cleanLines(body.instructions, MAX_STEPS, 500);
  const prepMinutes = optionalPositiveInt(body.prepMinutes, 1440);
  const servings = optionalPositiveInt(body.servings, 100);
  const mealType = cleanText(body.mealType, 60);
  const legacyImageUrl = cleanText(body.imageUrl, 1000);
  const difficultyRaw = cleanText(body.difficulty, 20).toUpperCase();
  const difficulty =
    difficultyRaw === "MEDIA" || difficultyRaw === "DIFICIL" ? difficultyRaw : "FACIL";

  if (authorName.length < 2) return apiError(request, env, 400, "Informe seu nome.");
  if (authorEmail && !/^\S+@\S+\.\S+$/.test(authorEmail)) {
    return apiError(request, env, 400, "Informe um e-mail válido ou deixe o campo vazio.");
  }
  if (title.length < 3) return apiError(request, env, 400, "Informe o nome da receita.");
  if (description.length < 10) return apiError(request, env, 400, "Conte um pouco sobre a receita.");
  if (ingredients.length < 2) return apiError(request, env, 400, "Informe pelo menos 2 ingredientes.");
  if (instructions.length < 1) return apiError(request, env, 400, "Informe o modo de preparo.");
  if (!body.imageFile && !validImageUrl(legacyImageUrl)) {
    return apiError(request, env, 400, "Envie uma foto do prato.");
  }

  const userId = await authenticatedUserId(request, env);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  let imageUrl = legacyImageUrl;
  let uploadedObjectKey = "";

  if (body.imageFile) {
    const upload = await uploadImage(request, env, id, body.imageFile, now);
    if (upload instanceof Response) return upload;
    imageUrl = upload.imageUrl;
    uploadedObjectKey = upload.objectKey;
  }

  try {
    await env.db
      .prepare(`
        INSERT INTO recipe_submissions (
          id, user_id, author_name, author_email, title, description,
          ingredients, instructions, prep_minutes, servings, meal_type,
          difficulty, image_url, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
      `)
      .bind(
        id,
        userId,
        authorName,
        authorEmail || null,
        title,
        description,
        JSON.stringify(ingredients),
        JSON.stringify(instructions),
        prepMinutes,
        servings,
        mealType || null,
        difficulty,
        imageUrl,
        now,
        now,
      )
      .run();
  } catch {
    if (uploadedObjectKey && env.RECIPE_IMAGES) {
      await env.RECIPE_IMAGES.delete(uploadedObjectKey).catch(() => undefined);
    }
    return apiError(request, env, 500, "Não foi possível salvar sua receita agora. Tente novamente.");
  }

  return json(
    request,
    env,
    {
      id,
      status: "PENDING",
      message: "Receita e foto recebidas! Elas ficarão em análise antes de aparecer para todo mundo.",
    },
    201,
  );
}

async function authenticatedAdmin(request: Request, env: Env): Promise<AdminUserRow | null> {
  const token = bearerToken(request);
  if (!token) return null;

  const row = await env.db
    .prepare(`
      SELECT u.id, u.role
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?
      LIMIT 1
    `)
    .bind(await sha256(token), new Date().toISOString())
    .first<AdminUserRow>();

  return row?.role === "ADMIN" ? row : null;
}

async function listAdminSubmissions(request: Request, env: Env, admin: AdminUserRow): Promise<Response> {
  void admin;
  const rawStatus = (new URL(request.url).searchParams.get("status") ?? "PENDING").toUpperCase();
  const status = rawStatus === "APPROVED" || rawStatus === "REJECTED" || rawStatus === "ALL"
    ? rawStatus
    : "PENDING";

  const baseQuery = `
    SELECT id, user_id AS userId, author_name AS authorName, author_email AS authorEmail,
      title, description, ingredients, instructions, prep_minutes AS prepMinutes,
      servings, meal_type AS mealType, difficulty, image_url AS imageUrl, status,
      reviewed_by AS reviewedBy, reviewed_at AS reviewedAt,
      published_recipe_id AS publishedRecipeId, rejection_reason AS rejectionReason,
      created_at AS createdAt, updated_at AS updatedAt
    FROM recipe_submissions
  `;

  const result = status === "ALL"
    ? await env.db.prepare(`${baseQuery} ORDER BY created_at DESC LIMIT 200`).all<SubmissionRow>()
    : await env.db
        .prepare(`${baseQuery} WHERE status = ? ORDER BY created_at DESC LIMIT 200`)
        .bind(status)
        .all<SubmissionRow>();

  return json(request, env, result.results.map(publicSubmission));
}

function slugFromSubmission(title: string, id: string): string {
  const base = normalizeIngredient(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "receita";
  return `${base}-${id.replace(/-/g, "").slice(0, 8)}`;
}

function ingredientNameFromRaw(raw: string): string {
  const withoutAmount = raw
    .trim()
    .replace(/^\s*(?:\d+[\d\s.,/]*|[¼½¾⅓⅔⅛⅜⅝⅞]+)\s*/u, "")
    .replace(
      /^(?:(?:kg|g|mg|l|ml)\b|(?:x[ií]caras?|colheres?|copos?|unidades?|dentes?|fatias?|latas?|pacotes?)\b(?:\s+de)?)[\s:-]*/i,
      "",
    )
    .replace(/\s+(?:a gosto|quanto baste)\s*$/i, "")
    .trim();

  return (withoutAmount || raw.trim()).slice(0, 120);
}

async function approveSubmission(
  request: Request,
  env: Env,
  admin: AdminUserRow,
  submission: SubmissionRow,
): Promise<Response> {
  const ingredients = parseStringArray(submission.ingredients);
  const instructions = parseStringArray(submission.instructions);
  if (ingredients.length < 2 || instructions.length < 1) {
    return apiError(request, env, 409, "A submissão não possui conteúdo suficiente para publicação.");
  }

  const recipeId = `user-${submission.id}`;
  const slug = slugFromSubmission(submission.title, submission.id);
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [
    env.db
      .prepare(`
        INSERT OR IGNORE INTO recipes (
          id, title, slug, description, instructions, prep_minutes, servings,
          meal_type, difficulty, source_type, source_name, image_url,
          source_author, image_source, image_author, image_alt, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'USER', 'Comunidade Receitando', ?, ?, 'Usuário Receitando', ?, ?, ?, ?)
      `)
      .bind(
        recipeId,
        submission.title,
        slug,
        submission.description,
        instructions.join("\n"),
        submission.prepMinutes ?? 30,
        submission.servings ?? 4,
        submission.mealType || "outros",
        submission.difficulty,
        submission.imageUrl,
        submission.authorName,
        submission.authorName,
        submission.title,
        now,
        now,
      ),
  ];

  const seen = new Set<string>();
  for (const rawText of ingredients) {
    const name = ingredientNameFromRaw(rawText);
    const normalizedName = normalizeIngredient(name).slice(0, 140);
    if (!normalizedName || seen.has(normalizedName)) continue;
    seen.add(normalizedName);

    const ingredientId = `user-ing-${crypto.randomUUID()}`;
    const recipeIngredientId = `user-ri-${crypto.randomUUID()}`;
    statements.push(
      env.db
        .prepare(`
          INSERT OR IGNORE INTO ingredients (
            id, name, normalized_name, category, created_at, updated_at
          ) VALUES (?, ?, ?, 'outros', ?, ?)
        `)
        .bind(ingredientId, name, normalizedName, now, now),
      env.db
        .prepare(`
          INSERT OR IGNORE INTO recipe_ingredients (
            id, recipe_id, ingredient_id, quantity, unit, optional, raw_text
          )
          SELECT ?, ?, id, NULL, NULL, 0, ?
          FROM ingredients
          WHERE normalized_name = ?
          LIMIT 1
        `)
        .bind(recipeIngredientId, recipeId, rawText, normalizedName),
    );
  }

  statements.push(
    env.db
      .prepare(`
        UPDATE recipe_submissions
        SET status = 'APPROVED', reviewed_by = ?, reviewed_at = ?,
            published_recipe_id = ?, rejection_reason = NULL, updated_at = ?
        WHERE id = ? AND status = 'PENDING'
      `)
      .bind(admin.id, now, recipeId, now, submission.id),
  );

  await env.db.batch(statements);
  return json(request, env, {
    id: submission.id,
    status: "APPROVED",
    publishedRecipeId: recipeId,
    slug,
    message: "Receita aprovada e publicada no catálogo.",
  });
}

async function moderateSubmission(request: Request, env: Env, admin: AdminUserRow, id: string): Promise<Response> {
  const body = await readJson(request);
  const decision = cleanText(body?.status, 20).toUpperCase();
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    return apiError(request, env, 400, "Informe APPROVED ou REJECTED.");
  }

  const submission = await env.db
    .prepare(`
      SELECT id, user_id AS userId, author_name AS authorName, author_email AS authorEmail,
        title, description, ingredients, instructions, prep_minutes AS prepMinutes,
        servings, meal_type AS mealType, difficulty, image_url AS imageUrl, status,
        reviewed_by AS reviewedBy, reviewed_at AS reviewedAt,
        published_recipe_id AS publishedRecipeId, rejection_reason AS rejectionReason,
        created_at AS createdAt, updated_at AS updatedAt
      FROM recipe_submissions WHERE id = ? LIMIT 1
    `)
    .bind(id)
    .first<SubmissionRow>();

  if (!submission) return apiError(request, env, 404, "Submissão não encontrada.");
  if (submission.status !== "PENDING") {
    return apiError(request, env, 409, "Essa submissão já foi analisada.");
  }

  if (decision === "APPROVED") {
    return approveSubmission(request, env, admin, submission);
  }

  const now = new Date().toISOString();
  const reason = cleanText(body?.reason, 300) || null;
  await env.db
    .prepare(`
      UPDATE recipe_submissions
      SET status = 'REJECTED', reviewed_by = ?, reviewed_at = ?,
          rejection_reason = ?, updated_at = ?
      WHERE id = ? AND status = 'PENDING'
    `)
    .bind(admin.id, now, reason, now, id)
    .run();

  return json(request, env, {
    id,
    status: "REJECTED",
    message: "Receita rejeitada.",
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }
    if (request.method === "GET" && path.startsWith(IMAGE_ROUTE_PREFIX)) {
      return serveSubmissionImage(request, env, path);
    }

    if (path === ADMIN_ROUTE || path.startsWith(`${ADMIN_ROUTE}/`)) {
      const admin = await authenticatedAdmin(request, env);
      if (!admin) return apiError(request, env, 403, "Acesso restrito a administradores.");

      if (request.method === "GET" && path === ADMIN_ROUTE) {
        return listAdminSubmissions(request, env, admin);
      }

      if (request.method === "PATCH" && path.startsWith(`${ADMIN_ROUTE}/`)) {
        let id = "";
        try {
          id = decodeURIComponent(path.slice(`${ADMIN_ROUTE}/`.length));
        } catch {
          return apiError(request, env, 400, "Identificador inválido.");
        }
        if (!id || id.includes("/")) return apiError(request, env, 400, "Identificador inválido.");
        return moderateSubmission(request, env, admin, id);
      }

      return apiError(request, env, 405, "Método não permitido.");
    }

    if (path !== "/api/recipe-submissions") {
      return apiError(request, env, 404, "Rota não encontrada.");
    }
    if (request.method !== "POST") {
      return apiError(request, env, 405, "Método não permitido.");
    }

    return submitRecipe(request, env);
  },
};
