"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import styles from "./Header.module.css";

export function HeaderNav() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const search = query.trim();

    if (!search) {
      router.push("/receitas");
      return;
    }

    const params = new URLSearchParams({ q: search });
    router.push(`/receitas?${params.toString()}`);
  }

  return (
    <form
      aria-label="Pesquisar receitas"
      className={styles.headerSearch}
      onSubmit={submitSearch}
      role="search"
    >
      <span aria-hidden="true" className={styles.headerSearchIcon}>
        <svg viewBox="0 0 24 24">
          <path d="m21 21-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
        </svg>
      </span>

      <label className="sr-only" htmlFor="header-recipe-search">
        Pesquisar receitas
      </label>
      <input
        autoComplete="off"
        id="header-recipe-search"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Pesquisar receitas"
        type="search"
        value={query}
      />

      {query ? (
        <button
          aria-label="Limpar pesquisa"
          className={styles.headerSearchClear}
          onClick={() => setQuery("")}
          type="button"
        >
          ×
        </button>
      ) : null}

      <button className="sr-only" type="submit">
        Pesquisar no catálogo
      </button>
    </form>
  );
}
