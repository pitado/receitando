# Diagrama UML de Sequência — Envio e Moderação

**Visualização direta no GitHub:** o desenho UML aparece abaixo. Não é uma imagem estática; o diagrama é gerado a partir do código Mermaid desta página.

Upload no R2 e gravação transacional de submissões e revisões no Neon.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant F as Frontend
    participant A as API recipe-submission-worker
    participant R as Cloudflare R2
    participant H as Cloudflare Hyperdrive
    participant D as Neon PostgreSQL
    actor M as Administrador

    rect rgb(239, 246, 255)
      Note over U,D: Envio de receita
      U->>F: Preenche receita e envia foto
      F->>A: POST /api/recipe-submissions
      A->>A: Validar campos e foto (até 12 MB)
      A->>R: Salvar imagem no bucket
      R-->>A: Objeto salvo
      A->>H: INSERT recipe_submissions (PENDING)
      H->>D: SQL parametrizado
      alt Falha de persistência PostgreSQL
        D-->>H: Erro
        H-->>A: Erro
        A->>R: DELETE imagem recém-criada
        A-->>F: Erro de envio
      else Persistência concluída
        D-->>H: ID da submissão
        H-->>A: Persistência confirmada
        A-->>F: Submissão PENDING
        F-->>U: Receita enviada para revisão
      end
    end

    rect rgb(240, 253, 244)
      Note over F,M: Moderação administrativa
      M->>F: Abre painel de moderação
      F->>A: GET /api/admin/recipe-submissions
      A->>H: Verificar sessão e users.role = ADMIN
      H->>D: SELECT autorização
      D-->>H: Autorizado
      H-->>A: Autorizado
      A->>H: SELECT recipe_submissions
      H->>D: Consulta
      D-->>H: Pendências
      H-->>A: Pendências
      A-->>F: Lista de submissões
      M->>F: Decide aprovar ou rejeitar
      F->>A: PATCH /api/admin/recipe-submissions/:id
      alt Aprovada
        A->>H: Transação: INSERT recipes + UPDATE APPROVED
        H->>D: SQL transacional
      else Rejeitada
        A->>H: UPDATE REJECTED / rejection_reason
        H->>D: SQL transacional
      end
      D-->>H: COMMIT
      H-->>A: Revisão persistida
      A-->>F: Resultado da moderação
    end
```

**Editar em PlantUML:** [abrir o arquivo-fonte `receitando-diagrama-sequencia-envio-moderacao.puml`](receitando-diagrama-sequencia-envio-moderacao.puml).

**Base técnica:** [System Design](docs/system-design-fase4.md) · [schema PostgreSQL](backend/worker-prototype/migrations/postgres/0001_baseline.sql) · [índice de diagramas](DIAGRAMAS-EDITAVEIS.md).
