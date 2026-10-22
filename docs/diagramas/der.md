# DER do banco de dados

Modelo físico do banco Cloudflare D1 (SQLite): 14 tabelas, 15 relacionamentos FK, chaves PK e tipos de dados. O índice virtual FTS5 `recipe_search` fica documentado separadamente.

**Prévia visual gerada pelo GitHub usando Mermaid:**

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : "user_id"
    RECIPES ||--o{ RECIPE_INGREDIENTS : "recipe_id"
    INGREDIENTS ||--o{ RECIPE_INGREDIENTS : "ingredient_id"
    USERS ||--o{ PANTRY_ITEMS : "user_id"
    INGREDIENTS ||--o{ PANTRY_ITEMS : "ingredient_id"
    USERS ||--o{ FAVORITES : "user_id"
    RECIPES ||--o{ FAVORITES : "recipe_id"
    INGREDIENTS ||--o{ INGREDIENT_ALIASES : "ingredient_id"
    RECIPES ||--o{ RECIPE_TAGS : "recipe_id"
    USERS ||--o{ PASSWORD_RESET_CODES : "user_id"
    USERS ||--o{ RECIPE_VOTES : "user_id"
    RECIPES ||--o{ RECIPE_VOTES : "recipe_id"
    USERS ||--o{ RECIPE_COMMENTS : "user_id"
    RECIPES ||--o{ RECIPE_COMMENTS : "recipe_id"
    USERS o|--o{ RECIPE_SUBMISSIONS : "user_id"
    USERS {
        TEXT id PK
        TEXT name
        TEXT email UK
        TEXT password_hash
        TEXT role
        TEXT created_at
        TEXT updated_at
        TEXT handle
        TEXT avatar_key
    }
    SESSIONS {
        TEXT id PK
        TEXT user_id FK
        TEXT token_hash UK
        TEXT expires_at
        TEXT created_at
        TEXT last_seen_at
    }
    INGREDIENTS {
        TEXT id PK
        TEXT name
        TEXT normalized_name UK
        TEXT category
        TEXT created_at
        TEXT updated_at
        INTEGER is_staple
    }
    RECIPES {
        TEXT id PK
        TEXT title
        TEXT slug UK
        TEXT description
        TEXT instructions
        INTEGER prep_minutes
        INTEGER servings
        TEXT created_at
        TEXT updated_at
        TEXT meal_type
        TEXT difficulty
        TEXT source_type
        TEXT source_name
        TEXT image_url
        TEXT external_source
        TEXT external_id
        TEXT external_category
        TEXT external_subcategory
        TEXT source_url
        TEXT source_author
        TEXT source_license
        TEXT source_license_url
        TEXT source_language
        TEXT imported_at
        TEXT image_source
        TEXT image_author
        TEXT image_page_url
        TEXT image_license
        TEXT image_license_url
        TEXT image_alt
    }
    RECIPE_INGREDIENTS {
        TEXT id PK
        TEXT recipe_id FK
        TEXT ingredient_id FK
        REAL quantity
        TEXT unit
        INTEGER optional
        TEXT raw_text
    }
    PANTRY_ITEMS {
        TEXT id PK
        TEXT user_id FK
        TEXT ingredient_id FK
        REAL quantity
        TEXT unit
        TEXT expires_at
        TEXT created_at
        TEXT updated_at
    }
    FAVORITES {
        TEXT user_id PK,FK
        TEXT recipe_id PK,FK
        TEXT created_at
    }
    INGREDIENT_ALIASES {
        TEXT id PK
        TEXT ingredient_id FK
        TEXT alias
        TEXT normalized_alias UK
        TEXT created_at
    }
    RECIPE_TAGS {
        TEXT recipe_id PK,FK
        TEXT tag PK
    }
    PASSWORD_RESET_CODES {
        TEXT id PK
        TEXT user_id FK
        TEXT code_hash
        TEXT reset_token_hash
        INTEGER attempts
        TEXT expires_at
        TEXT verified_at
        TEXT used_at
        TEXT created_at
    }
    RECIPE_VOTES {
        TEXT user_id PK,FK
        TEXT recipe_id PK,FK
        TEXT vote
        TEXT created_at
        TEXT updated_at
    }
    RECIPE_COMMENTS {
        TEXT id PK
        TEXT recipe_id FK
        TEXT user_id FK
        TEXT body
        TEXT created_at
        TEXT updated_at
    }
    RECIPE_SUBMISSIONS {
        TEXT id PK
        TEXT user_id FK
        TEXT author_name
        TEXT author_email
        TEXT title
        TEXT description
        TEXT ingredients
        TEXT instructions
        INTEGER prep_minutes
        INTEGER servings
        TEXT meal_type
        TEXT difficulty
        TEXT image_url
        TEXT status
        TEXT created_at
        TEXT updated_at
        TEXT reviewed_by
        TEXT reviewed_at
        TEXT published_recipe_id
        TEXT rejection_reason
    }
    AUTH_RATE_LIMIT_EVENTS {
        TEXT id PK
        TEXT action
        TEXT key_hash
        TEXT created_at
    }
```

**Para editar as caixas e conexões:** [abrir o arquivo-fonte `.drawio`](../../DER.drawio). O GitHub exibe o XML quando você abre um `.drawio` diretamente; por isso esta página fornece a visualização sem precisar instalar ou baixar nada.

[Voltar ao índice dos diagramas](../../DIAGRAMAS-EDITAVEIS.md)
