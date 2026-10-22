# Receitando - Diagramas editáveis

Diagramas na raiz do repositório. **Não são PNGs**: arquivos `.drawio` permitem editar formas, campos, conexões, participantes e mensagens no [diagrams.net](https://app.diagrams.net/).

| Conteúdo | Diagrama para editar | Código-fonte complementar |
| --- | --- | --- |
| DER físico (banco D1) | [receitando-der.drawio](receitando-der.drawio) | [receitando-der.dbml](receitando-der.dbml) |
| UML sequência - matching | [receitando-diagrama-sequencia-matching.drawio](receitando-diagrama-sequencia-matching.drawio) | [receitando-diagrama-sequencia-matching.puml](receitando-diagrama-sequencia-matching.puml) |
| UML sequência - envio/moderação | [receitando-diagrama-sequencia-envio-moderacao.drawio](receitando-diagrama-sequencia-envio-moderacao.drawio) | [receitando-diagrama-sequencia-envio-moderacao.puml](receitando-diagrama-sequencia-envio-moderacao.puml) |
| Componentes da arquitetura | [receitando-diagrama-componentes.drawio](receitando-diagrama-componentes.drawio) | — |
| Contratos TypeScript do frontend | [receitando-contratos-dados-frontend.drawio](receitando-contratos-dados-frontend.drawio) | — |

**Abrir:** baixe um arquivo `.drawio`, acesse diagrams.net e escolha Arquivo > Abrir de > Dispositivo. Para editar por código, use o DBML no dbdiagram.io e os `.puml` no PlantUML/VS Code.

**Origem e precisão:** o Receitando utiliza **Cloudflare D1 (SQLite)**, não MySQL. O DER reproduz o modelo SQL físico em apresentação EER. Ver [migrations SQL](backend/worker-prototype/migrations/) e [documentação do banco](docs/database.md). O índice `recipe_search` é tabela virtual FTS5 sem FK; `reviewed_by` e `published_recipe_id` são colunas sem FK declarada. Diagramas de sequência baseados em [architecture.md](docs/architecture.md) e nos módulos do backend.


## Prévia visual diretamente no GitHub

O GitHub mostra XML ao abrir `.drawio` diretamente. **Estas páginas renderizam os diagramas como gráficos Mermaid**, sem baixar arquivos:

- [Ver prévia: DER do banco de dados](docs/diagramas/der.md) — [editar](./receitando-der.drawio)
- [Ver prévia: Sequência UML — busca por ingredientes](docs/diagramas/sequencia-matching.md) — [editar](./receitando-diagrama-sequencia-matching.drawio)
- [Ver prévia: Sequência UML — envio e moderação](docs/diagramas/sequencia-envio-moderacao.md) — [editar](./receitando-diagrama-sequencia-envio-moderacao.drawio)
- [Ver prévia: Componentes da arquitetura](docs/diagramas/componentes.md) — [editar](./receitando-diagrama-componentes.drawio)
- [Ver prévia: Contratos TypeScript do frontend](docs/diagramas/contratos-frontend.md) — [editar](./receitando-contratos-dados-frontend.drawio)

