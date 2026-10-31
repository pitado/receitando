# Diagramas UML do Receitando — código editável

Os diagramas são **arquivos de texto PlantUML (`.puml`)**, e não arquivos de imagem ou `.drawio`. Mantêm a organização UML dos diagramas anteriores, mas representam o banco **Neon PostgreSQL 17** conectado via **Cloudflare Hyperdrive**.

| Assunto | Fonte UML editável | Prévia renderizada pelo GitHub |
| --- | --- | --- |
| Componentes da infraestrutura | [receitando-diagrama-componentes.puml](receitando-diagrama-componentes.puml) | [Componentes](docs/diagramas/componentes.md) |
| DER relacional PostgreSQL | [DER.puml](DER.puml) · [Modelo DBML](receitando-der.dbml) | [DER](docs/diagramas/der.md) |
| Sequência: matching e despensa | [receitando-diagrama-sequencia-matching.puml](receitando-diagrama-sequencia-matching.puml) | [Matching](docs/diagramas/sequencia-matching.md) |
| Sequência: envio e moderação | [receitando-diagrama-sequencia-envio-moderacao.puml](receitando-diagrama-sequencia-envio-moderacao.puml) | [Moderação](docs/diagramas/sequencia-envio-moderacao.md) |
| Classes dos contratos do frontend | [receitando-contratos-dados-frontend.puml](receitando-contratos-dados-frontend.puml) | [Contratos](docs/diagramas/contratos-frontend.md) |

## Como visualizar e editar

- **Visualizar no GitHub:** abra a prévia em Markdown; cada página contém um diagrama Mermaid renderizado, feito em texto.
- **Editar UML:** abra um arquivo `.puml` no VS Code com a extensão PlantUML, ou cole o código em um editor PlantUML.
- **Editar o DER relacional:** também pode usar [receitando-der.dbml](receitando-der.dbml) em um editor DBML; é fonte textual, não imagem.

## O que os diagramas representam

- A API REST não guarda o estado da sessão na memória de um Worker.
- A persistência relacional usa **Neon PostgreSQL** via **Hyperdrive**; não há D1 na arquitetura de produção.
- Imagens ficam no **R2** e o estado de salas WebSocket em **Durable Objects**.
- O DER retrata relações declaradas no [schema PostgreSQL](backend/worker-prototype/migrations/postgres/0001_baseline.sql). Campos auxiliares e a VIEW `recipe_search` permanecem no SQL, que é a fonte de verdade.
- O [System Design](docs/system-design-fase4.md) explica decisões arquiteturais e dimensionamento da Fase 4.

Esses diagramas servem de apoio à defesa do **projeto inteiro**, não apenas ao dimensionamento da Fase 4.
