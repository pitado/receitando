# Receitando — System Design e infraestrutura

**Documento de arquitetura do projeto | Fase 4 — Engenharia de Software**  
**Estado:** arquitetura publicada + estratégias de evolução identificadas. **Fonte:** [código do Receitando](https://github.com/pitado/receitando) e [documentação da aplicação](README.md).

> **Leitura dos diagramas:** linhas contínuas representam fluxos/componentes existentes; linhas tracejadas representam opções **propostas**, ainda não implementadas. A arquitetura projetada não equivale a capacidade de produção certificada.

## 1. Escopo e requisitos

O Receitando ajuda a descobrir receitas a partir de ingredientes disponíveis, manter uma despensa, compartilhar receitas e cozinhar com outras pessoas em tempo real.

| Requisito | Solução arquitetural |
| --- | --- |
| Frontend web/mobile | Next.js 16 + React 19, interface responsiva/PWA (**não** app nativo) |
| Backend HTTP stateless | API REST/JSON em Cloudflare Workers; sessões fora da memória do Worker |
| Dados relacionais | Neon PostgreSQL 17 via Cloudflare Hyperdrive + `pg` |
| Imagens | Cloudflare R2; conteúdo binário fora das tabelas relacionais |
| Colaboração em tempo real | WebSocket e Durable Objects por sala |
| Alta volumetria | Estratégia para **1 milhão de escritas + 2 milhões de leituras**; horizonte temporal explicitado na seção 6 |
| Integrações | Resend (e-mail) e mapeamento de **pagamentos hipotéticos**, sem checkout ativo |

Requisitos de qualidade orientadores: consistência, segurança de sessão, latência, disponibilidade, evolução independente dos componentes e observabilidade. Detalhes funcionais estão em [escopo](escopo.md) e [funcionalidades](funcionalidades.md).

## 2. Contexto — quem usa e de que depende

```mermaid
flowchart LR
    U["Pessoa usando navegador<br/>desktop ou celular"]
    R["Receitando<br/>web + API + preparo colaborativo"]
    M["Resend<br/>e-mails"]
    P["Neon PostgreSQL<br/>dados relacionais"]
    C["Cloudflare<br/>Workers / R2 / Durable Objects"]
    G["Gateway de pagamento<br/>proposta acadêmica"]

    U <-->|"HTTPS / WebSocket"| R
    R -->|"envio de e-mail"| M
    R -->|"persistência"| P
    R -->|"execução e arquivos"| C
    R -.->|"checkout / webhook — não implementado"| G
```

**Limite do sistema:** o navegador não possui acesso direto ao PostgreSQL ou às credenciais dos provedores. Recursos de pagamento não existem na versão atual.

## 3. Arquitetura de containers e infraestrutura

```mermaid
flowchart TB
    B["Navegador web / mobile PWA"]
    subgraph CF["Cloudflare — infraestrutura publicada"]
        FE["Frontend Worker<br/>Next.js / React / OpenNext"]
        API["API Worker<br/>REST stateless / TypeScript"]
        HD["Hyperdrive<br/>conexões PostgreSQL"]
        R2[("R2<br/>imagens")]
        DO["Durable Object<br/>CookingRoom por sala"]
    end
    PG[("Neon PostgreSQL 17<br/>contas, sessões, receitas, despensa")]
    MAIL["Resend<br/>recuperação de acesso"]
    B -->|"HTTPS"| FE
    FE -->|"REST / JSON"| API
    B -->|"WSS / HTTP da API"| API
    API -->|"driver pg / SQL"| HD
    HD -->|"pool / PostgreSQL"| PG
    API -->|"upload / leitura"| R2
    API -->|"criar sala / encaminhar WSS"| DO
    API -->|"mensagens"| MAIL
```

| Componente | Por que está separado? | Trade-off |
| --- | --- | --- |
| Workers REST | Processamento HTTP distribuído, sem afinidade com instância | Dependência dos serviços de dados e limites da plataforma |
| PostgreSQL | Transações, FKs e consultas relacionais para receitas/ingredientes/usuários | CPU, I/O, conexões e contenção de escrita |
| Hyperdrive | Gerencia conectividade/pooling dos Workers com o banco | **Não aumenta sozinho** o poder de processamento do PostgreSQL |
| R2 | Fotos não sobrecarregam armazenamento/transações SQL | Permissões, consistência operacional entre upload e registro SQL |
| Durable Objects | Uma autoridade de estado por sala de WebSocket | Gestão de conexões, limites e ciclo de vida da sala |

Código: [roteador](../backend/worker-prototype/src/app-router.ts) · [adaptador PostgreSQL](../backend/worker-prototype/src/lib/postgres-adapter.ts) · [configuração da API](../backend/worker-prototype/wrangler.jsonc) · [diagrama de componentes editável](../receitando-diagrama-componentes.puml).

## 4. Fluxo REST stateless

Exemplo de operação autenticada na despensa:

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant FE as Navegador / Next.js
    participant API as API Worker
    participant HD as Hyperdrive
    participant PG as Neon PostgreSQL

    U->>FE: Abre a despensa
    FE->>API: GET /api/pantry (cookie HttpOnly)
    API->>HD: Verificar sessão / consultar pantry_items
    HD->>PG: SQL parametrizado
    PG-->>HD: Sessão e itens do usuário
    HD-->>API: Resultado SQL
    API-->>FE: HTTP 200 + JSON (no-store)
    FE-->>U: Exibe os ingredientes
```

**Stateless:** a API não conserva sessão na memória do Worker entre requisições. Cookies identificam a sessão, cujo estado é persistido no PostgreSQL. Mutação exige autorização e validação adequada; a API aplica políticas como CORS/Origin, hash de senhas, consultas parametrizadas e rate limiting nas rotas de autenticação. [Contrato REST](api.md) · [segurança](../SECURITY.md).

## 5. Modelo de dados — entidades essenciais

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : possui
    USERS ||--o{ PANTRY_ITEMS : mantem
    INGREDIENTS ||--o{ PANTRY_ITEMS : referencia
    RECIPES ||--o{ RECIPE_INGREDIENTS : possui
    INGREDIENTS ||--o{ RECIPE_INGREDIENTS : participa
    INGREDIENTS ||--o{ INGREDIENT_ALIASES : possui
    USERS ||--o{ FAVORITES : salva
    RECIPES ||--o{ FAVORITES : recebe
    USERS o|--o{ RECIPE_SUBMISSIONS : envia
    RECIPES ||--o{ RECIPE_COMMENTS : recebe
    USERS ||--o{ RECIPE_COMMENTS : escreve
```

O **relacionamento muitos-para-muitos** entre receitas e ingredientes utiliza `recipe_ingredients`. A busca textual possui índice GIN no PostgreSQL; `recipe_search` é uma **VIEW**, não uma tabela FTS5. As regras de integridade e as transações seguem o [schema PostgreSQL versionado](../backend/worker-prototype/migrations/postgres/0001_baseline.sql).

**[Ver DER completo e renderizado](../DER.md)** · [fonte UML editável](../DER.puml) · [detalhes do banco](database.md).

## 6. Escalabilidade — 1 milhão de escritas e 2 milhões de leituras

**O enunciado não determina uma janela temporal.** As taxas abaixo são médias aritméticas para duas hipóteses; não representam picos nem capacidade já garantida.

| Janela hipotética | 1M escritas | 2M leituras | Total |
| --- | ---: | ---: | ---: |
| **24 horas** (86.400 s) | **11,57/s** | **23,15/s** | **34,72 operações/s** |
| **1 hora** (3.600 s) | **277,78/s** | **555,56/s** | **833,33 operações/s** |

```mermaid
flowchart LR
    Q["Tráfego variável<br/>leituras e escritas"] --> API["Workers<br/>processamento HTTP distribuído"]
    API --> HD["Hyperdrive<br/>controle das conexões"]
    HD --> PG[("PostgreSQL<br/>índices e transações")]
    PG -.-> CPU["Ampliar compute do Neon<br/>conforme métricas"]
    API -.-> CACHE["Cache para GET público<br/>após política de invalidação"]
    API -.-> RL["Expandir rate limit / proteção<br/>e observabilidade"]
```

**Estratégia por gargalo:**

| Risco observado | Mitigação / decisão | Como verificar |
| --- | --- | --- |
| Muitas requisições HTTP | Distribuição nos Workers; limites de taxa onde necessários | req/s, HTTP 429/5xx, p95/p99 |
| Pool ou banco saturado | Monitorar Hyperdrive/conexões, dimensionar compute Neon | conexões, erros, CPU, I/O |
| SQL caro ou concorrente | Índices, paginação, `EXPLAIN`, transações curtas | queries lentas, locks, tempo por consulta |
| Fotos sobrecarregando SQL | Armazenamento dos arquivos em R2 (**em uso**) | operações e custos por serviço |
| Pico/indisponibilidade | Timeouts, backoff e degradação planejada; validar recuperação | erros, latência, recuperação e alertas |

**Estado de implementação:** Workers, Hyperdrive, PostgreSQL, R2 e controle de sessão existem. **Cache de GET públicos, ampliação de compute, réplicas de leitura e filas são estratégias condicionais**, não infraestrutura já comprovadamente implantada. Réplicas não resolvem gargalo de escrita. Uma hipótese de pico **10×** exige validação específica, não deve ser apresentada como garantida.

**Dimensionamento de armazenamento:** 1 milhão de **operações de escrita** não significa necessariamente 1 milhão de novas linhas permanentes. Para estimar GB, ainda seria necessário conhecer o tamanho dos registros, a retenção, os índices e a proporção de INSERT/UPDATE/DELETE.

**Evidências, não promessas:** [testes e metodologia](../tests/load/README.md) incluem ensaio SQL em branch Neon isolada e ensaio HTTP limitado (1.000 POSTs + 2.000 GETs, 0 falhas) com Worker/Hyperdrive/PostgreSQL isolados. **Não comprovam 3 milhões de requisições HTTP nem operação contínua sob pico.**

## 7. WebSocket — Receitando Juntos (implementado)

```mermaid
sequenceDiagram
    autonumber
    actor A as Pessoa A
    actor B as Pessoa B
    participant API as API Worker
    participant DO as CookingRoom (Durable Object)

    A->>API: POST /api/v2/cooking-rooms
    API->>DO: Criar/inicializar sala
    API-->>A: HTTP 201 + id
    A->>API: GET /api/v2/cooking-rooms/id/ws (WSS)
    API->>DO: Encaminhar WebSocket
    B->>API: GET /api/v2/cooking-rooms/id/ws (WSS)
    API->>DO: Encaminhar WebSocket
    A->>DO: step:set (etapa concluída)
    DO->>DO: Persistir estado e versão da sala
    DO-->>A: room:state atualizado
    DO-->>B: room:state atualizado
    B->>DO: Reconexão
    DO-->>B: Snapshot mais recente
```

Cada sala é coordenada por seu Durable Object, **sem transformar o Worker REST em stateful**. A solução contempla presença, atualizações concorrentes, reconexão, máximo de **12 conexões** por sala e validade lógica de **24 horas**. O estado colaborativo da sala **não é uma escrita na tabela de receitas do Neon**.

[Implementação](../backend/worker-prototype/src/cooking-room.ts) · [especificação e testes](receitando-juntos.md) · [sequência UML de matching](../Diagrama-de-Sequencia.md).

## 8. Pagamentos — mapeamento exigido, NÃO implementado

O Receitando é gratuito; **não existe checkout, assinatura nem `/api/payments/checkout` na API atual**. O fluxo abaixo é uma **proposta de integração** caso o produto venha a cobrar pagamentos.

```mermaid
sequenceDiagram
    autonumber
    actor U as Cliente
    participant F as Frontend
    participant A as API Worker
    participant PG as PostgreSQL
    participant G as Gateway externo

    U->>F: Inicia compra hipotética
    F->>A: POST /api/payments/checkout (proposta)
    A->>PG: Grava pedido pending (proposta)
    A->>G: Cria checkout com idempotência
    G-->>A: URL do checkout hospedado
    A-->>F: URL para redirecionamento
    U->>G: Realiza pagamento
    G->>A: Webhook assinado
    A->>A: Verifica assinatura / deduplica evento
    A->>PG: Atualiza estado em transação
    A-->>G: HTTP 2xx
```

**Fronteiras de segurança da proposta:** credenciais apenas no servidor, valor validado pelo backend, checkout hospedado, assinatura do webhook, estados e idempotência; **sem armazenamento de cartão no Receitando**. O gateway é uma dependência externa prevista, não uma integração já contratada.

## 9. Riscos e justificativas para a defesa pública

| Pergunta da banca | Resposta arquitetural |
| --- | --- |
| Por que REST stateless? | Permite processar requisições em Workers sem sessão vinculada à instância; persistência fora do processo. |
| Por que PostgreSQL e não apenas KV/NoSQL? | Receitas, ingredientes, usuários e moderação têm relações, FKs e operações transacionais. |
| Hyperdrive faz o banco escalar? | **Não**: controla conexões, mas CPU/I/O/locks do PostgreSQL continuam limitantes. |
| Como REST e WebSocket convivem? | REST fica stateless; Durable Object mantém a autoridade de estado por sala. |
| O que acontece com 10× o tráfego? | É cenário a dimensionar e testar, monitorando picos, banco, conexões e custos — não promessa de capacidade. |
| Onde pode haver falha? | Neon, rede/provedores externos, R2, sala WebSocket e consultas; medir erros, latência e recuperação. |

**Conclusão:** a arquitetura separa HTTP, dados relacionais, arquivos e tempo real para permitir evolução com responsabilidades claras. Ela apresenta **um caminho para a volumetria exigida**, mas não substitui dimensionamento de recursos e validação em cargas representativas.

### Referências técnicas do próprio projeto

[Diagrama de componentes — ver desenho](../Diagrama-de-Componentes.md) · [DER — ver desenho](../DER.md) · [Diagrama de sequência — ver desenho](../Diagrama-de-Sequencia.md) · [Modelo PostgreSQL](database.md) · [API](api.md) · [Testes](../tests/load/README.md) · [Documentação geral](README.md).
