# Diagramas UML do Receitando — código editável

Os diagramas são **arquivos de texto PlantUML (`.puml`)**, e não arquivos de imagem ou `.drawio`. Mantêm a organização UML dos diagramas anteriores, mas representam o banco **Neon PostgreSQL 17** conectado via **Cloudflare Hyperdrive**.

| Assunto | **Abrir desenho (GitHub)** | Fonte UML editável |
| --- | --- | --- |
| DER relacional PostgreSQL | **[Visualizar DER](DER.md)** | [DER.puml](DER.puml) · [Modelo DBML](receitando-der.dbml) |
| Componentes da infraestrutura | **[Visualizar componentes](Diagrama-de-Componentes.md)** | [Componentes.puml](receitando-diagrama-componentes.puml) |
| Sequência: matching e despensa | **[Visualizar matching](Diagrama-de-Sequencia.md)** | [Matching.puml](receitando-diagrama-sequencia-matching.puml) |
| Sequência: envio e moderação | **[Visualizar moderação](Diagrama-de-Moderacao.md)** | [Moderação.puml](receitando-diagrama-sequencia-envio-moderacao.puml) |
| Classes dos contratos do frontend | **[Visualizar classes](Diagrama-de-Classes.md)** | [Classes.puml](receitando-contratos-dados-frontend.puml) |

## Como visualizar e editar

- **Visualizar no GitHub:** clique em **Visualizar** na tabela acima. O desenho aparece dentro da página Markdown, sem precisar instalar programas.
- **Editar UML:** abra um arquivo `.puml` no VS Code com a extensão PlantUML, ou cole o código em um editor PlantUML.
- **Editar o DER relacional:** também pode usar [receitando-der.dbml](receitando-der.dbml) em um editor DBML; é fonte textual, não imagem.

## O que os diagramas representam

- A API REST não guarda o estado da sessão na memória de um Worker.
- A persistência relacional usa **Neon PostgreSQL** via **Hyperdrive**; não há D1 na arquitetura de produção.
- Imagens ficam no **R2** e o estado de salas WebSocket em **Durable Objects**.
- O DER retrata relações declaradas no [schema PostgreSQL](backend/worker-prototype/migrations/postgres/0001_baseline.sql). Campos auxiliares e a VIEW `recipe_search` permanecem no SQL, que é a fonte de verdade.
- O [System Design](docs/system-design-fase4.md) explica decisões arquiteturais e dimensionamento da Fase 4.

Esses diagramas servem de apoio à defesa do **projeto inteiro**, não apenas ao dimensionamento da Fase 4.
