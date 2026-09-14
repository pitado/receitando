# Upload de receitas e acesso à conta no celular

Este documento registra o comportamento mobile atual das jornadas de **Enviar receita** e **Entrar/Conta**.

## Acesso pela navegação

A navegação principal inclui o link **Enviar receita**, que leva a:

```text
/enviar-receita
```

Em telas menores, a navegação usa rolagem horizontal (`overflow-x: auto`) para manter as opções acessíveis sem comprimir os textos. O controle de autenticação permanece separado da faixa de navegação:

- usuário anônimo vê **Entrar**;
- usuário autenticado vê o avatar/atalho da conta;
- em telas maiores, o cabeçalho também mostra nome, `@` e o botão **Sair**.

O estado real da sessão vem do cookie `HttpOnly`. O componente de autenticação consulta a API mesmo quando não existe um indicador local de sessão, mantendo o login funcional em cenários como Safari e modo privado.

## Formulário de envio

A página `/enviar-receita` usa `RecipeSubmissionForm` e envia os dados em `multipart/form-data` para:

```text
POST /api/recipe-submissions
```

O envio pode ser feito sem login. Quando existe uma sessão válida, a API associa o `user_id` à submissão; quando não existe, `user_id` permanece nulo.

Campos principais:

- nome do autor;
- e-mail opcional;
- nome da receita;
- descrição;
- ingredientes, um por linha;
- modo de preparo, um passo por linha;
- tempo opcional;
- porções opcionais;
- dificuldade;
- tipo de refeição opcional;
- foto do prato.

## Foto no celular

No fluxo atual do frontend, a foto é **obrigatória** para concluir o envio.

O input aceita:

```text
image/jpeg
image/png
image/webp
```

Limite:

```text
12 MB
```

Em navegadores mobile, o seletor de arquivo pode oferecer câmera, galeria ou arquivos conforme o sistema operacional e o navegador. O Receitando não força a câmera com atributo `capture`; ele usa o seletor nativo do dispositivo.

Antes do envio, o frontend:

1. verifica o tipo informado pelo navegador;
2. verifica o limite de 12 MB;
3. gera uma prévia local com `URL.createObjectURL()`;
4. inclui o arquivo no `FormData`.

A API repete a validação e não confia apenas no nome, extensão ou `Content-Type` enviado pelo cliente. O Worker lê a assinatura inicial do arquivo e aceita somente JPG, PNG ou WebP válidos.

## Armazenamento da imagem

Fotos enviadas ficam no Cloudflare R2 usando o binding:

```text
RECIPE_IMAGES
```

Bucket:

```text
receitando-recipe-images
```

Chave gerada:

```text
submissions/AAAA/MM/{submissionId}.{ext}
```

A URL persistida aponta para a própria API:

```text
/api/recipe-submission-images/:key
```

A rota de imagem:

- aceita somente chaves sob `submissions/`;
- rejeita tentativa de travessia de caminho;
- devolve o `Content-Type` salvo no R2;
- envia `X-Content-Type-Options: nosniff`;
- usa cache público de longa duração para o objeto imutável.

Se a foto for gravada no R2, mas a inserção da submissão no D1 falhar depois, a API remove o objeto recém-enviado para evitar arquivo órfão.

## Limites do conteúdo enviado

A API normaliza e limita o payload:

| Campo | Limite |
| --- | --- |
| ingredientes | até 50 itens |
| texto de cada ingrediente | até 180 caracteres |
| passos | até 30 itens |
| texto de cada passo | até 500 caracteres |
| foto | até 12 MB |

A submissão válida nasce com:

```text
status = PENDING
```

Ela só entra no catálogo depois de revisão administrativa.

## Moderação depois do envio

O fluxo administrativo ocorre em:

```text
/admin/receitas
```

Somente usuários com `role = 'ADMIN'` podem acessar as rotas de moderação no backend.

A revisão pode resultar em:

```text
PENDING → APPROVED
PENDING → REJECTED
```

Quando aprovada, a submissão é publicada como receita da comunidade e passa a aparecer no catálogo v2.

## Fluxo resumido

```text
Celular
   ↓
/enviar-receita
   ↓
seleciona foto + preenche receita
   ↓
validação local de tipo/tamanho
   ↓
POST /api/recipe-submissions
   ├── R2: foto
   └── D1: recipe_submissions (PENDING)
   ↓
moderação ADMIN
   ├── APPROVED → catálogo v2
   └── REJECTED → permanece fora do catálogo
```

## Arquivos relacionados

- `frontend/src/app/enviar-receita/page.tsx`;
- `frontend/src/components/recipe/RecipeSubmissionForm.tsx`;
- `frontend/src/components/layout/HeaderNav.tsx`;
- `frontend/src/components/layout/AuthControls.tsx`;
- `frontend/src/components/layout/Header.module.css`;
- `frontend/src/services/recipe-submissions.service.ts`;
- `backend/worker-prototype/src/recipe-submission-worker.ts`;
- `backend/worker-prototype/wrangler.jsonc`.
