export type ResetEmail = {
  subject: string;
  text: string;
  html: string;
};

/**
 * E-mail transacional sem fontes externas ou imagens obrigatórias:
 * a identidade visual aparece mesmo em clientes que bloqueiam imagens.
 */
export function buildPasswordResetEmail(code: string): ResetEmail {
  if (!/^\d{6}$/.test(code)) {
    throw new Error("Código de recuperação inválido.");
  }

  const subject = "Seu código de recuperação | Receitando";
  const text = [
    "RECEITANDO",
    "",
    "Seu código está pronto.",
    "",
    "Recebemos um pedido para trocar a senha da sua conta.",
    "Digite este código na tela de recuperação do Receitando:",
    "",
    code,
    "",
    "O código expira em 10 minutos.",
    "Volte à aba onde você solicitou a recuperação para digitá-lo.",
    "",
    "Se você não solicitou a troca de senha, ignore esta mensagem.",
    "Sua senha não será alterada por causa deste e-mail.",
    "",
    "Receitando — https://receitando.miguelpita.com.br",
  ].join("\n");

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Seu código de recuperação | Receitando</title>
</head>
<body style="margin:0;padding:0;background:#f6e9d7;color:#2e1a10;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;font-size:1px;line-height:1px;color:#f6e9d7;max-height:0;max-width:0;opacity:0;overflow:hidden;">Seu código de 6 dígitos expira em 10 minutos.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6e9d7;border-collapse:collapse;">
    <tr><td align="center" style="padding:30px 14px 44px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background:#fbf2e8;border-collapse:separate;border-spacing:0;border:1px solid #e2c8a8;border-radius:24px;overflow:hidden;">
        <tr><td style="background:#96462b;padding:32px 30px 29px;text-align:center;">
          <div style="font-family:Impact,'Arial Black',Arial,sans-serif;font-weight:900;font-size:39px;line-height:1;letter-spacing:-1px;color:#fbf2e8;text-transform:lowercase;">receitando<span style="color:#e9c9a0;">.</span></div>
          <div style="padding-top:13px;font-size:11px;font-weight:800;letter-spacing:2px;color:#f7debd;">SUA COZINHA, SUAS RECEITAS</div>
        </td></tr>
        <tr><td style="padding:36px 32px 10px;text-align:center;">
          <p style="margin:0 0 14px;font-size:12px;letter-spacing:1.8px;font-weight:800;color:#96462b;text-transform:uppercase;">Recuperação de senha</p>
          <h1 style="margin:0;color:#2e1a10;font-family:Impact,'Arial Black',Arial,sans-serif;font-size:34px;line-height:1.15;letter-spacing:-.5px;font-weight:900;">Seu código está pronto.</h1>
          <p style="margin:18px auto 0;max-width:420px;color:#70513d;font-size:16px;line-height:1.65;">Parece que a senha ficou fora da receita? Sem problema. Digite o código abaixo na tela de recuperação para voltar à sua cozinha.</p>
        </td></tr>
        <tr><td style="padding:28px 28px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;background:#eed8bc;border:1px solid #d8ae86;border-radius:18px;">
            <tr><td align="center" style="padding:27px 10px;">
              <div style="font-size:12px;font-weight:800;letter-spacing:1.2px;color:#6e3b24;">SEU CÓDIGO</div>
              <div style="font-family:'Arial Black',Arial,Helvetica,sans-serif;font-weight:900;font-size:clamp(28px,8vw,40px);line-height:1.25;letter-spacing:7px;color:#2e1a10;padding-top:12px;">${code}</div>
              <div style="margin-top:14px;color:#6e3b24;font-size:14px;line-height:1.5;"><strong>Válido por 10 minutos.</strong></div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:8px 34px 25px;text-align:center;">
          <p style="margin:0;color:#70513d;font-size:14px;line-height:1.65;">Volte à aba do Receitando onde solicitou a recuperação e informe os seis números. O código é pessoal: não compartilhe com ninguém.</p>
        </td></tr>
        <tr><td style="padding:0 28px 34px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0;width:100%;background:#f3e3d0;border-radius:14px;">
            <tr><td style="padding:18px 19px;color:#6a4835;font-size:13px;line-height:1.65;">
              <strong style="color:#2e1a10;">Não foi você?</strong> Pode ignorar este e-mail. Sua senha permanece a mesma.
            </td></tr>
          </table>
        </td></tr>
      </table>
      <p style="max-width:580px;margin:18px 12px 0;color:#856954;font-size:12px;line-height:1.6;text-align:center;">Receitando · Menos desperdício, mais comida boa.<br /><a href="https://receitando.miguelpita.com.br" style="color:#96462b;text-decoration:underline;">receitando.miguelpita.com.br</a></p>
    </td></tr>
  </table>
</body>
</html>`;
  return { subject, text, html };
}
