# Testes e qualidade

A API utiliza testes de TypeScript, rotas, autenticação, camada PostgreSQL e integração com banco local isolado. O **Receitando Juntos** dispõe de testes de WebSocket com dois clientes locais, concorrência, presença e reconexão. O frontend usa lint, typecheck, testes de componente e cenários E2E.

**Comandos de API:**
```bash
cd backend/worker-prototype
npm ci
npm run typecheck
npm test
npm run test:postgres
npm run test:ws
```
**Banco:** o CI prepara um PostgreSQL temporário. Rodar scripts de fixture somente quando `POSTGRES_TEST_URL` apontar para `localhost`.

**Escala:** execução SQL real de 31/10/2026 em branch de benchmark Neon isolada, com 1 milhão de escritas e 2 milhões de consultas indexadas, [metodologia e limites](../tests/load/README.md). **Não é** prova de 3 milhões de requisições HTTP nem teste de p95 de produção. Os resultados HTTP devem ser analisados separadamente, em staging.

[System Design](system-design-fase4.md) · [WebSocket](receitando-juntos.md).
