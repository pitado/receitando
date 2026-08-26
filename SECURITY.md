# Política de Segurança

A segurança do Receitando deve ser tratada de forma responsável, especialmente porque o projeto possui autenticação, sessões, recuperação de senha, conteúdo externo e dados persistentes.

## Como reportar uma vulnerabilidade

Não publique detalhes exploráveis, credenciais, tokens ou dados de usuários em uma issue pública.

Prefira o canal privado de segurança do próprio GitHub, pela aba **Security** do repositório e pela opção de reportar uma vulnerabilidade de forma privada quando ela estiver disponível.

Se esse recurso não estiver disponível, entre em contato com o mantenedor pelo perfil do GitHub antes de divulgar detalhes técnicos sensíveis.

## O que informar

Um bom relato deve conter, quando possível:

- componente afetado;
- comportamento observado;
- impacto potencial;
- passos mínimos para reproduzir;
- versão/commit afetado;
- sugestão de correção, se houver.

Evite incluir dados reais de terceiros. Use contas e valores de teste.

## Escopo de segurança

Áreas especialmente sensíveis:

- cadastro e login;
- hash e verificação de senhas;
- tokens de sessão;
- recuperação de senha e envio pelo Resend;
- autorização de rotas autenticadas;
- rate limiting;
- Cloudflare D1;
- secrets do GitHub Actions e Cloudflare;
- CORS e políticas de segurança do frontend;
- importadores que escrevem dados no banco;
- conteúdo externo exibido no frontend.

## Sessão no navegador

A sessão de autenticação é entregue ao navegador por cookie `HttpOnly`, em vez de ser armazenada em `localStorage` ou `sessionStorage`.

Em produção o cookie usa:

- `HttpOnly` — JavaScript do frontend não consegue ler a credencial;
- `Secure` — o cookie só é enviado por HTTPS;
- `SameSite=Strict` — reduz o risco de envio em contexto cross-site;
- prefixo `__Host-` e `Path=/` — evita escopo de domínio mais amplo do que o necessário.

O frontend utiliza `credentials: "include"` nas chamadas à API. CORS com credenciais só é liberado para origens configuradas explicitamente, e operações mutáveis vindas do navegador validam `Origin` como defesa adicional contra CSRF.

A API persiste somente o hash SHA-256 do token na tabela de sessões. O token bruto é usado internamente para compor o cookie e não é devolvido no contrato público final de login/cadastro.

## Senhas e tokens

A implementação Worker usa Web Crypto API.

- senhas são derivadas com PBKDF2 e salt aleatório;
- tokens de sessão são aleatórios e somente seu SHA-256 é persistido;
- códigos/tokens de recuperação são armazenados de forma derivada/hash;
- comparações de hashes de senha usam verificação em tempo constante no helper compartilhado.

## Rate limiting

O entrypoint da API aplica proteção versionada para reduzir força bruta e abuso de recursos pagos/limitados.

Os buckets atuais cobrem:

- login por e-mail;
- login por IP;
- cadastro por IP;
- solicitação de recuperação de senha por e-mail;
- solicitação de recuperação de senha por IP.

Ao atingir o limite, a API responde `429` com `Retry-After`. E-mails e IPs usados nesses controles são persistidos apenas como chaves SHA-256.

Uma regra de WAF/Rate Limiting na borda da Cloudflare pode complementar essa defesa antes de a requisição chegar ao Worker e ao D1.

## Conteúdo externo e XSS

O importador consome conteúdo do Wikilivros, mas o fluxo atual não entrega HTML bruto da fonte para a página de receita.

O importador remove tags/markup aproveitável e persiste conteúdo culinário como texto. O frontend renderiza essas strings como texto React e não utiliza `dangerouslySetInnerHTML` para a receita.

Se futuramente for necessário renderizar HTML rico vindo de fonte externa ou conteúdo criado por usuário, ele deverá passar por sanitização apropriada antes da renderização. HTML externo não deve ser introduzido diretamente em `dangerouslySetInnerHTML`.

## Queries e banco

Valores recebidos por requisições da API devem ser enviados ao D1 por statements preparados com `.bind()`. SQL dinâmico pode ser usado apenas para estrutura controlada internamente, como a quantidade de placeholders `?`, nunca para interpolar texto fornecido pelo usuário.

As migrations usam chaves estrangeiras e políticas de cascata/restrição para proteger integridade referencial.

## Secrets e credenciais

Nunca devem ser commitados:

- `CLOUDFLARE_API_TOKEN`;
- `CLOUDFLARE_ACCOUNT_ID` quando tratado como credencial operacional;
- `RESEND_API_KEY`;
- tokens de sessão;
- senhas;
- códigos de recuperação;
- arquivos `.env` reais;
- dados privados de usuários.

Arquivos `.env.example` devem conter apenas nomes de variáveis, placeholders e valores locais não sensíveis.

## Atualizações de segurança

Correções de vulnerabilidades devem:

1. ser testadas;
2. passar por typecheck/build/dry-run aplicáveis;
3. receber teste de regressão quando possível;
4. evitar expor o exploit em mensagens de commit antes da correção estar disponível;
5. atualizar documentação relevante quando o comportamento de segurança mudar.

## Conteúdo e licenciamento

Questões de licença ou atribuição de receitas/imagens não são vulnerabilidades de segurança, mas devem ser corrigidas preservando a procedência da fonte. Consulte [`docs/catalogo.md`](docs/catalogo.md).
