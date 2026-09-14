# Receitando — Requisitos

Documento de requisitos levantado a partir do código de `pitado/receitando` (`main`, commit de 09/09/2026).
Referência cruzada: [`receitando-casos-de-uso.md`](receitando-casos-de-uso.md).

A numeração RF01–RF16 e RNF01–RNF09 preserva a que já existe em `docs/escopo.md`, para não quebrar referências. Os códigos seguintes cobrem comportamento presente no código que ainda não estava listado lá.

**Leia a seção 6 antes de entregar este documento.** Ela lista o que não pode ser derivado do código e depende de decisão sua.

---

## 1. Requisitos funcionais

### 1.1 Catálogo e busca

| Código | Requisito | UC |
| --- | --- | --- |
| RF01 | O sistema deve permitir visualizar o catálogo de receitas. | UC01 |
| RF02 | O sistema deve permitir consultar os detalhes de uma receita. | UC03 |
| RF13 | O sistema deve armazenar a origem das receitas importadas. | UC21 |
| RF14 | O sistema deve exibir imagens de receitas quando houver imagem livre válida associada. | UC01, UC03 |
| RF17 | O sistema deve permitir busca textual por título e descrição usando índice FTS5, com ordenação por relevância. | UC02 |
| RF18 | O sistema deve paginar a listagem por `limit` (1 a 60, padrão 36) e `offset`, com filtro opcional por fonte. | UC01 |
| RF29 | O sistema deve apresentar na página inicial receitas populares, comentários recentes e totais consolidados. | UC20 |

### 1.2 Compatibilidade por ingredientes

| Código | Requisito | UC |
| --- | --- | --- |
| RF03 | O sistema deve permitir informar ingredientes para buscar receitas compatíveis. | UC04 |
| RF04 | O sistema deve calcular a compatibilidade entre os ingredientes informados e cada receita. | UC04, UC05 |
| RF05 | O sistema deve indicar ingredientes disponíveis e faltantes. | UC04, UC05 |
| RF09 | O sistema deve permitir utilizar a despensa na busca de receitas. | UC05 |
| RF15 | O sistema deve resolver variações textuais conhecidas para um ingrediente canônico antes do matching. | UC04 |
| RF16 | O sistema deve permitir classificar ingredientes básicos para que não penalizem a compatibilidade. | UC04 |
| RF21 | O sistema deve priorizar, no matching pela despensa, receitas que usem ingredientes próximos do vencimento quando a diferença de compatibilidade for de até 5 pontos. | UC05 |
| RF22 | O sistema deve gerar uma lista de compras contendo apenas ingredientes obrigatórios não presentes na despensa, permitindo copiar o conteúdo. | UC16 |
| RF23 | O sistema deve permitir recalcular as quantidades da receita para um rendimento alvo inteiro entre 1 e 50 porções. | UC17 |
| RF24 | O sistema deve sugerir substituições compatíveis com o contexto culinário, informando confiança e justificativa, e declarar a limitação quando não houver substituição confiável. | UC17 |

### 1.3 Conta e acesso

| Código | Requisito | UC |
| --- | --- | --- |
| RF06 | O sistema deve permitir cadastro, login e logout de usuários. | UC06, UC07, UC08 |
| RF07 | O sistema deve permitir recuperação de senha por código enviado ao e-mail. | UC09 |
| RF28 | O sistema deve permitir consultar e editar nome, identificador `@` único e avatar predefinido. | UC10 |
| RF30 | O sistema deve aplicar limites de requisição em login, cadastro e solicitação de recuperação, respondendo `429` com `Retry-After`. | UC06, UC07, UC09 |

### 1.4 Despensa

| Código | Requisito | UC |
| --- | --- | --- |
| RF08 | O sistema deve permitir manter uma despensa persistente por usuário. | UC11 |
| RF19 | O sistema deve registrar quantidade, unidade e data de validade opcionais para cada item. | UC11 |
| RF20 | O sistema deve sinalizar na interface itens vencidos ou com vencimento em até 3 dias. | UC12 |

### 1.5 Comunidade

| Código | Requisito | UC |
| --- | --- | --- |
| RF10 | O sistema deve permitir salvar e remover receitas favoritas. | UC13 |
| RF11 | O sistema deve permitir registrar e remover avaliação positiva ou negativa em receitas. | UC14 |
| RF12 | O sistema deve permitir publicar, editar e excluir comentários próprios em receitas. | UC15 |
| RF25 | O sistema deve permitir o envio de receitas pela comunidade, com foto obrigatória, registrando-as como pendentes de análise. | UC18 |
| RF26 | O sistema deve permitir que administradores listem submissões por situação e as aprovem ou rejeitem, registrando revisor, data e justificativa. | UC19 |
| RF27 | O sistema deve publicar no catálogo a receita aprovada, vinculando-a à submissão de origem. | UC19 |

---

## 2. Requisitos não funcionais

### 2.1 Segurança

| Código | Requisito | Verificação |
| --- | --- | --- |
| RNF05 | Senhas e tokens não devem ser armazenados em texto puro no banco. | `lib/security.ts` |
| RNF06 | Credenciais e chaves privadas não devem ser versionadas no repositório. | `.gitignore`, secrets do GitHub |
| RNF10 | Senhas devem ser derivadas com PBKDF2 via Web Crypto; tokens de sessão persistidos apenas como SHA-256. | `lib/security.ts`, `index.ts` |
| RNF11 | O cookie de sessão deve usar `HttpOnly`, `SameSite=Strict`, `Path=/`, e, em contexto seguro, `Secure` e o prefixo `__Host-`. | `lib/session-cookie.ts` |
| RNF12 | O CORS com credenciais deve aceitar apenas as origens declaradas em `FRONTEND_URL`. | `wrangler.jsonc`, `lib/worker-http.ts` |
| RNF13 | Operações mutáveis originadas do navegador devem validar o cabeçalho `Origin` como defesa adicional contra CSRF. | `session-cookie-worker.ts` |
| RNF14 | Respostas sensíveis devem usar `Cache-Control: no-store`. | `lib/worker-http.ts` |
| RNF15 | Identificadores usados no rate limiting (e-mail e IP) devem ser persistidos apenas como hash SHA-256, com retenção de 2 horas. | `lib/auth-rate-limit.ts` |
| RNF17 | Conteúdo culinário de fonte externa deve ser renderizado como texto, nunca como HTML da origem. | importador e página de detalhe |
| RNF18 | A sessão deve ter validade de 30 dias contados da criação. | `index.ts` |
| RNF21 | Todo acesso ao D1 deve usar statements parametrizados com `.bind()`. | workers da API |
| RNF22 | A autorização por dono deve ser aplicada em despensa, favoritos, votos e comentários. | workers correspondentes |
| RNF23 | As imagens de submissão devem ser servidas apenas sob o prefixo `submissions/`, com bloqueio de travessia de caminho e `X-Content-Type-Options: nosniff`. | `recipe-submission-worker.ts` |
| RNF24 | O tipo da imagem enviada deve ser determinado pelo conteúdo do arquivo, não pela extensão ou pelo cabeçalho informado. | `recipe-submission-worker.ts` |

### 2.2 Privacidade e conformidade

| Código | Requisito |
| --- | --- |
| RNF07 | Conteúdo externo publicado deve possuir origem identificável e licença compatível com o uso. |
| RNF25 | A resposta da solicitação de recuperação de senha deve ser indistinguível entre conta existente e inexistente. |
| RNF26 | A resposta de login deve ser indistinguível entre e-mail inexistente e senha incorreta. |

### 2.3 Arquitetura

| Código | Requisito |
| --- | --- |
| RNF03 | O frontend não deve acessar o banco de dados diretamente. |
| RNF04 | Dados persistentes devem ser acessados exclusivamente por meio da API. |
| RNF27 | O roteamento da API deve passar pelo worker de sessão e CORS antes de despachar para os workers de domínio. |

### 2.4 Precisão do matching

| Código | Requisito |
| --- | --- |
| RNF16 | A resolução de ingredientes não deve usar correspondência por substring (`LIKE '%termo%'`) na busca principal nem no matching. |
| RNF28 | O motor de adaptação não deve inferir densidade para converter entre massa e volume. |

### 2.5 Usabilidade e compatibilidade

| Código | Requisito |
| --- | --- |
| RNF01 | A aplicação deve funcionar em navegadores modernos. |
| RNF02 | A interface deve ser responsiva para desktop e dispositivos móveis. |
| RNF08 | A aplicação deve disponibilizar estados de carregamento, erro e conteúdo vazio nas operações principais. |
| RNF29 | As limitações conhecidas do matching devem ser declaradas na própria interface, e não apenas na documentação. |

### 2.6 Qualidade e operação

| Código | Requisito |
| --- | --- |
| RNF09 | Os componentes devem passar pelas validações automatizadas do CI antes da publicação. |
| RNF19 | O frontend deve possuir testes unitários (Vitest/Testing Library) e fluxo E2E (Playwright); a API deve possuir testes de regras puras e testes de rota com D1 simulado. |
| RNF20 | O deploy do frontend e da API deve ocorrer por workflows do GitHub Actions, aplicando as migrations do D1 antes da publicação da API. |
| RNF30 | A importação de catálogo deve ser independente do deploy da aplicação. |

---

## 3. Regras de negócio

### 3.1 Compatibilidade

| Código | Regra |
| --- | --- |
| RN01 | O matching aceita de 1 a 40 ingredientes por requisição. |
| RN02 | O denominador da compatibilidade considera apenas ingredientes obrigatórios que não sejam básicos. Opcionais e `is_staple` ficam de fora. |
| RN03 | A resolução de ingredientes usa igualdade exata contra nome normalizado e aliases normalizados. Compostos semanticamente distintos permanecem separados. |
| RN04 | O matching é booleano. Quantidade e unidade são armazenadas e exibidas, mas não alteram o percentual. |
| RN05 | A validade dos itens não altera o percentual de compatibilidade; atua somente como desempate na ordenação do frontend. |
| RN06 | Pesos de urgência: vencido ou vence hoje = 5; vence amanhã = 4; vence em 2 a 3 dias = 3; vence em 4 a 7 dias = 1; acima de 7 dias ou sem validade = 0. |
| RN22 | Faixas de status: 100% = `READY`; de 70% a 99% = `ALMOST_READY`; de 40% a 69% = `NEAR`; abaixo de 40% = `EXPLORE`. |

### 3.2 Despensa

| Código | Regra |
| --- | --- |
| RN07 | Cada usuário possui no máximo um item de despensa por ingrediente canônico; nova inclusão do mesmo ingrediente atualiza o registro existente. |
| RN08 | Itens de despensa e favoritos só podem ser lidos, alterados ou removidos pelo próprio dono. |
| RN27 | O alerta de vencimento é disparado quando existem itens vencidos ou com até 3 dias para vencer, e é exclusivamente in-app. |

### 3.3 Conta e acesso

| Código | Regra |
| --- | --- |
| RN09 | A resposta da solicitação de recuperação é genérica para qualquer e-mail sintaticamente válido. |
| RN10 | O código de recuperação tem 6 dígitos, validade de 10 minutos, cooldown de reenvio de 60 segundos, limite de 5 tentativas, e é persistido apenas de forma derivada. |
| RN11 | A troca de senha bem-sucedida invalida todas as sessões existentes do usuário. |
| RN19 | Senha entre 10 e 128 caracteres; nome entre 2 e 100; e-mail com formato válido, até 254 caracteres e único no sistema. |
| RN23 | A sessão persiste por 30 dias no banco, independentemente de "Lembrar de mim". |
| RN24 | Limites de requisição: 5 falhas de login por e-mail e 20 por IP a cada 15 minutos; 5 cadastros por IP a cada hora; 3 solicitações de recuperação por e-mail e 10 por IP a cada 15 minutos. |
| RN25 | "Lembrar de mim" controla apenas a persistência do cookie no navegador: marcado, o cookie recebe `Max-Age` de 30 dias; desmarcado, expira ao fechar o navegador. |
| RN26 | O handle deve casar `^[a-z0-9][a-z0-9_]{2,23}$`, ser único e não pertencer à lista reservada (`admin`, `api`, `receitando`, `suporte`, `contato`). O avatar deve ser um dos oito predefinidos. |

### 3.4 Comunidade

| Código | Regra |
| --- | --- |
| RN14 | Comentários podem ser lidos publicamente, mas só o autor pode editá-los ou excluí-los. |
| RN28 | Cada usuário tem no máximo um voto por receita; um novo voto substitui o anterior. |
| RN29 | O comentário deve ter entre 2 e 1200 caracteres. |

### 3.5 Submissão e moderação

| Código | Regra |
| --- | --- |
| RN15 | Toda receita enviada nasce com `status = 'PENDING'` e só aparece no catálogo após aprovação. |
| RN16 | O envio é permitido sem autenticação; havendo sessão, o `user_id` é vinculado à submissão. |
| RN17 | Uma submissão já analisada não pode ser reavaliada. |
| RN30 | A foto é obrigatória, limitada a 12 MB, e aceita apenas JPG, PNG ou WebP verificados pelo conteúdo do arquivo. |
| RN31 | Somente usuários com `role = 'ADMIN'` acessam qualquer rota de moderação. |

### 3.6 Catálogo externo

| Código | Regra |
| --- | --- |
| RN18 | Receitas importadas devem registrar procedência e atribuição de licença da receita e da imagem. |
| RN20 | A busca textual monta a consulta FTS5 com até 8 tokens distintos, combinados por conjunção de prefixos. |
| RN21 | Conteúdo culinário de terceiros é convertido para texto na importação e renderizado como texto na interface. |

---

## 4. Limitações declaradas do produto

Não são defeitos: são fronteiras conscientes da versão atual e devem constar da apresentação.

| Código | Limitação |
| --- | --- |
| LIM01 | O matching não compara quantidades. Possuir uma unidade de um ingrediente conta como presença, ainda que a receita exija mais. |
| LIM02 | A lista de compras não calcula compra parcial por quantidade. |
| LIM03 | O aviso de vencimento é in-app. Não há Web Push, e-mail automático nem notificação em segundo plano. |
| LIM04 | O motor de adaptação é experimental e recusa substituições quando não há confiança suficiente para o contexto. |
| LIM05 | Não há comparação entre massa e volume sem unidade comum. |
| LIM06 | O papel `ADMIN` não é concedido pela aplicação. |

---

## 5. Rastreabilidade

| Requisito | Caso de uso | Implementação |
| --- | --- | --- |
| RF01, RF18 | UC01 | `catalog64-worker.ts`, `catalog-v2-worker.ts` |
| RF02, RF14 | UC03 | `catalog64-worker.ts`, `/receitas/[slug]` |
| RF03, RF04, RF05, RF15, RF16 | UC04 | `catalog64-worker.ts`, `lib/recipe-utils.ts` |
| RF09, RF21 | UC05 | `catalog64-worker.ts`, `/combinar` |
| RF06, RF30 | UC06, UC07, UC08 | `index.ts`, `auth-rate-limit-worker.ts`, `lib/auth-rate-limit.ts` |
| RF07 | UC09 | `password-reset-worker.ts` |
| RF08, RF19 | UC11 | `pantry-worker.ts` |
| RF20 | UC12 | `/despensa` |
| RF10 | UC13 | `catalog64-worker.ts` |
| RF11, RF12 | UC14, UC15 | `social-worker.ts` |
| RF13 | UC21 | `scripts/import-wikibooks-v2.mjs` |
| RF17 | UC02 | `catalog-v2-worker.ts`, migration `0015` |
| RF22 | UC16 | `RecipeShoppingList.tsx` |
| RF23, RF24 | UC17 | `recipe-adaptation-worker.ts`, `lib/recipe-adaptation.ts` |
| RF25, RF26, RF27 | UC18, UC19 | `recipe-submission-worker.ts`, migration `0016` |
| RF28 | UC10 | `profile-worker.ts`, migration `0006` |
| RF29 | UC20 | `home-worker.ts` |

---

## 6. Lacunas que este documento não fecha

Esta seção é a resposta honesta ao pedido de "sem brechas". Um documento derivado do código descreve com precisão **o que foi construído**; ele não pode inventar o que o projeto nunca decidiu. As lacunas abaixo são reais e cada uma exige uma decisão sua.

### 6.1 Lacunas que afetam a completude do documento

| # | Lacuna | Por que importa | O que fazer |
| --- | --- | --- | --- |
| 1 | **Não há requisitos de desempenho.** Nenhuma meta de tempo de resposta, usuários simultâneos, volume de catálogo ou tamanho de resposta está declarada em lugar nenhum do repositório. | Uma banca costuma cobrar ao menos um RNF mensurável de desempenho. Um documento sem nenhum é uma brecha visível. | Definir você mesmo. Não inventei números porque um RNF de desempenho fabricado é pior que a ausência dele. |
| 2 | **Não há priorização dos requisitos** (essencial / importante / desejável, ou MoSCoW). | Sem prioridade, não dá para justificar o que ficou de fora do escopo entregue. | Classificar os 30 RF. Posso propor uma classificação a partir dos critérios de conclusão do `escopo.md`, mas seria sugestão minha, não um fato do projeto. |
| 3 | **Não há critérios de aceitação por requisito.** Existem testes automatizados, mas não estão escritos como critério verificável de aceite. | É o elo que falta entre requisito e validação. | Derivar dos testes existentes em `frontend/e2e/tests/` e da suíte da API. Isso é factível e eu posso fazer. |
| 4 | **Não sei o template exigido pela sua disciplina.** Usei o formato mais comum (atores, fluxos principal/alternativo/exceção, RF/RNF/RN, rastreabilidade). | Se a instituição exige outro formato, a estrutura inteira muda. | Me mandar o enunciado ou o modelo. |
| 5 | **Não li o `Receitando (4).pdf`** que está na raiz do repositório. | Pode conter o enunciado, um documento de requisitos anterior ou numeração oficial que conflita com esta. | Me enviar o arquivo. É a lacuna mais fácil de fechar e possivelmente a mais importante. |

### 6.2 Lacunas do próprio sistema, não do documento

Estas eu documentei como ausências. São decisões de produto ainda não tomadas, e vale você decidir se entram como requisito futuro ou como limitação assumida.

| # | Ausência no sistema |
| --- | --- |
| 6 | Não existe forma de conceder o papel `ADMIN` pela aplicação. Não há rota, seed nem script; a promoção depende de alteração direta no D1. Isso torna o UC19 não reproduzível por quem clonar o projeto do zero. |
| 7 | O autor de uma submissão nunca é notificado do resultado. O `authorEmail` é coletado e armazenado, mas nenhum envio ocorre nesse fluxo. Coletar um dado pessoal sem uso declarado é um ponto frágil. |
| 8 | Não há exclusão de conta nem exportação de dados pessoais. Relevante se o trabalho precisar tratar LGPD. |
| 9 | Não há denúncia nem moderação de comentários. Só o autor remove o próprio texto; um comentário abusivo não tem caminho de remoção. |
| 10 | Receitas publicadas não podem ser editadas nem despublicadas pela aplicação, nem as aprovadas nem as importadas. |
| 11 | Não há limite de requisições nas rotas de escrita da comunidade (comentários, votos, favoritos, submissões). O rate limiting cobre apenas login, cadastro e recuperação. |

### 6.3 O que eu verifiquei e considero fechado

Para você saber onde **não** há brecha: todos os limites numéricos, códigos de status HTTP, mensagens de erro, faixas de validação, pesos de urgência e faixas de status deste documento foram lidos diretamente do código-fonte, não da documentação do repositório. Onde a documentação do repo divergia do código, segui o código.
