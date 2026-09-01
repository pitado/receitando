import {
  apiError,
  authenticatedUserId,
  corsHeaders,
  type Env,
  json,
  readJson,
} from "./lib/worker-http";

const MAX_INGREDIENTS = 50;
const MAX_STEPS = 30;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const IMAGE_ROUTE_PREFIX = "/api/recipe-submission-images/";

type AllowedImageType = "image/jpeg" | "image/png" | "image/webp";

type SubmissionInput = Record<string, unknown> & {
  imageFile?: File;
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }
    if (request.method === "GET" && path.startsWith(IMAGE_ROUTE_PREFIX)) {
      return serveSubmissionImage(request, env, path);
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
