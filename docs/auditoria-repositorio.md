# Auditoria de organização do repositório — 29/10/2026

## Resultado preliminar

A árvore `main` contém aproximadamente **277 arquivos versionados**. Esta é uma auditoria estrutural, **não uma validação de compilação, testes, segurança ou execução em produção**. Nenhum arquivo de aplicação foi apagado.

### Preservar (uso atual ou relevância acadêmica)

- `backend/worker-prototype/`: apesar do nome, é a API ativa em Cloudflare Workers; **não remover nem renomear sem atualizar CI/CD e referências**.
- `frontend/`: Next.js, PWA, assets e testes.
- `backend/worker-prototype/migrations/`: histórico necessário para recriar o banco; não apagar migrations antigas.
- `DER.drawio`, `Diagrama-de-Sequencia.drawio`, demais `.drawio`/`.puml` e `receitando-der.dbml`: materiais acadêmicos e formatos editáveis. Organizar só após atualizar todos os links.
- `docs/`, `.github/workflows/`, arquivos lock, `.env.example`, `LICENSE`: documentação, automação, reprodutibilidade e licenciamento.

### Candidatos a investigar (não remover automaticamente)

- `frontend/public/receitando-hero-personagem-v3.png` e `frontend/public/receitando-hero-personagem-final.png`: nomes sugerem versões, mas é preciso buscar referências no frontend, CSS e documentação e verificar visualmente antes de decidir.
- `frontend/public/home-vegetables-original.png` e `frontend/public/home-vegetables-background.jpg`: formatos distintos; confirmar referências e finalidade antes de remover.
- Diagramas na raiz: melhorar navegabilidade com índice no README, mantendo links existentes para evitar quebrar a entrega do professor.
- `backend/worker-prototype`: nome confuso, mas renomeação deve ser projeto separado, pois pode afetar caminhos em CI/CD, scripts e deploy.

### Já está bem configurado

`.gitignore` exclui `node_modules`, builds, caches, `.env`, arquivos de log, bancos locais e resultados comuns de testes. Acrescentar exclusão específica de `results/load/` para impedir commit acidental de artefatos k6.

### Validação técnica recomendada

1. Frontend: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
2. Backend: `npm ci`, `npm run typecheck`, `npm test`, `npm run dry-run`.
3. Conferir workflows GitHub Actions e resultados, sem confundir workflow verde com prova de escalabilidade.
4. Buscar referências antes de excluir qualquer asset ou documento; testar rotas principais e responsividade após alterações.
5. Verificar imports não utilizados, dependências e duplicações com ferramentas estáticas; revisar achados manualmente.

## Política de limpeza

**Primeira etapa:** documentação, exclusão de artefatos gerados e organização não destrutiva.

**Segunda etapa:** propor remoções específicas com evidências de não utilização, em PR próprio, após testes verdes.

**Nunca:** apagar migrations, diagramas acadêmicos ou código ativo apenas por nome aparentemente antigo.
