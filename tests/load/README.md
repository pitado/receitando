# Testes de escalabilidade — PostgreSQL (Fase 4)

## Meta do professor
**1 milhão de escritas e 2 milhões de leituras**. A duração não foi definida no enunciado; a estratégia de escala está no [System Design](../../docs/system-design-fase4.md).

## Evidência de execução — 31/10/2026
O ensaio foi executado no **Neon PostgreSQL 17.11**, projeto `Receitando`, branch isolada **`benchmark-fase4-20261031`**, separada de `production`. Nenhuma tabela de usuários ou receitas foi usada no teste.

| Verificação | Resultado |
| --- | ---: |
| Linhas sintéticas gravadas (contagem confirmada) | **1.000.000** |
| Buscas correlacionadas por PK com resultado | **2.000.000 / 2.000.000** |
| Volume da tabela + índices | **102 MB** |
| Plano `EXPLAIN ANALYZE` para 20.000 buscas | **Index Only Scan — 20.000 loops — 0 heap fetches** |
| Tempo de execução informado pelo PostgreSQL nessa amostra | **31,410 ms** |

As leituras foram verificadas em uma consulta SQL que gera 2 milhões de chaves e verifica a existência das linhas em `fase4_benchmark`; as escritas foram inseridas em lotes `INSERT … SELECT generate_series`. A amostra de EXPLAIN confirma uso do índice.

### SQL reprodutível — somente em base isolada
```sql
CREATE TABLE IF NOT EXISTS fase4_benchmark (
  id BIGINT PRIMARY KEY,
  payload TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO fase4_benchmark (id, payload)
SELECT n, md5(n::text) FROM generate_series(1, 1000000) AS n
ON CONFLICT (id) DO NOTHING;

SELECT COUNT(*) AS persisted_rows FROM fase4_benchmark;

SELECT COUNT(*) AS successful_indexed_reads
FROM generate_series(1, 2000000) AS g(n)
WHERE EXISTS (
  SELECT 1 FROM fase4_benchmark b WHERE b.id = ((g.n-1) % 1000000) + 1
);

EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM generate_series(1, 20000) AS g(n)
WHERE EXISTS (
  SELECT 1 FROM fase4_benchmark b WHERE b.id = ((g.n-1) % 1000000) + 1
);
```

## Interpretação correta
**Resultado aprovado quanto às contagens SQL sintéticas.** Não é prova de 3 milhões de requisições HTTP, chamadas REST em produção, VUs simultâneos, latência p95/p99 do serviço ou capacidade sustentada. A branch de teste recebeu dados próprios e seu dimensionamento não deve ser extrapolado para outras configurações.

## Homologação HTTP complementar
Antes de alegar capacidade da aplicação inteira: usar staging independente **Worker API → Hyperdrive → Neon PostgreSQL**, k6 com escritas e leituras 1:2, medir p95/p99, RPS, erros e persistência, testar rampas/picos, e registrar ID do workflow. Não direcionar um teste agressivo ao banco de usuários nem confundir resultados de ambientes distintos. **Nessa etapa não há resultado k6 da API com PostgreSQL**.

[System Design](../../docs/system-design-fase4.md) · [Schema PostgreSQL](../../backend/worker-prototype/migrations/postgres/0001_baseline.sql).
