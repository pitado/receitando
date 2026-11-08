# Experimento: 50 agentes simulados — Receitando

## Objetivo
Avaliar jornadas, decisões e possíveis dificuldades de uso com 50 personas sintéticas. **Não confundir simulação comportamental com testes reais ou usuários humanos.**

## Perfis
- 15 iniciantes
- 10 usuários frequentes
- 10 pessoas com orçamento limitado
- 10 usuários prioritariamente mobile
- 5 usuários avançados

## Etapas
1. Mapear rotas e fluxos existentes, identificando autenticação, catálogo, busca, favoritos, combinação e Cozinhar Juntos.
2. Preparar ambiente isolado com dados fictícios e sem acesso de escrita ao banco de produção.
3. Configurar MiroFish para cenários e decisões; validar se sua API permite exportar decisões para um orquestrador externo.
4. Implementar adaptador que converta decisões em ações Playwright, com limites de concorrência, timeout, logs e screenshots de falhas.
5. Executar piloto com 5 agentes e só depois expandir a 50.
6. Executar k6 separadamente para carga, com limites definidos.
7. Produzir relatório de jornadas, erros reproduzíveis, métricas e recomendações.

## Critérios de segurança
- Nenhum cadastro, alteração de receitas, comentário ou operação destrutiva na produção.
- Não reutilizar tokens ou dados pessoais reais.
- Não executar 50 navegadores simultâneos sem dimensionamento prévio.
- Segredos em variáveis de ambiente, nunca no repositório.
- Simulações não substituem testes com pessoas reais.

## Estado
Plano inicial criado; nenhum teste executado. Próximo passo: inspecionar rotas e infraestrutura e construir o primeiro teste automatizado.
