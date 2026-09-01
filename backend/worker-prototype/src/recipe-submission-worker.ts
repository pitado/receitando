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
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

async function submitRecipe(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
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
  const imageUrl = cleanText(body.imageUrl, 1000);
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
  if (!validImageUrl(imageUrl)) {
    return apiError(request, env, 400, "A imagem precisa usar um endereço HTTPS válido.");
  }

  const userId = await authenticatedUserId(request, env);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

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
      imageUrl || null,
      now,
      now,
    )
    .run();

  return json(
    request,
    env,
    {
      id,
      status: "PENDING",
      message: "Receita recebida! Ela ficará em análise antes de aparecer para todo mundo.",
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
    if (path !== "/api/recipe-submissions") {
      return apiError(request, env, 404, "Rota não encontrada.");
    }
    if (request.method !== "POST") {
      return apiError(request, env, 405, "Método não permitido.");
    }

    return submitRecipe(request, env);
  },
};
