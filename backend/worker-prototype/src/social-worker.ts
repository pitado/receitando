import profileWorker from "./profile-worker";
import { sha256 } from "./lib/security";
import {
  apiError,
  bearerToken,
  corsHeaders,
  type Env,
  json,
  readJson,
} from "./lib/worker-http";

type SocialUser = {
  id: string;
  name: string;
  handle: string | null;
  avatarKey: string;
};

type CommentRow = {
  id: string;
  recipeId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName: string;
  userHandle: string | null;
  userAvatarKey: string;
};

const MAX_COMMENT_LENGTH = 1200;

async function authenticatedUser(request: Request, env: Env): Promise<SocialUser | null> {
  const token = bearerToken(request);
  if (!token) return null;

  return (
    (await env.db
      .prepare(
        `SELECT u.id, u.name, u.handle, u.avatar_key AS avatarKey
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > ?
         LIMIT 1`,
      )
      .bind(await sha256(token), new Date().toISOString())
      .first<SocialUser>()) ?? null
  );
}

async function recipeExists(env: Env, recipeId: string): Promise<boolean> {
  return Boolean(
    await env.db.prepare("SELECT id FROM recipes WHERE id = ? LIMIT 1").bind(recipeId).first(),
  );
}

async function socialSummary(request: Request, env: Env, recipeId: string): Promise<Response> {
  if (!(await recipeExists(env, recipeId))) {
    return apiError(request, env, 404, "Receita não encontrada.");
  }

  const counts = await env.db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN vote = 'LIKE' THEN 1 ELSE 0 END), 0) AS likes,
        COALESCE(SUM(CASE WHEN vote = 'DISLIKE' THEN 1 ELSE 0 END), 0) AS dislikes
       FROM recipe_votes WHERE recipe_id = ?`,
    )
    .bind(recipeId)
    .first<{ likes: number; dislikes: number }>();

  const user = await authenticatedUser(request, env);
  let myVote: "LIKE" | "DISLIKE" | null = null;
  if (user) {
    const row = await env.db
      .prepare("SELECT vote FROM recipe_votes WHERE user_id = ? AND recipe_id = ? LIMIT 1")
      .bind(user.id, recipeId)
      .first<{ vote: "LIKE" | "DISLIKE" }>();
    myVote = row?.vote ?? null;
  }

  return json(request, env, {
    likes: Number(counts?.likes ?? 0),
    dislikes: Number(counts?.dislikes ?? 0),
    myVote,
  });
}

async function setVote(request: Request, env: Env, recipeId: string): Promise<Response> {
  const user = await authenticatedUser(request, env);
  if (!user) return apiError(request, env, 401, "Entre na sua conta para avaliar esta receita.");
  if (!(await recipeExists(env, recipeId))) {
    return apiError(request, env, 404, "Receita não encontrada.");
  }

  const body = await readJson(request);
  const vote = body?.vote;
  if (vote !== "LIKE" && vote !== "DISLIKE") {
    return apiError(request, env, 400, "Avaliação inválida.");
  }

  const now = new Date().toISOString();
  await env.db
    .prepare(
      `INSERT INTO recipe_votes (user_id, recipe_id, vote, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, recipe_id) DO UPDATE SET vote = excluded.vote, updated_at = excluded.updated_at`,
    )
    .bind(user.id, recipeId, vote, now, now)
    .run();

  return socialSummary(request, env, recipeId);
}

async function removeVote(request: Request, env: Env, recipeId: string): Promise<Response> {
  const user = await authenticatedUser(request, env);
  if (!user) return apiError(request, env, 401, "Entre na sua conta para avaliar esta receita.");

  await env.db
    .prepare("DELETE FROM recipe_votes WHERE user_id = ? AND recipe_id = ?")
    .bind(user.id, recipeId)
    .run();

  return socialSummary(request, env, recipeId);
}

function serializeComment(row: CommentRow, currentUserId: string | null) {
  return {
    id: row.id,
    recipeId: row.recipeId,
    body: row.body,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    canEdit: currentUserId === row.userId,
    author: {
      id: row.userId,
      name: row.userName,
      handle: row.userHandle,
      avatarKey: row.userAvatarKey,
    },
  };
}

async function listComments(request: Request, env: Env, recipeId: string): Promise<Response> {
  if (!(await recipeExists(env, recipeId))) {
    return apiError(request, env, 404, "Receita não encontrada.");
  }

  const user = await authenticatedUser(request, env);
  const result = await env.db
    .prepare(
      `SELECT c.id, c.recipe_id AS recipeId, c.body, c.created_at AS createdAt, c.updated_at AS updatedAt,
              u.id AS userId, u.name AS userName, u.handle AS userHandle, u.avatar_key AS userAvatarKey
       FROM recipe_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.recipe_id = ?
       ORDER BY c.created_at DESC`,
    )
    .bind(recipeId)
    .all<CommentRow>();

  return json(
    request,
    env,
    result.results.map((row) => serializeComment(row, user?.id ?? null)),
  );
}

async function createComment(request: Request, env: Env, recipeId: string): Promise<Response> {
  const user = await authenticatedUser(request, env);
  if (!user) return apiError(request, env, 401, "Entre na sua conta para comentar.");
  if (!(await recipeExists(env, recipeId))) {
    return apiError(request, env, 404, "Receita não encontrada.");
  }

  const body = await readJson(request);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (text.length < 2 || text.length > MAX_COMMENT_LENGTH) {
    return apiError(
      request,
      env,
      400,
      `O comentário deve ter entre 2 e ${MAX_COMMENT_LENGTH} caracteres.`,
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.db
    .prepare("INSERT INTO recipe_comments (id, recipe_id, user_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, recipeId, user.id, text, now, now)
    .run();

  return listComments(request, env, recipeId);
}

async function commentOwner(env: Env, commentId: string) {
  return env.db
    .prepare("SELECT id, recipe_id AS recipeId, user_id AS userId FROM recipe_comments WHERE id = ? LIMIT 1")
    .bind(commentId)
    .first<{ id: string; recipeId: string; userId: string }>();
}

async function updateComment(request: Request, env: Env, commentId: string): Promise<Response> {
  const user = await authenticatedUser(request, env);
  if (!user) return apiError(request, env, 401, "Entre na sua conta para editar seu comentário.");

  const comment = await commentOwner(env, commentId);
  if (!comment) return apiError(request, env, 404, "Comentário não encontrado.");
  if (comment.userId !== user.id) {
    return apiError(request, env, 403, "Você só pode editar seus próprios comentários.");
  }

  const body = await readJson(request);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (text.length < 2 || text.length > MAX_COMMENT_LENGTH) {
    return apiError(
      request,
      env,
      400,
      `O comentário deve ter entre 2 e ${MAX_COMMENT_LENGTH} caracteres.`,
    );
  }

  await env.db
    .prepare("UPDATE recipe_comments SET body = ?, updated_at = ? WHERE id = ?")
    .bind(text, new Date().toISOString(), commentId)
    .run();

  return listComments(request, env, comment.recipeId);
}

async function deleteComment(request: Request, env: Env, commentId: string): Promise<Response> {
  const user = await authenticatedUser(request, env);
  if (!user) return apiError(request, env, 401, "Entre na sua conta para excluir seu comentário.");

  const comment = await commentOwner(env, commentId);
  if (!comment) return apiError(request, env, 404, "Comentário não encontrado.");
  if (comment.userId !== user.id) {
    return apiError(request, env, 403, "Você só pode excluir seus próprios comentários.");
  }

  await env.db.prepare("DELETE FROM recipe_comments WHERE id = ?").bind(commentId).run();
  return listComments(request, env, comment.recipeId);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const socialMatch = path.match(/^\/api\/recipes\/([^/]+)\/social$/);
    if (socialMatch && request.method === "GET") {
      return socialSummary(request, env, decodeURIComponent(socialMatch[1]));
    }

    const voteMatch = path.match(/^\/api\/recipes\/([^/]+)\/vote$/);
    if (voteMatch && request.method === "PUT") {
      return setVote(request, env, decodeURIComponent(voteMatch[1]));
    }
    if (voteMatch && request.method === "DELETE") {
      return removeVote(request, env, decodeURIComponent(voteMatch[1]));
    }

    const commentsMatch = path.match(/^\/api\/recipes\/([^/]+)\/comments$/);
    if (commentsMatch && request.method === "GET") {
      return listComments(request, env, decodeURIComponent(commentsMatch[1]));
    }
    if (commentsMatch && request.method === "POST") {
      return createComment(request, env, decodeURIComponent(commentsMatch[1]));
    }

    const commentMatch = path.match(/^\/api\/recipe-comments\/([^/]+)$/);
    if (commentMatch && request.method === "PATCH") {
      return updateComment(request, env, decodeURIComponent(commentMatch[1]));
    }
    if (commentMatch && request.method === "DELETE") {
      return deleteComment(request, env, decodeURIComponent(commentMatch[1]));
    }

    return profileWorker.fetch(request, env);
  },
};
