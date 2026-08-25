# Política de Segurança

A segurança do Receitando deve ser tratada de forma responsável, especialmente porque o projeto possui autenticação, sessões, recuperação de senha e dados persistentes.

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
- recuperação de senha;
- autorização de rotas autenticadas;
- Cloudflare D1;
- secrets do GitHub Actions e Cloudflare;
- CORS e políticas de segurança do frontend;
- importadores que escrevem dados no banco.

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

## Conteúdo de terceiros

Questões de licença ou atribuição de receitas/imagens não são vulnerabilidades de segurança, mas devem ser reportadas como problema de conteúdo/licenciamento e corrigidas preservando a procedência da fonte.
