# Receitando — Fase 5: roteiro de integração (#1332)

> Documento de coordenação elaborado com assistência do ChatGPT. Não é código escrito pelos integrantes e não serve como prova de autoria individual.

## Critérios informados pelo professor
- Mockups das telas principais.
- Código de uma funcionalidade central com **CRUD completo** integrado a frontend, backend e banco de dados.
- Branches padronizadas, microcommits e merge com `--no-ff`.
- Demonstração funcionando e revisão de código.
- Exigência adicional comunicada pelo grupo: contribuições/commits **reais de todos os integrantes**.
- Geradores de código não são permitidos para a implementação entregue.

## Estado atual do projeto
A despensa já está implementada no Receitando. Preservar a `main` publicada e dados existentes; realizar alterações em branches e integrar com PRs após validações.

Rotas existentes:
- `GET /api/pantry` — listar itens
- `POST /api/pantry` — cadastrar ou atualizar ingrediente existente
- `DELETE /api/pantry/:id` — excluir um item

Arquivos de referência:
- `backend/worker-prototype/src/pantry-worker.ts`
- `frontend/src/services/pantry.service.ts`
- `frontend/src/app/despensa/PantryClient.tsx`
- `backend/worker-prototype/tests/worker-routes.test.cjs`

## Tarefas e branches organizadas

| Responsável | Entrega | Branch | Issue |
|---|---|---|---|
| João Matheus | CREATE + validações de cadastro | `feat/1332-despensa-create-joao` | [#193](https://github.com/pitado/receitando/issues/193) |
| Lucas | Testes de CREATE/READ/UPDATE/DELETE | `test/1332-despensa-lucas` | [#194](https://github.com/pitado/receitando/issues/194) |
| Miguel | Integração, revisão e evidências | `integration/1332-despensa-miguel` | [#195](https://github.com/pitado/receitando/issues/195) |

As tarefas de READ, UPDATE e DELETE devem ser executadas pelos demais integrantes que o grupo designar. Esses commits precisam ser feitos após contribuições efetivas.

## Checklist técnico
- [ ] POST cadastra ingrediente válido e persiste no banco.
- [ ] GET retorna exclusivamente os dados da conta autenticada.
- [ ] UPDATE permite editar quantidade, unidade e validade, com persistência após recarregar.
- [ ] DELETE remove o ingrediente correto sem afetar outras contas.
- [ ] Os erros HTTP e as validações são consistentes entre frontend e backend.
- [ ] Cada participante consegue explicar seu código e seus próprios commits.
- [ ] PRs revisados, microcommits preservados e merge commit visível.

## Validações (registrar resultados reais)

**Backend** — usar PostgreSQL temporário e isolado para os testes de integração:

```sh
cd backend/worker-prototype
npm ci
npm run typecheck
npm test
npm run test:postgres
```

**Frontend:**

```sh
cd frontend
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

Não rodar testes destrutivos contra banco de produção.

## Capturas de tela reais para apresentação
1. Home com logo e receita visível.
2. Catálogo de receitas.
3. Detalhe de uma receita com foto carregada.
4. Despensa autenticada e listagem de ingredientes.
5. Cadastro (CREATE) em ação.
6. Alteração (UPDATE) em ação.
7. Exclusão (DELETE) em ação.

Registrar capturas do sistema real, sem divulgar dados pessoais ou credenciais.

## Integração com histórico verificável
1. Integrante desenvolve e testa na própria branch.
2. Faz microcommits correspondentes a alterações de verdade.
3. Abre PR para a branch de integração, com descrição e evidências.
4. Revisar o código, executar testes e resolver conflitos.
5. Quando o CRUD estiver completo, abrir PR final para `main`.
6. Fazer merge commit (`--no-ff`), mantendo o histórico dos autores.
