import pantryWorker from "./pantry-worker";
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
      subject: "Seu código está na mesa — volte para sua cozinha",
      text: `Volte para sua cozinha.\n\nParece que a senha ficou fora da receita, mas isso é fácil de resolver.\n\nSeu código de recuperação é: ${code}\n\nEle expira em 10 minutos.\n\nSe você não pediu para trocar sua senha, pode ignorar este e-mail com tranquilidade.\n\nReceitando — ideias para o que já mora na sua cozinha.`,
      html: `
        <!doctype html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <title>Volte para sua cozinha</title>
          </head>
          <body style="margin:0;padding:0;background:#fff6e9;color:#2a1608;font-family:Arial,Helvetica,sans-serif;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Seu código do Receitando está na mesa e expira em 10 minutos.</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#fff6e9;">
              <tr>
                <td align="center" style="padding:40px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#fffaf4;border:1px solid #ead5c5;border-radius:24px;overflow:hidden;">
                    <tr>
                      <td align="center" style="padding:36px 32px 18px;">
                        <img src="https://receitando.miguelpita.com.br/receitando-logo.svg" width="210" alt="Receitando" style="display:block;width:210px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;">
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:12px 40px 0;text-align:center;">
                        <div style="font-size:12px;line-height:1.4;font-weight:800;letter-spacing:2px;color:#c2452c;text-transform:uppercase;">Recuperação de senha</div>
                        <h1 style="margin:14px 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1.05;font-weight:600;color:#2a1608;">Volte para sua cozinha.</h1>
                        <p style="margin:0 auto;max-width:450px;font-size:16px;line-height:1.7;color:#6b4b3b;">Parece que a senha ficou fora da receita, mas isso é fácil de resolver. Seu código já está na mesa.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:30px 40px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f8dfcd;border:1px solid #efc7ad;border-radius:18px;">
                          <tr>
                            <td align="center" style="padding:24px 20px;">
                              <div style="font-size:12px;line-height:1.4;font-weight:800;letter-spacing:1.6px;color:#9a3d28;text-transform:uppercase;">Seu código está na mesa</div>
                              <div style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:38px;line-height:1;font-weight:800;letter-spacing:10px;color:#2a1608;">${code}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 40px 8px;text-align:center;">
                        <p style="margin:0;font-size:15px;line-height:1.7;color:#6b4b3b;">Ele expira em <strong style="color:#2a1608;">10 minutos</strong> — tempo suficiente para voltar ao fogão sem deixar nada queimar.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:22px 40px 36px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-top:1px solid #ead5c5;">
                          <tr>
                            <td style="padding-top:20px;text-align:center;font-size:13px;line-height:1.6;color:#8a6c5b;">Se você não pediu para trocar sua senha, pode ignorar este e-mail. Sua conta continua segura e nenhuma alteração será feita.</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <div style="padding:22px 12px 0;font-size:12px;line-height:1.6;color:#9b7d6c;text-align:center;">Receitando · ideias para o que já mora na sua cozinha.</div>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Resend error", response.status, detail);
    throw new Error("Falha ao enviar e-mail pelo Resend.");
  }
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
