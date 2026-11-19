# MiroFish + Receitando: limites e fluxo seguro

## O que cada ferramenta realmente faz

- **MiroFish**: simula reações e interações sociais de agentes de IA em um mundo virtual. Não é um navegador autônomo nem uma substituição direta para Playwright.
- **Playwright**: executa interações reais no navegador, com asserções e capturas de falhas. O arquivo `frontend/e2e/tests/synthetic-agents.spec.ts` contém 50 jornadas **determinísticas**, não 50 agentes MiroFish.
- Não afirmar que MiroFish navegou pelo site ou que usuários reais foram observados.

Referência upstream: https://github.com/666ghj/MiroFish

## Procedimento recomendado

1. Corrigir e validar o E2E no PR, sem merge automático.
2. Executar piloto representativo: `cd frontend/e2e && AGENT_PILOT=1 npx playwright test synthetic-agents.spec.ts --workers=2`.
3. Executar as 50 jornadas: `cd frontend/e2e && npx playwright test synthetic-agents.spec.ts --workers=2`.
4. Alimentar uma simulação MiroFish separada com uma descrição do produto, perfis, jornadas e **resultados reais** do Playwright. Solicitar hipóteses de fricção, expectativas e prioridades; não usar a simulação como prova de defeito.
5. Transformar cada hipótese relevante em teste Playwright observável. Registrar passos, screenshot, trace e resultado reproduzível.
6. Validar com usuários humanos antes de inferir preferência ou usabilidade real.

## Segurança e custos

- Preferir servidor local/staging com dados fictícios e API mockada.
- Não enviar credenciais, dados de usuários, chaves ou conteúdo privado ao MiroFish/LLM/Zep.
- MiroFish upstream requer configuração externa de LLM e Zep; custos e limites variam. Não executar automaticamente sem configurar essas dependências.
- Não fazer escrita em produção nem publicar resultados sintéticos como pesquisa com usuários.

## Status

- A suíte Playwright está integrada ao PR e executa no GitHub Actions.
- Integração de runtime com MiroFish **não implementada**; o projeto upstream não fornece execução de ações de navegador como função nativa documentada.
- Próxima entrega técnica: converter hipóteses exportadas de MiroFish em casos Playwright com validação humana dos seletores.
