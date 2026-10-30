# Receitando — testes k6 de leitura, escrita e escala

## O que estamos medindo

Este repositório contém testes de desempenho **sintéticos** da API do Receitando, com banco D1 emulado localmente pelo Wrangler em um runner temporário do GitHub Actions. O banco local é criado do zero a cada execução, não utiliza nem modifica as receitas/usuários do banco Cloudflare de produção.

O requisito acadêmico é uma arquitetura que suporte **1 milhão de escritas para cada 2 milhões de leituras**. O enunciado não define se esse volume ocorre por hora, dia ou outro período. Um teste bem-sucedido valida **a carga e o ambiente testados**, não comprova automaticamente capacidade em produção na Cloudflare.

| Cenário do GitHub Actions | Tipo | Objetivo |
| --- | --- | --- |
| `smoke` | GETs públicos + smoke individual de POST/GET | Verificar conectividade e funcionamento |
| `mixed` | POST + GET no D1 local, rampa até 10 VUs | Testar concorrência leve na proporção 1:2 |
| `load` / `stress` | GETs públicos | Medir rotas de leitura existentes |
| `professor-check` | 1.000 escritas + 2.000 leituras indexadas | Verificar a metodologia e a geração do relatório completo |
| **`professor`** | **1.000.000 escritas + 2.000.000 leituras indexadas** | Tentar a comprovação de 3 milhões de operações sintéticas |

## Como executar o teste completo

1. Abra [GitHub Actions — Teste de Escalabilidade](https://github.com/pitado/receitando/actions/workflows/load-test.yml).
2. Clique em **Run workflow** e escolha a branch `main`.
3. Recomenda-se executar primeiro `professor-check` para evitar desperdiçar recursos com falhas de configuração.
4. Em seguida, selecione `professor` para a meta de 1 milhão de escritas e 2 milhões de leituras.
5. Ao finalizar, baixe o artifact `k6-results-professor` na página da execução e examine `report.md`, `evidence.json`, `summary.json`, `requests.log` e `api.log`.

**ATENÇÃO:** o cenário `professor` pode consumir bastante tempo de execução do GitHub Actions. Pode falhar por gargalo, limite de tempo, interrupções ou falta de recursos. O máximo configurado para as iterações é 135 minutos; o workflow permite tempo adicional para inicialização e coleta de evidências. O teste não faz requisições ao serviço publicado nem à conta remota de D1.

## Como evitamos resultados enganosos

- A etapa inicial faz um **POST** para inserir um registro e um **GET indexado** para confirmar que o registro pode ser recuperado; em seguida registra a contagem inicial.
- Cada iteração de escrita usa um UUID determinístico exclusivo, enviado no cabeçalho `X-Benchmark-Id`. O backend usa `INSERT OR IGNORE`, tornando retentativas seguras contra duplicação da mesma escrita.
- As leituras executam **SQL indexado** (`SELECT id FROM load_benchmark WHERE id = ? LIMIT 1`) e verificam `found: true` em resposta HTTP 200. Um único registro-semente já persistido é usado como chave de leitura. É uma carga sintética de leitura de chave existente, **não** reproduz o catálogo completo de receitas.
- O k6 conta **somente operações lógicas bem-sucedidas** em `successful_writes` e `successful_reads` e registra taxa de erros HTTP, retentativas e latência p95.
- Depois do k6, `tests/load/verify-professor.mjs` consulta a contagem final do D1. Só aprova quando existem **exatamente 1.000.000 novas linhas gravadas**, 1.000.000 respostas de escrita confirmadas, 2.000.000 respostas de leitura confirmadas, falhas HTTP inferiores a 1%, p95 abaixo de 1 segundo e saída normal do k6.
- O relatório final é criado **inclusive em caso de reprovação** quando o verificador consegue executar; artefatos e logs são publicados com `if: always()`. Assim a execução fornece evidências verificáveis, sem afirmar sucesso por configuração.

## Histórico confirmado

- [Smoke aprovado, 30/10/2026](https://github.com/pitado/receitando/actions/runs/40987574136/job/123842067616): 65 requisições HTTP k6, sem falhas, p95 de 7,89 ms.
- [Mixed aprovado, 30/10/2026](https://github.com/pitado/receitando/actions/runs/40988074830/job/123843668166): 774 escritas e 1.548 leituras, total 2.322, zero falhas HTTP, p95 de 8,62 ms, até 10 VUs, D1 local.
- [Primeira tentativa de 3 milhões — não aprovada](https://github.com/pitado/receitando/actions/runs/40977433968): cerca de 2,5 milhões de tentativas, mas 100% falharam; não é prova de escala.

**Importante:** o simples fato de o workflow ficar verde comprova apenas os critérios definidos no teste; sempre citar duração, ambiente, taxa, latência, contagem real e limitações.

## Execução local de consultas públicas

No diretório `backend/worker-prototype`, instale dependências e suba o servidor com `npm ci && npm run migrate:local && npm run dev`. Na raiz do repositório, com k6 instalado:

```bash
k6 run tests/load/receitando-read.js
k6 run -e MODE=load tests/load/receitando-read.js
```

Para os cenários sintéticos de escrita é necessário configurar `BENCHMARK_ENABLED:true` apenas no Wrangler **local** e criar a tabela `load_benchmark`. O endpoint não deve ser habilitado em produção.

## Limitações arquiteturais

A D1 remota possui limites próprios de throughput, filas, linhas lidas/escritas e preço, diferentes do D1 local. A quantidade de operações HTTP não é necessariamente igual à quantidade de linhas D1 faturáveis. A defesa do professor deve explicar escalabilidade horizontal dos Workers, gargalo de escrita em banco único, cache para leituras públicas, índices e eventual particionamento. Para validar escala **na Cloudflare**, criar um Worker de staging independente com um D1 remoto exclusivo, avaliar o plano/limites e medir nesse ambiente, com controle de custo.
