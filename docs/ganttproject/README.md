# Diagrama de Gantt do Receitando

Período registrado de **10/08/2026 a 19/11/2026**, no horário de Brasília. O gráfico reúne o trabalho integrado à `main` em 16 etapas. A origem de cada linha está nos PRs e nos commits abaixo.

- [Diagrama em PDF (A4 paisagem)](export/Receitando_GanttProject_Exportado.pdf)
- [Diagrama em PNG](export/Receitando_GanttProject_Exportado.png)
- [Projeto editável do GanttProject](Receitando_Historico.gan)

## Etapas e evidências

| Etapa | Primeiro e último registro | Evidências |
| --- | --- | --- |
| Estrutura inicial e deploy do frontend | 10/08 a 13/08 | 1 PR e commits iniciais |
| Contas, autenticação e primeira API | 13/08 a 18/08 | 17 PRs |
| Despensa, catálogo, combinação e favoritos | 18/08 a 19/08 | 15 PRs |
| Comunidade e conteúdo da página inicial | 18/08 a 24/08 | 7 PRs |
| Identidade visual, página inicial e 404 | 18/08 a 24/08 | 24 PRs |
| Catálogo Wikilivros, busca e API v2 | 24/08 a 02/09 | 9 PRs |
| Documentação, segurança e testes | 24/08 a 28/08 | 17 PRs |
| Adaptação de receitas e despensa inteligente | 28/08 a 28/08 | 4 PRs |
| Redesign, busca e navegação | 28/08 a 14/09 | 19 PRs |
| Envio de receitas, imagens e moderação | 01/09 a 14/09 | 6 PRs |
| Indexação e métricas do site | 01/09 a 09/09 | 5 PRs |
| Redesign das principais telas | 06/10 a 07/10 | 5 PRs |
| Receitando Juntos em tempo real | 29/10 a 30/10 | 3 PRs |
| Migração para Neon, arquitetura e escala | 29/10 a 31/10 | 11 PRs |
| Catálogo autoral e fontes brasileiras | 30/10 a 30/10 | 2 PRs |
| Identidade, indexação e acabamento visual | 08/11 a 19/11 | 6 PRs |

## Como ler as datas

Cada etapa começa no primeiro registro e termina no último registro listado. Os PRs usam a data de integração à `main`, e a estrutura inicial usa também as datas de registro dos primeiros commits. As barras abrangem dias corridos e podem se sobrepor.

A revisão considerou 196 PRs e a [versão da main usada na conferência](https://github.com/pitado/receitando/commit/2d31fb2ef88f3cfb61360b5c46088fdfd6f79661). Os 151 PRs integrados à `main` aparecem uma vez na lista. Houve 1 merge em outra branch, 15 PRs abertos e 29 PRs fechados sem merge no momento da consulta.

O histórico confirma os registros de integração. Datas de planejamento fora do Git, horas de trabalho e aprovação ou apresentação acadêmica dependem de evidências do grupo.

## PRs e commits por etapa

### Estrutura inicial e deploy do frontend

Primeiros arquivos da aplicação, domínio, deploy do frontend e verificação automática.

Commits iniciais: [`381f63dc`](https://github.com/pitado/receitando/commit/381f63dca12c2e452cb24764797e5afe21418867) (10/08), [`52a515d7`](https://github.com/pitado/receitando/commit/52a515d77ccbc4513e60bca2f9d88ea428789993) (10/08), [`163e0048`](https://github.com/pitado/receitando/commit/163e0048fb6f22559d136729b6c5411e6d7b0f12) (13/08), [`634a1552`](https://github.com/pitado/receitando/commit/634a15526907b2542915fc6aecf0da171709cb68) (13/08).

PRs: [#17](https://github.com/pitado/receitando/pull/17) (13/08).

### Contas, autenticação e primeira API

Login, cadastro, sessão e perfil, recuperação por e-mail e publicação da primeira API no Worker com D1.

PRs: [#1](https://github.com/pitado/receitando/pull/1) (13/08), [#15](https://github.com/pitado/receitando/pull/15) (13/08), [#16](https://github.com/pitado/receitando/pull/16) (13/08), [#18](https://github.com/pitado/receitando/pull/18) (17/08), [#19](https://github.com/pitado/receitando/pull/19) (17/08), [#20](https://github.com/pitado/receitando/pull/20) (17/08), [#21](https://github.com/pitado/receitando/pull/21) (17/08), [#22](https://github.com/pitado/receitando/pull/22) (17/08), [#23](https://github.com/pitado/receitando/pull/23) (17/08), [#24](https://github.com/pitado/receitando/pull/24) (17/08), [#25](https://github.com/pitado/receitando/pull/25) (17/08), [#33](https://github.com/pitado/receitando/pull/33) (18/08), [#34](https://github.com/pitado/receitando/pull/34) (18/08), [#35](https://github.com/pitado/receitando/pull/35) (18/08), [#36](https://github.com/pitado/receitando/pull/36) (18/08), [#37](https://github.com/pitado/receitando/pull/37) (18/08), [#38](https://github.com/pitado/receitando/pull/38) (18/08).

### Despensa, catálogo, combinação e favoritos

Despensa ligada à conta, catálogo inicial e Combinador. Inclui as primeiras iterações de fonte de receitas.

PRs: [#28](https://github.com/pitado/receitando/pull/28) (18/08), [#31](https://github.com/pitado/receitando/pull/31) (18/08), [#32](https://github.com/pitado/receitando/pull/32) (18/08), [#43](https://github.com/pitado/receitando/pull/43) (18/08), [#44](https://github.com/pitado/receitando/pull/44) (18/08), [#45](https://github.com/pitado/receitando/pull/45) (19/08), [#46](https://github.com/pitado/receitando/pull/46) (19/08), [#47](https://github.com/pitado/receitando/pull/47) (19/08), [#48](https://github.com/pitado/receitando/pull/48) (19/08), [#49](https://github.com/pitado/receitando/pull/49) (19/08), [#50](https://github.com/pitado/receitando/pull/50) (19/08), [#51](https://github.com/pitado/receitando/pull/51) (19/08), [#53](https://github.com/pitado/receitando/pull/53) (19/08), [#54](https://github.com/pitado/receitando/pull/54) (19/08), [#56](https://github.com/pitado/receitando/pull/56) (19/08).

### Comunidade e conteúdo da página inicial

Avaliações, comentários, conteúdo da comunidade e estabilização do feed.

PRs: [#39](https://github.com/pitado/receitando/pull/39) (18/08), [#40](https://github.com/pitado/receitando/pull/40) (18/08), [#41](https://github.com/pitado/receitando/pull/41) (18/08), [#42](https://github.com/pitado/receitando/pull/42) (18/08), [#79](https://github.com/pitado/receitando/pull/79) (24/08), [#81](https://github.com/pitado/receitando/pull/81) (24/08), [#82](https://github.com/pitado/receitando/pull/82) (24/08).

### Identidade visual, página inicial e 404

Marca, favicon, cabeçalho, rodapé, artes visuais e página de erro.

PRs: [#26](https://github.com/pitado/receitando/pull/26) (18/08), [#27](https://github.com/pitado/receitando/pull/27) (18/08), [#29](https://github.com/pitado/receitando/pull/29) (18/08), [#30](https://github.com/pitado/receitando/pull/30) (18/08), [#57](https://github.com/pitado/receitando/pull/57) (19/08), [#58](https://github.com/pitado/receitando/pull/58) (19/08), [#59](https://github.com/pitado/receitando/pull/59) (19/08), [#60](https://github.com/pitado/receitando/pull/60) (19/08), [#61](https://github.com/pitado/receitando/pull/61) (19/08), [#62](https://github.com/pitado/receitando/pull/62) (19/08), [#63](https://github.com/pitado/receitando/pull/63) (19/08), [#64](https://github.com/pitado/receitando/pull/64) (19/08), [#65](https://github.com/pitado/receitando/pull/65) (19/08), [#66](https://github.com/pitado/receitando/pull/66) (19/08), [#67](https://github.com/pitado/receitando/pull/67) (19/08), [#68](https://github.com/pitado/receitando/pull/68) (19/08), [#69](https://github.com/pitado/receitando/pull/69) (19/08), [#71](https://github.com/pitado/receitando/pull/71) (24/08), [#72](https://github.com/pitado/receitando/pull/72) (24/08), [#73](https://github.com/pitado/receitando/pull/73) (24/08), [#74](https://github.com/pitado/receitando/pull/74) (24/08), [#75](https://github.com/pitado/receitando/pull/75) (24/08), [#76](https://github.com/pitado/receitando/pull/76) (24/08), [#77](https://github.com/pitado/receitando/pull/77) (24/08).

### Catálogo Wikilivros, busca e API v2

Fontes e imagens livres, importação, busca, paginação, API v2 e migração de imagens para o R2.

PRs: [#83](https://github.com/pitado/receitando/pull/83) (24/08), [#85](https://github.com/pitado/receitando/pull/85) (24/08), [#86](https://github.com/pitado/receitando/pull/86) (24/08), [#87](https://github.com/pitado/receitando/pull/87) (24/08), [#88](https://github.com/pitado/receitando/pull/88) (24/08), [#89](https://github.com/pitado/receitando/pull/89) (24/08), [#116](https://github.com/pitado/receitando/pull/116) (28/08), [#118](https://github.com/pitado/receitando/pull/118) (28/08), [#136](https://github.com/pitado/receitando/pull/136) (02/09).

### Documentação, segurança e testes

Escopo, organização do repositório, autenticação com cookie HttpOnly, testes E2E e documentação.

PRs: [#78](https://github.com/pitado/receitando/pull/78) (24/08), [#90](https://github.com/pitado/receitando/pull/90) (25/08), [#91](https://github.com/pitado/receitando/pull/91) (25/08), [#92](https://github.com/pitado/receitando/pull/92) (25/08), [#94](https://github.com/pitado/receitando/pull/94) (25/08), [#95](https://github.com/pitado/receitando/pull/95) (25/08), [#96](https://github.com/pitado/receitando/pull/96) (25/08), [#98](https://github.com/pitado/receitando/pull/98) (25/08), [#102](https://github.com/pitado/receitando/pull/102) (26/08), [#103](https://github.com/pitado/receitando/pull/103) (26/08), [#104](https://github.com/pitado/receitando/pull/104) (26/08), [#105](https://github.com/pitado/receitando/pull/105) (26/08), [#106](https://github.com/pitado/receitando/pull/106) (26/08), [#107](https://github.com/pitado/receitando/pull/107) (26/08), [#108](https://github.com/pitado/receitando/pull/108) (28/08), [#110](https://github.com/pitado/receitando/pull/110) (28/08), [#112](https://github.com/pitado/receitando/pull/112) (28/08).

### Adaptação de receitas e despensa inteligente

Motor de adaptação culinária, validade, priorização por ingredientes e lista de compras.

PRs: [#114](https://github.com/pitado/receitando/pull/114) (28/08), [#117](https://github.com/pitado/receitando/pull/117) (28/08), [#124](https://github.com/pitado/receitando/pull/124) (28/08), [#126](https://github.com/pitado/receitando/pull/126) (28/08).

### Redesign, busca e navegação

Busca por ingredientes, redesign editorial, navegação mobile e ajustes de acessibilidade e usabilidade.

PRs: [#119](https://github.com/pitado/receitando/pull/119) (28/08), [#120](https://github.com/pitado/receitando/pull/120) (28/08), [#121](https://github.com/pitado/receitando/pull/121) (28/08), [#123](https://github.com/pitado/receitando/pull/123) (28/08), [#125](https://github.com/pitado/receitando/pull/125) (02/09), [#137](https://github.com/pitado/receitando/pull/137) (02/09), [#138](https://github.com/pitado/receitando/pull/138) (02/09), [#139](https://github.com/pitado/receitando/pull/139) (02/09), [#140](https://github.com/pitado/receitando/pull/140) (02/09), [#141](https://github.com/pitado/receitando/pull/141) (02/09), [#142](https://github.com/pitado/receitando/pull/142) (02/09), [#143](https://github.com/pitado/receitando/pull/143) (02/09), [#144](https://github.com/pitado/receitando/pull/144) (02/09), [#149](https://github.com/pitado/receitando/pull/149) (09/09), [#151](https://github.com/pitado/receitando/pull/151) (14/09), [#152](https://github.com/pitado/receitando/pull/152) (14/09), [#153](https://github.com/pitado/receitando/pull/153) (14/09), [#154](https://github.com/pitado/receitando/pull/154) (14/09), [#155](https://github.com/pitado/receitando/pull/155) (14/09).

### Envio de receitas, imagens e moderação

Envio e upload de fotos pelo celular, armazenamento de imagens e área de moderação.

PRs: [#129](https://github.com/pitado/receitando/pull/129) (01/09), [#130](https://github.com/pitado/receitando/pull/130) (01/09), [#131](https://github.com/pitado/receitando/pull/131) (01/09), [#132](https://github.com/pitado/receitando/pull/132) (02/09), [#147](https://github.com/pitado/receitando/pull/147) (04/09), [#150](https://github.com/pitado/receitando/pull/150) (14/09).

### Indexação e métricas do site

Sitemap, robots.txt e configuração do Cloudflare Web Analytics.

PRs: [#128](https://github.com/pitado/receitando/pull/128) (01/09), [#133](https://github.com/pitado/receitando/pull/133) (02/09), [#134](https://github.com/pitado/receitando/pull/134) (02/09), [#135](https://github.com/pitado/receitando/pull/135) (02/09), [#148](https://github.com/pitado/receitando/pull/148) (09/09).

### Redesign das principais telas

Atualização visual da Home, cadastro e recuperação de senha, despensa, receitas e favoritos.

PRs: [#158](https://github.com/pitado/receitando/pull/158) (06/10), [#159](https://github.com/pitado/receitando/pull/159) (07/10), [#160](https://github.com/pitado/receitando/pull/160) (07/10), [#162](https://github.com/pitado/receitando/pull/162) (07/10), [#164](https://github.com/pitado/receitando/pull/164) (07/10).

### Receitando Juntos em tempo real

Salas, presença, preparo sincronizado por WebSocket e experiência guiada.

PRs: [#168](https://github.com/pitado/receitando/pull/168) (29/10), [#169](https://github.com/pitado/receitando/pull/169) (30/10), [#170](https://github.com/pitado/receitando/pull/170) (30/10).

### Migração para Neon, arquitetura e escala

Migração para PostgreSQL via Hyperdrive, testes de integração e carga, documentação de arquitetura e UML.

PRs: [#166](https://github.com/pitado/receitando/pull/166) (29/10), [#171](https://github.com/pitado/receitando/pull/171) (30/10), [#172](https://github.com/pitado/receitando/pull/172) (30/10), [#173](https://github.com/pitado/receitando/pull/173) (30/10), [#176](https://github.com/pitado/receitando/pull/176) (31/10), [#177](https://github.com/pitado/receitando/pull/177) (31/10), [#178](https://github.com/pitado/receitando/pull/178) (31/10), [#179](https://github.com/pitado/receitando/pull/179) (31/10), [#180](https://github.com/pitado/receitando/pull/180) (31/10), [#181](https://github.com/pitado/receitando/pull/181) (31/10), [#182](https://github.com/pitado/receitando/pull/182) (31/10).

### Catálogo autoral e fontes brasileiras

Catálogo autoral inicial e curadoria de fontes brasileiras com verificação de direitos autorais.

PRs: [#174](https://github.com/pitado/receitando/pull/174) (30/10), [#175](https://github.com/pitado/receitando/pull/175) (30/10).

### Identidade, indexação e acabamento visual

Nova identidade, metadados e indexação de receitas, ajustes na Home e alinhamento de catálogo e layout.

PRs: [#186](https://github.com/pitado/receitando/pull/186) (08/11), [#187](https://github.com/pitado/receitando/pull/187) (08/11), [#189](https://github.com/pitado/receitando/pull/189) (18/11), [#190](https://github.com/pitado/receitando/pull/190) (18/11), [#191](https://github.com/pitado/receitando/pull/191) (19/11), [#192](https://github.com/pitado/receitando/pull/192) (19/11).
