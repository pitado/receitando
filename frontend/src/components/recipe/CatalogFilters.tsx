"use client";

import { useRef } from "react";

import type { RecipeCatalogSort, RecipeDifficulty } from "@/types/recipe";

import styles from "./RecipesCatalog.module.css";

type CatalogFiltersProps = {
  difficulty: RecipeDifficulty | "";
  maxPrepMinutes: string;
  mealType: string;
  query: string;
  resultCount: number;
  sort: RecipeCatalogSort;
  source: string;
  onClear: () => void;
  onDifficultyChange: (value: RecipeDifficulty | "") => void;
  onMaxPrepMinutesChange: (value: string) => void;
  onMealTypeChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onSortChange: (value: RecipeCatalogSort) => void;
  onSourceChange: (value: string) => void;
};

type SelectFieldsProps = {
  difficulty: RecipeDifficulty | "";
  maxPrepMinutes: string;
  query: string;
  sort: RecipeCatalogSort;
  source: string;
  onDifficultyChange: (value: RecipeDifficulty | "") => void;
  onMaxPrepMinutesChange: (value: string) => void;
  onSortChange: (value: RecipeCatalogSort) => void;
  onSourceChange: (value: string) => void;
};

const difficultyLabels: Record<RecipeDifficulty, string> = {
  FACIL: "Fácil",
  MEDIA: "Média",
  DIFICIL: "Difícil",
};

function sourceLabel(value: string) {
  if (value === "community") return "Comunidade";
  if (value === "wikibooks") return "Wikilivros";
  return value;
}

function SelectFields({
  difficulty,
  maxPrepMinutes,
  query,
  sort,
  source,
  onDifficultyChange,
  onMaxPrepMinutesChange,
  onSortChange,
  onSourceChange,
}: SelectFieldsProps) {
  const effectiveSort =
    query.trim() || sort !== "relevance" ? sort : "recent";

  return (
    <div className={styles.selectFields}>
      <label>
        <span className={styles.srOnly}>Origem</span>
        <select
          className={source ? styles.selectActive : undefined}
          onChange={(event) => onSourceChange(event.target.value)}
          value={source}
        >
          <option value="">Qualquer origem</option>
          <option value="community">Comunidade</option>
          <option value="wikibooks">Wikilivros</option>
        </select>
      </label>

      <label>
        <span className={styles.srOnly}>Dificuldade</span>
        <select
          className={difficulty ? styles.selectActive : undefined}
          onChange={(event) =>
            onDifficultyChange(event.target.value as RecipeDifficulty | "")
          }
          value={difficulty}
        >
          <option value="">Qualquer dificuldade</option>
          <option value="FACIL">Fácil</option>
          <option value="MEDIA">Média</option>
          <option value="DIFICIL">Difícil</option>
        </select>
      </label>

      <label>
        <span className={styles.srOnly}>Tempo máximo</span>
        <select
          className={maxPrepMinutes ? styles.selectActive : undefined}
          onChange={(event) => onMaxPrepMinutesChange(event.target.value)}
          value={maxPrepMinutes}
        >
          <option value="">Qualquer tempo</option>
          <option value="15">Até 15 min</option>
          <option value="30">Até 30 min</option>
          <option value="45">Até 45 min</option>
          <option value="60">Até 1 hora</option>
          <option value="90">Até 1h30</option>
        </select>
      </label>

      <div className={styles.sortField}>
        <span>Ordenar por</span>
        <label>
          <span className={styles.srOnly}>Ordenar receitas</span>
          <select
            onChange={(event) =>
              onSortChange(event.target.value as RecipeCatalogSort)
            }
            value={effectiveSort}
          >
            {query.trim() ? <option value="relevance">Mais relevantes</option> : null}
            <option value="recent">Mais recentes</option>
            <option value="popular">Mais populares</option>
            <option value="quick">Mais rápidas</option>
            <option value="title">Nome A–Z</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export function CatalogFilters({
  difficulty,
  maxPrepMinutes,
  mealType,
  query,
  resultCount,
  sort,
  source,
  onClear,
  onDifficultyChange,
  onMaxPrepMinutesChange,
  onMealTypeChange,
  onQueryChange,
  onSortChange,
  onSourceChange,
}: CatalogFiltersProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const activeSelectCount = [source, difficulty, maxPrepMinutes].filter(Boolean).length;
  const hasAnyFilter = Boolean(
    query.trim() || mealType || source || difficulty || maxPrepMinutes,
  );

  const chips = [
    query.trim()
      ? {
          key: "query",
          label: `“${query.trim()}”`,
          remove: () => onQueryChange(""),
        }
      : null,
    mealType
      ? {
          key: "mealType",
          label: mealType,
          remove: () => onMealTypeChange(""),
        }
      : null,
    source
      ? {
          key: "source",
          label: sourceLabel(source),
          remove: () => onSourceChange(""),
        }
      : null,
    difficulty
      ? {
          key: "difficulty",
          label: difficultyLabels[difficulty],
          remove: () => onDifficultyChange(""),
        }
      : null,
    maxPrepMinutes
      ? {
          key: "time",
          label: `Até ${
            maxPrepMinutes === "60"
              ? "1 hora"
              : maxPrepMinutes === "90"
                ? "1h30"
                : `${maxPrepMinutes} min`
          }`,
          remove: () => onMaxPrepMinutesChange(""),
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; remove: () => void }>;

  const fieldProps: SelectFieldsProps = {
    difficulty,
    maxPrepMinutes,
    query,
    sort,
    source,
    onDifficultyChange,
    onMaxPrepMinutesChange,
    onSortChange,
    onSourceChange,
  };

  return (
    <div className={styles.filterArea}>
      <div className={styles.desktopFilterBar}>
        <SelectFields {...fieldProps} />
      </div>

      <button
        className={styles.mobileFiltersButton}
        onClick={() => sheetRef.current?.showPopover()}
        type="button"
      >
        Filtros{activeSelectCount ? ` (${activeSelectCount})` : ""}
      </button>

      <div
        aria-label="Filtros de receitas"
        className={styles.filterSheet}
        popover="auto"
        ref={sheetRef}
      >
        <div className={styles.filterSheetHeader}>
          <div>
            <strong>Filtros</strong>
            <span>
              {activeSelectCount
                ? `${activeSelectCount} ativo${activeSelectCount > 1 ? "s" : ""}`
                : "Refine os resultados"}
            </span>
          </div>
          <button
            aria-label="Fechar filtros"
            onClick={() => sheetRef.current?.hidePopover()}
            type="button"
          >
            ×
          </button>
        </div>

        <SelectFields {...fieldProps} />

        <button
          className={styles.applyFilters}
          onClick={() => sheetRef.current?.hidePopover()}
          type="button"
        >
          Ver resultados
        </button>
      </div>

      <div className={styles.filterSummary}>
        <div className={styles.filterSummaryLeft}>
          <strong aria-live="polite">
            {resultCount} {resultCount === 1 ? "receita" : "receitas"}
          </strong>

          {chips.map((chip) => (
            <button
              aria-label={`Remover filtro ${chip.label}`}
              className={styles.filterChip}
              key={chip.key}
              onClick={chip.remove}
              type="button"
            >
              <span>{chip.label}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>

        {hasAnyFilter ? (
          <button className={styles.clearFiltersLink} onClick={onClear} type="button">
            Limpar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}
