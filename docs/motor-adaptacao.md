# Epic — Motor de Adaptação de Receitas

## Objetivo

Transformar o Receitando de um catálogo de receitas em um sistema capaz de adaptar uma receita à realidade da cozinha do usuário.

O motor consegue:

- recalcular quantidades quando o rendimento muda;
- interpretar quantidades presentes no texto bruto dos ingredientes;
- identificar ingredientes que o usuário não possui;
- cruzar automaticamente a receita com a despensa;
- comparar quantidades em unidades compatíveis;
- detectar quando existe um ingrediente, mas a quantidade parece insuficiente;
- recomendar substituições culinárias conservadoras;
- inferir o contexto da receita e bloquear trocas inadequadas;
- informar o nível de confiança de cada troca;
- explicar por que uma substituição foi sugerida ou bloqueada;
- alertar quando uma alteração exige conferência manual.

A receita original nunca é modificada no banco. A adaptação é calculada sob demanda.

## Arquitetura

```text
Página da receita
      |
      v
RecipeAdapter (frontend)
      |
      | POST /api/recipes/:slug/adapt
      v
recipe-adaptation-worker
      |
      +--> D1: receita + ingredientes
      +--> D1: despensa do usuário (opcional)
      |
      +--> recipe-adaptation.ts
      |      + parser de quantidade
      |      + fator de escala
      |      + regras de substituição
      |      + confiança e avisos
      |
      +--> kitchen-units.ts
      |      + massa / volume / contagem
      |      + comparação de quantidade disponível
      |
      +--> recipe-context.ts
             + inferência de técnica e perfil
             + validação contextual das trocas
      |
      v
Receita adaptada + explicações + diagnóstico da despensa
```

O núcleo de domínio não depende do Cloudflare D1. Parser, escala, unidades e contexto podem ser testados sem banco, HTTP ou frontend.

## API

### `POST /api/recipes/:slug/adapt`

Exemplo de entrada:

```json
{
  "targetServings": 4,
  "unavailableIngredients": ["leite", "manteiga"],
  "usePantry": true
}
```

`targetServings` é opcional. Quando a receita não possui rendimento original confiável, o motor mantém as quantidades e ainda executa substituições.

`usePantry` exige sessão autenticada. Quando ativado, o motor cruza os ingredientes obrigatórios da receita com a despensa do usuário. Ingredientes básicos marcados como `is_staple` e ingredientes opcionais não são tratados automaticamente como ausentes.

A resposta contém:

- versão do motor;
- rendimento original e desejado;
- fator de escala;
- confiança global de 0 a 100;
- ingredientes adaptados;
- substituição recomendada e alternativas;
- motivo da substituição;
- alterações realizadas;
- contexto culinário identificado;
- resumo do cruzamento com a despensa;
- faltas parciais detectadas por quantidade;
- avisos que precisam de conferência humana.

## Regras da versão inicial

### Quantidades

O motor utiliza primeiro `quantity` e `unit` estruturados. Quando eles não existem, tenta interpretar `rawText`.

O parser reconhece números decimais, frações como `1/2`, números mistos como `1 1/2` e frações tipográficas como `½`, `¼` e `¾`.

### Escala

Quando o rendimento original é conhecido:

```text
fator = porções desejadas / porções originais
quantidade adaptada = quantidade original × fator
```

Ingredientes sensíveis como fermento, bicarbonato, sal, pimenta, ovos e gelatina geram aviso quando a escala muda muito.

### Substituições

As substituições são cadastradas explicitamente e possuem:

- ingrediente original;
- ingrediente substituto;
- proporção;
- confiança `HIGH`, `MEDIUM` ou `LOW`;
- justificativa culinária.

A primeira base possui regras conservadoras para ingredientes comuns como leite, manteiga, açúcar, farinha de trigo, creme de leite, tomate, cebola e ovo.

### Contexto culinário

Antes de aceitar a adaptação final, o motor analisa título, tipo da refeição, tags e modo de preparo. Ele reconhece sinais como:

- assado;
- frito;
- cozido;
- fresco/sem cocção;
- preparação dependente de aeração;
- receita centrada em ovos;
- perfil doce;
- perfil salgado.

Esses sinais não geram uma nova receita. Eles servem como camada de segurança para as substituições.

Exemplos:

- ovo de linhaça pode ser útil em algumas massas, mas é bloqueado quando o ovo é estrutural, como em omeletes;
- substituição de ovo também é bloqueada quando a receita depende de claras em neve/merengue;
- tomate pelado é bloqueado como substituto de tomate fresco em preparos crus e saladas.

### Despensa e unidades

Quando a despensa é utilizada, a presença do ingrediente é verificada pelo `ingredientId`, evitando depender apenas do texto.

Se quantidade e unidades existirem nos dois lados, o motor compara unidades da mesma dimensão. A primeira implementação cobre:

- massa: `g` e `kg`;
- volume: `ml`, `l`, xícara, colher de sopa e colher de chá;
- contagem: unidade e dente.

Exemplo:

```text
Receita precisa: 1 kg
Despensa possui: 1200 g
Resultado: quantidade suficiente
```

Outro exemplo:

```text
Receita precisa: 2 xícaras
Despensa possui: 300 ml
2 xícaras ≈ 480 ml
Resultado: faltam aproximadamente 180 ml
```

O motor deliberadamente **não converte massa em volume sem uma densidade conhecida**. Assim, `200 g` e `1 xícara` não são comparados automaticamente só para produzir uma resposta.

### Confiança

A confiança global é calculada a partir das decisões tomadas para cada ingrediente.

Trocas de alta confiança pesam mais positivamente. Ingredientes indisponíveis sem substituição conhecida reduzem a confiança. O contexto culinário também pode aplicar penalidade ou bloquear uma substituição.

## Histórias do Epic

### REC-201 — Parser estruturado de ingredientes

**Status:** implementado na versão inicial.

Interpretar quantidade e unidade a partir de ingredientes que ainda estão armazenados apenas como texto bruto.

### REC-202 — Recalcular rendimento e quantidades

**Status:** implementado na versão inicial.

Permitir que uma receita com rendimento conhecido seja recalculada para outra quantidade de porções.

### REC-203 — Grafo/regras de substituição

**Status:** base implementada.

Criar uma camada central para substituições, proporções, alternativas e justificativas. O conjunto de regras continuará crescendo conforme os dados das receitas forem melhorados.

### REC-204 — Confiança e explicabilidade

**Status:** implementado na versão inicial.

Toda troca informa confiança e motivo. A receita adaptada também recebe uma confiança global e avisos de segurança.

### REC-205 — Interface de adaptação

**Status:** implementado na versão inicial.

Na página da receita, permitir selecionar rendimento, marcar ingredientes ausentes, usar a despensa e visualizar resultado, contexto e confiança.

### REC-206 — Usar automaticamente a despensa

**Status:** implementado na versão inicial.

Cruzar ingredientes pelo identificador normalizado, detectar ausências e verificar falta parcial quando as quantidades podem ser comparadas com segurança.

### REC-207 — Substituição consciente do contexto culinário

**Status:** primeira camada implementada.

Considerar tipo da receita, técnica e função provável do ingrediente para reduzir recomendações incorretas. A heurística atual bloqueia casos claramente ruins e deixa espaço para uma taxonomia culinária mais profunda.

### REC-208 — Conversões culinárias avançadas

**Status:** primeira camada implementada.

Converter e comparar unidades compatíveis de massa, volume e contagem. Conversões entre massa e volume continuam bloqueadas até existir uma tabela de densidades por ingrediente.

### REC-209 — Dados de rendimento confiáveis

**Status:** depende da melhoria do catálogo.

Extrair e estruturar o rendimento das receitas importadas para aumentar a cobertura do redimensionamento automático.

### REC-210 — Testes de domínio culinário

**Status:** implementado e em evolução contínua.

Os testes cobrem parser, escala, substituições, ausência de substituição, receitas sem rendimento, equivalência de unidades, falta parcial e bloqueios contextuais.

## Limites atuais

O motor é intencionalmente conservador. Ele não tenta afirmar que qualquer ingrediente pode substituir qualquer outro.

Ainda ficam para evoluções posteriores:

- ajuste automático de temperatura e tempo de forno;
- interpretação semântica completa de cada etapa do modo de preparo;
- tabela de densidade por ingrediente para conversão segura entre massa e volume;
- restrições alimentares completas e alergênicos;
- cálculo nutricional;
- otimização de cardápio semanal;
- geração de novas receitas.

Essas funções devem evoluir sobre o motor, e não substituir sua arquitetura atual.
