/**
 * Modelo transacional Receitando — CSS inline e layout em tabelas para
 * funcionar em Gmail, Apple Mail e clientes com CSS limitado.
 * A tipografia Bowlby One/Onest do site tem fallback seguro para e-mail.
 */
export type PasswordResetEmail = { subject: string; text: string; html: string };

export function buildPasswordResetEmail(code: string): PasswordResetEmail {
  if (!/^\d{6}$/.test(code)) throw new Error("O código deve conter exatamente 6 dígitos.");

  const subject = "Seu código de recuperação | Receitando";
  const text = [
    "RECEITANDO",
    "Sua cozinha está te esperando.",
    "",
    "Você pediu para redefinir a senha da sua conta Receitando.",
    `Seu código de recuperação é: ${code}`,
    "Ele expira em 10 minutos.",
    "",
    "Volte à aba do Receitando em que pediu o código e informe os seis dígitos.",
    "Se você não solicitou essa alteração, ignore esta mensagem. Sua senha não foi alterada.",
    "",
    "Receitando — menos desperdício, mais comida boa.",
    "https://receitando.miguelpita.com.br",
  ].join("\n");

  const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recuperar senha — Receitando</title></head>
<body style="margin:0;padding:0;background:#F6E9D7;color:#2E1A10;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;font-size:1px;max-height:0;opacity:0;overflow:hidden;color:#F6E9D7;">Seu código de recuperação do Receitando expira em 10 minutos.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#F6E9D7;">
    <tr><td align="center" style="padding:28px 14px 48px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;max-width:580px;">
        <tr>
          <td align="left" style="background:#96462B;border-radius:22px 22px 0 0;padding:30px 28px 28px;">
            <p style="margin:0 0 28px;color:#FBF2E8;font-family:'Arial Black',Arial,Helvetica,sans-serif;font-size:31px;font-weight:900;letter-spacing:-1px;line-height:1.2;">receitando<span style="color:#E9C9A0;">.</span></p>
            <p style="margin:0 0 10px;color:#E9C9A0;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">RECUPERAÇÃO DE SENHA</p>
            <h1 style="margin:0;color:#FBF2E8;font-family:'Arial Black',Arial,Helvetica,sans-serif;font-size:32px;font-weight:900;letter-spacing:-.6px;line-height:1.22;">Sua cozinha está te esperando.</h1>
          </td>
        </tr>
        <tr>
          <td align="left" style="background:#FBF2E8;padding:30px 28px 18px;">
            <p style="margin:0 0 22px;color:#644B3C;font-size:16px;line-height:1.65;">Recebemos um pedido para redefinir sua senha. Use o código abaixo para voltar às suas receitas, à despensa e a tudo que você gosta de preparar.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;background:#F0D8B9;border:1px solid #E3C7A7;border-radius:18px;">
              <tr><td align="center" style="padding:26px 12px 23px;">
                <p style="margin:0 0 12px;color:#95462A;font-size:11px;font-weight:800;letter-spacing:1.7px;text-transform:uppercase;">SEU CÓDIGO DE RECUPERAÇÃO</p>
                <p style="margin:0;color:#2E1A10;font-family:Consolas,'Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:7px;line-height:1.2;white-space:nowrap;">${code}</p>
                <p style="margin:14px 0 0;color:#6D4935;font-size:13px;font-weight:700;">Válido por 10 minutos</p>
              </td></tr>
            </table>
            <p style="margin:22px 0 0;color:#644B3C;font-size:14px;line-height:1.65;">Volte à aba do Receitando onde você pediu o código e digite os seis números para criar uma nova senha.</p>
          </td>
        </tr>
        <tr>
          <td align="left" style="background:#FBF2E8;border-radius:0 0 22px 22px;padding:8px 28px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid #E2C8A8;">
              <tr><td style="padding-top:20px;">
                <p style="margin:0;color:#806453;font-size:13px;line-height:1.65;">Não pediu para trocar a senha? Pode ignorar este e-mail. Sua conta continua protegida e nada será alterado.</p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="max-width:520px;margin:23px 0 0;color:#7A5A44;font-size:12px;line-height:1.7;text-align:center;">Receitando · Menos desperdício, mais comida boa.<br><a href="https://receitando.miguelpita.com.br" style="color:#96462B;text-decoration:underline;">receitando.miguelpita.com.br</a></p>
    </td></tr>
  </table>
</body></html>`;
  return { subject, text, html };
}
