# Upload de receitas no celular

A tela **Enviar receita** usa `multipart/form-data` para enviar a foto real do prato junto com os dados da receita.

- formatos aceitos: JPG, PNG e WebP;
- limite: 12 MB;
- armazenamento: Cloudflare R2 (`receitando-recipe-images`);
- a API valida a assinatura do arquivo antes do upload;
- as submissões continuam com status `PENDING` até revisão;
- imagens são servidas pela API em `/api/recipe-submission-images/...`.

O cabeçalho mobile mantém o acesso **Entrar/Conta** visível e as abas usam rolagem horizontal para não estourar telas estreitas.
