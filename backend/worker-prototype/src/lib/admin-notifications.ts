import type { Env } from "./worker-http";

const NOTIFICATION_TO = "Miguelpitando@gmail.com";

/** Best-effort admin notification. Never include passwords, tokens or private user data. */
export async function notifyNewRegistration(env: Env): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.warn("Admin notification skipped: Resend not configured");
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [NOTIFICATION_TO],
      subject: "🎉 Receitando — novo cadastro",
      text: "Uma nova pessoa acabou de criar uma conta no Receitando!\n\nData: " + new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) + "\n\nEste aviso não inclui dados pessoais da pessoa cadastrada.",
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    console.error("Admin registration notification rejected", { status: response.status });
  }
}
