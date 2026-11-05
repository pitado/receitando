"use client";

import { useId, useState } from "react";

import styles from "./IngredientInput.module.css";

interface IngredientInputProps {
  disabled?: boolean;
  error?: string | null;
  onAdd: (value: string) => boolean;
  onValueChange?: () => void;
}

export function IngredientInput({
  disabled = false,
  error,
  onAdd,
  onValueChange,
}: IngredientInputProps) {
  const [value, setValue] = useState("");
  const inputId = useId();
  const errorId = `${inputId}-error`;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (onAdd(value)) {
      setValue("");
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.srOnly} htmlFor={inputId}>
        Adicionar ingrediente
      </label>
      <div className={styles.controls}>
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          className={styles.input}
          disabled={disabled}
          id={inputId}
          maxLength={100}
          name="ingredient"
          onChange={(event) => {
            setValue(event.target.value);
            onValueChange?.();
          }}
          placeholder="Ex.: ovo, banana..."
          type="text"
          value={value}
        />
        <button className={styles.button} disabled={disabled} type="submit">
          Adicionar
        </button>
      </div>
      <p aria-live="polite" className={styles.error} id={errorId}>
        {error ?? ""}
      </p>
    </form>
  );
}
