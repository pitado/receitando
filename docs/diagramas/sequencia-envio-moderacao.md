# Sequência UML — envio e moderação

Fluxo de envio de receitas com foto, persistência no PostgreSQL, limpeza em caso de erro e revisão administrativa.

**Prévia visual gerada pelo GitHub usando Mermaid:**

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant F as Frontend
    participant A as API recipe-submission-worker
    participant R as Cloudflare R2
    participant D as Neon PostgreSQL
    actor M as Administrador

    rect rgb(239, 246, 255)
      Note over U,D: Envio de receita
      U->>F: Preenche receita e envia foto
      F->>A: POST /api/recipe-submissions
      A->>A: Validar campos e foto (até 12 MB)
      A->>R: Salvar imagem no bucket
      R-->>A: Objeto salvo
      A->>D: INSERT recipe_submissions (PENDING)
      alt Falha de persistência PostgreSQL
        D-->>A: Erro
        A->>R: DELETE imagem recém-criada
        A-->>F: Erro de envio
      else Persistência concluída
        D-->>A: ID da submissão
        A-->>F: Submissão PENDING
        F-->>U: Receita enviada para revisão
      end
    end

    rect rgb(240, 253, 244)
      Note over F,M: Moderação administrativa
      M->>F: Abre painel de moderação
      F->>A: GET /api/admin/recipe-submissions
      A->>D: Verificar sessão e users.role = ADMIN
      D-->>A: Autorizado
      A->>D: SELECT recipe_submissions
      D-->>A: Pendências
      A-->>F: Lista de submissões
      M->>F: Decide aprovar ou rejeitar
      F->>A: PATCH /api/admin/recipe-submissions/:id
      alt Aprovada
        A->>D: INSERT recipes (source_type=USER)
        A->>D: UPDATE recipe_submissions (APPROVED)
      else Rejeitada
        A->>D: UPDATE recipe_submissions (REJECTED, rejection_reason)
      end
      A-->>F: Resultado da moderação
    end
```

**Para editar as caixas e conexões:** [abrir o arquivo-fonte `.drawio`](../../receitando-diagrama-sequencia-envio-moderacao.drawio). O GitHub exibe o XML quando você abre um `.drawio` diretamente; por isso esta página fornece a visualização sem precisar instalar ou baixar nada.

[Voltar ao índice dos diagramas](../../DIAGRAMAS-EDITAVEIS.md)
