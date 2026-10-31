# Receitando - Diagramas editáveis

Diagramas na raiz do repositório. **Não são PNGs**: arquivos `.drawio` permitem editar formas, campos, conexões, participantes e mensagens no [diagrams.net](https://app.diagrams.net/).

| Conteúdo | Diagrama para editar | Código-fonte complementar |
| --- | --- | --- |
| DER físico (banco PostgreSQL) | [DER.drawio](DER.drawio) | [receitando-der.dbml](receitando-der.dbml) |
| UML sequência - matching | [Diagrama-de-Sequencia.drawio](Diagrama-de-Sequencia.drawio) | [receitando-diagrama-sequencia-matching.puml](receitando-diagrama-sequencia-matching.puml) |
| UML sequência - envio/moderação | [receitando-diagrama-sequencia-envio-moderacao.drawio](receitando-diagrama-sequencia-envio-moderacao.drawio) | [receitando-diagrama-sequencia-envio-moderacao.puml](receitando-diagrama-sequencia-envio-moderacao.puml) |
| Componentes da arquitetura | [receitando-diagrama-componentes.drawio](receitando-diagrama-componentes.drawio) | — |
| Contratos TypeScript do frontend | [receitando-contratos-dados-frontend.drawio](receitando-contratos-dados-frontend.drawio) | — |

**Abrir:** baixe um arquivo `.drawio`, acesse diagrams.net e escolha Arquivo > Abrir de > Dispositivo. Para editar por código, use o DBML no dbdiagram.io e os `.puml` no PlantUML/VS Code.

**Origem e precisão:** o Receitando utiliza **Neon PostgreSQL (PostgreSQL)**, não MySQL. O DER reproduz o modelo SQL físico em apresentação EER. Ver [migrations PostgreSQL](backend/worker-prototype/migrations/postgres/) e [documentação do banco](docs/database.md). `recipe_search` é uma **VIEW PostgreSQL** sobre a tabela `recipes`; a busca utiliza índice GIN em `recipes` (não é uma tabela materializada); `reviewed_by` e `published_recipe_id` são colunas sem FK declarada. Diagramas de sequência baseados em [architecture.md](docs/architecture.md) e nos módulos do backend.


## Prévia visual diretamente no GitHub

O GitHub mostra XML ao abrir `.drawio` diretamente. **Estas páginas renderizam os diagramas como gráficos Mermaid**, sem baixar arquivos:

- [Ver prévia: DER do banco de dados](docs/diagramas/der.md) — [editar](./DER.drawio)
- [Ver prévia: Sequência UML — busca por ingredientes](docs/diagramas/sequencia-matching.md) — [editar](./Diagrama-de-Sequencia.drawio)
- [Ver prévia: Sequência UML — envio e moderação](docs/diagramas/sequencia-envio-moderacao.md) — [editar](./receitando-diagrama-sequencia-envio-moderacao.drawio)
- [Ver prévia: Componentes da arquitetura](docs/diagramas/componentes.md) — [editar](./receitando-diagrama-componentes.drawio)
- [Ver prévia: Contratos TypeScript do frontend](docs/diagramas/contratos-frontend.md) — [editar](./receitando-contratos-dados-frontend.drawio)

