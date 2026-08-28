# Epic — Motor de Adaptação de Receitas

## Objetivo

Transformar o Receitando de um catálogo de receitas em um sistema capaz de adaptar uma receita à realidade da cozinha do usuário.

O motor deve conseguir:

- recalcular quantidades quando o rendimento muda;
- interpretar quantidades presentes no texto bruto dos ingredientes;
- identificar ingredientes que o usuário não possui;
- recomendar substituições culinárias conservadoras;
- informar o nível de confiança de cada troca;
- explicar por que uma substituição foi sugerida;
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
      |
      v
lib/recipe-adaptation.ts
      |
      +--> parser de quantidade
      +--> fator de escala
      +--> regras de substituição
      +--> confiança e avisos
      |
      v
Receita adaptada + explicações
```

O núcleo do motor é uma função pura e não depende do Cloudflare D1. Isso permite testar as regras culinárias sem banco, HTTP ou frontend.

## API

### `POST /api/recipes/:slug/adapt`

Exemplo de entrada:

```json
{
  "targetServings": 4,
  "unavailableIngredients": ["leite", "manteiga"]
}
```

`targetServings` é opcional. Quando a receita não possui rendimento original confiável, o motor mantém as quantidades e ainda executa as substituições.

A resposta contém:

- versão do motor;
- rendimento original e desejado;
- fator de escala;
- confiança global de 0 a 100;
- ingredientes adaptados;
- substituição recomendada e alternativas;
- motivo da substituição;
- alterações realizadas;
- avisos que precisam de conferência humana.

## Regras da versão 1.0

### Quantidades

O motor utiliza primeiro `quantity` e `unit` estruturados. Quando eles não existem, tenta interpretar `rawText`.

A versão 1 reconhece números decimais, frações como `1/2`, números mistos como `1 1/2` e frações tipográficas como `½`, `¼` e `¾`.

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

A primeira versão possui regras conservadoras para ingredientes comuns como leite, manteiga, açúcar, farinha de trigo, creme de leite, tomate, cebola e ovo.

### Confiança

A confiança global é calculada a partir das decisões tomadas para cada ingrediente.

Trocas de alta confiança pesam mais positivamente. Ingredientes marcados como indisponíveis sem uma substituição conhecida reduzem a confiança e ficam explicitamente sinalizados.

## Histórias do Epic

### REC-201 — Parser estruturado de ingredientes

**Status:** versão inicial implementada.

Interpretar quantidade e unidade a partir de ingredientes que ainda estão armazenados apenas como texto bruto.

### REC-202 — Recalcular rendimento e quantidades

**Status:** versão inicial implementada.

Permitir que uma receita com rendimento conhecido seja recalculada para outra quantidade de porções.

### REC-203 — Grafo/regras de substituição

**Status:** base implementada.

Criar uma camada central para substituições, proporções, alternativas e justificativas.

### REC-204 — Confiança e explicabilidade

**Status:** versão inicial implementada.

Toda troca deve informar confiança e motivo. A receita adaptada também recebe uma confiança global.

### REC-205 — Interface de adaptação

**Status:** versão inicial implementada.

Na página da receita, permitir selecionar rendimento e marcar os ingredientes que estão faltando.

### REC-206 — Usar automaticamente a despensa

**Status:** próxima evolução.

Cruzar os ingredientes da receita com a despensa do usuário para detectar automaticamente o que existe e o que falta.

### REC-207 — Substituição consciente do contexto culinário

**Status:** backlog.

A mesma substituição pode funcionar em um bolo e falhar em um merengue. O motor deverá considerar tipo da receita, técnica e função do ingrediente antes de recomendar uma troca.

### REC-208 — Conversões culinárias avançadas

**Status:** backlog.

Adicionar conversões entre unidades compatíveis e tabelas específicas para ingredientes quando for necessário converter volume e massa.

### REC-209 — Dados de rendimento confiáveis

**Status:** depende da melhoria do catálogo.

Extrair e estruturar o rendimento das receitas importadas para aumentar a cobertura do redimensionamento automático.

### REC-210 — Testes de domínio culinário

**Status:** iniciado.

Manter cenários automatizados para parser, escala, substituições, ausência de substituição e receitas sem rendimento informado.

## Limites atuais

A versão 1 é intencionalmente conservadora. Ela não tenta afirmar que qualquer ingrediente pode substituir qualquer outro.

Ainda não entram nesta versão:

- ajuste automático de temperatura e tempo de forno;
- substituição baseada no modo de preparo;
- restrições alimentares completas;
- cálculo nutricional;
- otimização de cardápio semanal;
- geração de novas receitas.

Essas funções devem evoluir sobre o motor, e não substituir sua arquitetura atual.
