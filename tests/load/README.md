# Fase 4 — Teste inicial de carga (k6)

Este cenário é **somente leitura**, para não modificar dados reais, gerar contas ou enviar e-mails. O modo padrão é um smoke test curto; o modo load aumenta gradualmente até 20 usuários virtuais. Não equivale a comprovar 1 milhão de escritas e 2 milhões de leituras.

## Execução local

1. Inicie a API em `backend/worker-prototype` com `npm ci && npm run migrate:local && npm run dev`.
2. Instale k6 conforme a documentação oficial: https://grafana.com/docs/k6/latest/set-up/install-k6/
3. Na raiz do repositório:

```bash
k6 run tests/load/receitando-read.js
k6 run -e MODE=load tests/load/receitando-read.js
```

Opcionalmente, `-e BASE_URL=https://api.receitando.miguelpita.com.br` direciona à produção, mas **não execute carga em produção sem autorização, orçamento e janela controlada**.

## Medições

Registrar `http_reqs`, `http_req_duration` (p95), `http_req_failed`, `application_errors` e throughput observado. Metas iniciais ilustrativas: p95 inferior a 1 s e taxa de falha inferior a 1%; ajustar a partir de requisitos e linha de base.

## Limitações e próxima etapa

- Testa apenas GETs públicos; não mede escritas, WebSocket, pagamentos nem limites reais do D1 sob escrita.
- Para validar a razão 1:2, construir um ambiente de staging isolado com dados sintéticos, endpoints de escrita controlados, limpeza e monitoramento.
- Declarar janela de tempo: 1M escritas e 2M leituras por dia equivalem em média a 11,57 escritas/s e 23,15 leituras/s; por hora equivalem a 277,78 e 555,56 por segundo.
- Nenhum resultado numérico de performance deve ser declarado sem execução e relatório.
