"use client";

import { useRef } from "react";

import type { RecipeCatalogSort, RecipeDifficulty } from "@/types/recipe";

import styles from "./RecipesCatalog.module.css";

type CatalogFiltersProps = {
  difficulty: RecipeDifficulty | "";
  maxPrepMinutes: string;
  mealType: string;
  query: string;
  sort: RecipeCatalogSort;
  source: string;
  onClear: () => void;
  onDifficultyChange: (value: RecipeDifficulty | "") => void;
  onMaxPrepMinutesChange: (value: string) => void;
  onMealTypeChange: (value: string) => void;
  onSortChange: (value: RecipeCatalogSort) => void;
  onSourceChange: (value: string) => void;
};

type FilterFieldsProps = CatalogFiltersProps & {
  activeFilterCount: number;
  defaultSort: RecipeCatalogSort;
  sortValue: RecipeCatalogSort;
};

function sourceLabel(value: string) {
  if (value === "community") return "Comunidade";
  if (value === "wikibooks") return "Wikilivros";
  return value;
}

const difficultyLabels: Record<RecipeDifficulty, string> = { FACIL: "Fácil", MEDIA: "Média", DIFICIL: "Difícil" };

function FilterFields({ difficulty, maxPrepMinutes, mealType, query, source, onClear, onDifficultyChange, onMaxPrepMinutesChange, onMealTypeChange, onSortChange, onSourceChange, activeFilterCount, defaultSort, sortValue }: FilterFieldsProps) {
  return (
    <div className={styles.filterGrid}>
      <label><span>Origem</span><select onChange={(event) => onSourceChange(event.target.value)} value={source}><option value="">Todas</option><option value="community">Comunidade</option><option value="wikibooks">Wikilivros</option></select></label>
      <label><span>Refeição</span><select onChange={(event) => onMealTypeChange(event.target.value)} value={mealType}><option value="">Todas</option><option value="Café da manhã">Café da manhã</option><option value="Almoço">Almoço</option><option value="Jantar">Jantar</option><option value="Lanche">Lanche</option><option value="Sobremesa">Sobremesa</option></select></label>
      <label><span>Dificuldade</span><select onChange={(event) => onDifficultyChange(event.target.value as RecipeDifficulty | "")} value={difficulty}><option value="">Todas</option><option value="FACIL">Fácil</option><option value="MEDIA">Média</option><option value="DIFICIL">Difícil</option></select></label>
      <label><span>Tempo máximo</span><select onChange={(event) => onMaxPrepMinutesChange(event.target.value)} value={maxPrepMinutes}><option value="">Qualquer tempo</option><option value="15">Até 15 min</option><option value="30">Até 30 min</option><option value="45">Até 45 min</option><option value="60">Até 1 hora</option><option value="90">Até 1h30</option></select></label>
      <label><span>Ordenar</span><select onChange={(event) => onSortChange(event.target.value as RecipeCatalogSort)} value={sortValue}>{query.trim() ? <option value="relevance">Mais relevantes</option> : null}<option value="recent">Mais recentes</option><option value="popular">Mais populares</option><option value="quick">Mais rápidas</option><option value="title">Nome A–Z</option></select></label>
      <button className={styles.clearFilters} disabled={!activeFilterCount && sortValue === defaultSort} onClick={onClear} type="button">Limpar filtros</button>
    </div>
  );
}

export function CatalogFilters(props: CatalogFiltersProps) {
  const { difficulty, maxPrepMinutes, mealType, query, sort, source, onClear, onDifficultyChange, onMaxPrepMinutesChange, onMealTypeChange, onSourceChange } = props;
  const sheetRef = useRef<HTMLDivElement>(null);
  const defaultSort: RecipeCatalogSort = query.trim() ? "relevance" : "recent";
  const activeFilterCount = [source, mealType, difficulty, maxPrepMinutes].filter(Boolean).length;
  const sortValue = query.trim() ? sort : sort === "relevance" ? "recent" : sort;
  const fieldProps: FilterFieldsProps = { ...props, activeFilterCount, defaultSort, sortValue };

  const chips = [
    source ? { key: "source", label: `Origem: ${sourceLabel(source)}`, remove: () => onSourceChange("") } : null,
    mealType ? { key: "mealType", label: mealType, remove: () => onMealTypeChange("") } : null,
    difficulty ? { key: "difficulty", label: difficultyLabels[difficulty], remove: () => onDifficultyChange("") } : null,
    maxPrepMinutes ? { key: "time", label: `Até ${maxPrepMinutes === "60" ? "1 hora" : maxPrepMinutes === "90" ? "1h30" : `${maxPrepMinutes} min`}`, remove: () => onMaxPrepMinutesChange("") } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; remove: () => void }>;

  return (
    <div className={styles.filterArea}>
      <details className={`${styles.filters} ${styles.desktopFilters}`} open>
        <summary><span>Filtrar receitas</span><span>{activeFilterCount ? `${activeFilterCount} ativo${activeFilterCount > 1 ? "s" : ""}` : "refine sua busca"}</span></summary>
        <FilterFields {...fieldProps} />
      </details>

      <button className={styles.mobileFiltersButton} onClick={() => sheetRef.current?.showPopover()} type="button">Filtros{activeFilterCount ? ` (${activeFilterCount})` : ""}</button>

      <div aria-label="Filtros de receitas" className={styles.filterSheet} popover="auto" ref={sheetRef}>
        <div className={styles.filterSheetHeader}>
          <div><strong>Filtros</strong><span>{activeFilterCount ? `${activeFilterCount} ativo${activeFilterCount > 1 ? "s" : ""}` : "Refine os resultados"}</span></div>
          <button aria-label="Fechar filtros" onClick={() => sheetRef.current?.hidePopover()} type="button">×</button>
        </div>
        <FilterFields {...fieldProps} />
        <button className={styles.applyFilters} onClick={() => sheetRef.current?.hidePopover()} type="button">Ver resultados</button>
      </div>

      {chips.length > 0 ? (
        <div aria-label="Filtros ativos" className={styles.activeFilters}>
          {chips.map((chip) => <button aria-label={`Remover filtro ${chip.label}`} key={chip.key} onClick={chip.remove} type="button"><span>{chip.label}</span><span aria-hidden="true">×</span></button>)}
          <button className={styles.clearFilterChips} onClick={onClear} type="button">Limpar</button>
        </div>
      ) : null}
    </div>
  );
}
