# Fase 4 — Teste inicial de carga (k6)

O arquivo `receitando-read.js` é **somente leitura**, para não modificar dados reais, gerar contas ou enviar e-mails. O modo padrão é um smoke test curto; o modo load aumenta gradualmente até 20 usuários virtuais. Não equivale a comprovar 1 milhão de escritas e 2 milhões de leituras.

## Cenário acadêmico de escrita e leitura (D1 local)

O arquivo `receitando-professor.js` define **1.000.000 de POSTs** (cada um insere um UUID na tabela `load_benchmark`) e **2.000.000 de GETs** (cada um executa `SELECT COUNT(*)`). São operações simultâneas no D1 local do runner do GitHub, e não um teste de produção. A execução tem prazo máximo e pode terminar antes da meta, com falha por timeout ou erro de banco. A contagem real de operações bem-sucedidas deve ser conferida em `summary.json`, pelas métricas `successful_writes` e `successful_reads` e pelo código de saída. **A meta é configurada, não garantida.**

Na aba Actions, escolha o workflow **Teste de Escalabilidade (k6)**, branch `main`, cenário `professor`. O teste usa até 80 VUs de escrita e 160 de leitura, por até 35 minutos. Não executar contra produção.

**Limitações:** consultas `COUNT(*)` e inserções sintéticas não representam todas as consultas e transações de negócio; uma única máquina executa gerador de carga e API local; métricas não comprovam capacidade de produção nem alta disponibilidade. As operações devem ser interpretadas conforme a janela temporal exigida no enunciado.

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

## Logs completos e relatório

Crie uma pasta local para os resultados (ela não deve ser commitada):

```bash
mkdir -p results/load
k6 run -e DETAILED_LOGS=1 --summary-export results/load/summary.json --out json=results/load/metrics.json tests/load/receitando-read.js > results/load/requests.log 2>&1
```

Arquivos gerados:
- `requests.log`: log JSON por requisição, mensagens do k6 e resumo do terminal.
- `metrics.json`: amostras de métricas emitidas pelo k6 em JSON Lines.
- `summary.json`: métricas consolidadas do cenário.

A execução registra cada requisição de teste no console somente com `DETAILED_LOGS=1`. Não registra o corpo da resposta nem dados de autenticação. O volume de logs pode ser alto; usar em execução controlada. O resumo não é uma trilha de auditoria de todas as operações internas do backend. Para isso, é necessário instrumentar a API e a infraestrutura separadamente.

Os arquivos são criados quando o comando é executado. Os resultados efetivos devem ser obtidos no artifact da execução correspondente; não presumir aprovação por configuração.
