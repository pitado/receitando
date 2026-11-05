import pantryWorker from "./pantry-worker";
import { buildPasswordResetEmail } from "./lib/password-reset-email";
import { buildPasswordResetEmail } from "./lib/password-reset-email";
import { bytesToBase64Url, hashPassword, sha256, verifyPassword } from "./lib/security";
import {
  apiError,
  corsHeaders,
  type Env,
  json,
  readJson,
} from "./lib/worker-http";

type UserRow = {
  id: string;
  email: string;
};

type ResetRow = {
  id: string;
  user_id: string;
  code_hash: string;
  reset_token_hash: string | null;
  attempts: number;
  expires_at: string;
  verified_at: string | null;
  used_at: string | null;
  created_at: string;
};

const RESET_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const GENERIC_REQUEST_MESSAGE =
  "Se este e-mail estiver cadastrado, você receberá um código de recuperação.";

function generateCode(): string {
  const random = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(random).padStart(6, "0");
}

async function sendResetEmail(env: Env, email: string, code: string): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error("Resend não configurado: defina RESEND_API_KEY e EMAIL_FROM.");
  }

  const message = buildPasswordResetEmail(code);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "Receitando/1.0",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email],
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const rawDetail = await response.text();
    let providerCode = "unknown";
    try {
      const details = JSON.parse(rawDetail) as { name?: string };
      providerCode = String(details.name || "unknown").slice(0, 80);
    } catch { /* Não registrar o corpo bruto: pode conter endereços de e-mail. */ }
    console.error("Password reset provider rejected message", {
      status: response.status,
      providerCode,
    });
    throw new Error("Falha ao enviar e-mail pelo Resend.");
  }

  const responseBody = await response.json().catch(() => null) as { id?: string } | null;
  if (!responseBody?.id) {
    console.error("Password reset provider returned no message ID");
    throw new Error("O provedor de e-mail não confirmou a solicitação.");
  }
  // Aceito pelo provedor não significa entregue na caixa postal (pode haver bounce).
  console.info("Password reset provider accepted message", { providerMessageId: responseBody.id });
}

async function requestReset(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return apiError(request, env, 400, "Informe um e-mail válido.");
  }

  const fakeResetId = crypto.randomUUID();
  const user = await env.db
    .prepare("SELECT id, email FROM users WHERE email = ? LIMIT 1")
    .bind(email)
    .first<UserRow>();

  if (!user) {
    return json(request, env, { message: GENERIC_REQUEST_MESSAGE, resetId: fakeResetId });
  }

  const latest = await env.db
    .prepare(
      `SELECT * FROM password_reset_codes
       WHERE user_id = ? AND used_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(user.id)
    .first<ResetRow>();

  if (latest) {
    const age = Date.now() - new Date(latest.created_at).getTime();
    const stillValid = new Date(latest.expires_at).getTime() > Date.now();
    if (age >= 0 && age < RESEND_COOLDOWN_MS && stillValid) {
      return json(request, env, { message: GENERIC_REQUEST_MESSAGE, resetId: latest.id });
    }
  }

  const resetId = crypto.randomUUID();
  const code = generateCode();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();
  const codeHash = await hashPassword(code);

  await env.db
    .prepare(
      `INSERT INTO password_reset_codes
       (id, user_id, code_hash, attempts, expires_at, created_at)
       VALUES (?, ?, ?, 0, ?, ?)`,
    )
    .bind(resetId, user.id, codeHash, expiresAt, now)
    .run();

  try {
    await sendResetEmail(env, user.email, code);
  } catch (error) {
    await env.db.prepare("DELETE FROM password_reset_codes WHERE id = ?").bind(resetId).run();
    console.error("Password reset email failed", error);
    return apiError(request, env, 502, "Não foi possível enviar o código agora. Tente novamente em instantes.");
  }

  return json(request, env, { message: GENERIC_REQUEST_MESSAGE, resetId });
}

async function verifyResetCode(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const resetId = typeof body?.resetId === "string" ? body.resetId.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!resetId || !/^\d{6}$/.test(code)) {
    return apiError(request, env, 400, "Informe o código de 6 dígitos.");
  }

  const row = await env.db
    .prepare("SELECT * FROM password_reset_codes WHERE id = ? LIMIT 1")
    .bind(resetId)
    .first<ResetRow>();

  const invalid =
    !row ||
    row.used_at !== null ||
    row.attempts >= MAX_CODE_ATTEMPTS ||
    new Date(row.expires_at).getTime() <= Date.now();
  if (invalid || !row) {
    return apiError(request, env, 400, "Código inválido ou expirado. Solicite um novo código.");
  }

  const matches = await verifyPassword(code, row.code_hash);
  if (!matches) {
    await env.db
      .prepare("UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = ?")
      .bind(resetId)
      .run();
    return apiError(request, env, 400, "Código inválido ou expirado. Confira e tente novamente.");
  }

  const resetToken = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const resetTokenHash = await sha256(resetToken);
  await env.db
    .prepare("UPDATE password_reset_codes SET verified_at = ?, reset_token_hash = ? WHERE id = ?")
    .bind(new Date().toISOString(), resetTokenHash, resetId)
    .run();

  return json(request, env, { resetToken });
}

async function resetPassword(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const resetId = typeof body?.resetId === "string" ? body.resetId.trim() : "";
  const resetToken = typeof body?.resetToken === "string" ? body.resetToken.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (password.length < 10 || password.length > 128) {
    return apiError(request, env, 400, "A nova senha deve ter entre 10 e 128 caracteres.");
  }
  if (!resetId || !resetToken) {
    return apiError(request, env, 400, "Validação de recuperação ausente. Solicite um novo código.");
  }

  const row = await env.db
    .prepare("SELECT * FROM password_reset_codes WHERE id = ? LIMIT 1")
    .bind(resetId)
    .first<ResetRow>();

  if (
    !row ||
    !row.verified_at ||
    !row.reset_token_hash ||
    row.used_at ||
    new Date(row.expires_at).getTime() <= Date.now()
  ) {
    return apiError(request, env, 400, "A recuperação expirou. Solicite um novo código.");
  }

  if ((await sha256(resetToken)) !== row.reset_token_hash) {
    return apiError(request, env, 400, "A recuperação é inválida. Solicite um novo código.");
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);

  await env.db.batch([
    env.db
      .prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
      .bind(passwordHash, now, row.user_id),
    env.db
      .prepare("UPDATE password_reset_codes SET used_at = ? WHERE id = ?")
      .bind(now, row.id),
    env.db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(row.user_id),
  ]);

  return json(request, env, { message: "Senha alterada com sucesso. Entre novamente com a nova senha." });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    try {
      if (request.method === "POST" && path === "/api/auth/forgot-password") {
        return requestReset(request, env);
      }
      if (request.method === "POST" && path === "/api/auth/verify-reset-code") {
        return verifyResetCode(request, env);
      }
      if (request.method === "POST" && path === "/api/auth/reset-password") {
        return resetPassword(request, env);
      }

      return pantryWorker.fetch(request, env);
    } catch (error) {
      console.error("Password recovery error", error);
      return apiError(request, env, 500, "Erro interno da API.");
    }
  },
};
