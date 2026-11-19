# Receitando — Fase 5

## Funcionalidade escolhida
Despensa de ingredientes: cadastro, listagem, edição e exclusão.

## Organização
| Pessoa | Atividade | Branch |
| --- | --- | --- |
| João | Cadastro de ingredientes | `feat/1332-despensa-create-joao` |
| José | Listagem de ingredientes | `feat/1332-despensa-read-jose` |
| Thiago | Edição de ingredientes | `feat/1332-despensa-update-thiago` |
| Gustavo | Exclusão de ingredientes | `feat/1332-despensa-delete-gustavo` |
| Lucas | Testes | `test/1332-despensa-lucas` |
| Miguel | Integração e apresentação | `integration/1332-despensa-miguel` |

## Pontos importantes
- Conferir a integração entre a tela, a API e o banco.
- Testar cadastro, listagem, edição e exclusão de um ingrediente.
- Verificar que cada usuário acessa apenas os próprios itens.
- Revisar os PRs, resolver conflitos e executar os testes antes do merge.

## Testes
Backend:
```bash
cd backend/worker-prototype
npm ci
npm run typecheck
npm test
```

Frontend:
```bash
cd frontend
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

## Telas da apresentação
1. Página inicial.
2. Catálogo de receitas.
3. Despensa.
4. Combinar ingredientes.

As imagens dessas quatro telas foram escolhidas para a apresentação.

## Entrega
Integrar os PRs na branch de integração, conferir o funcionamento e abrir o PR final para a `main` com merge commit.
