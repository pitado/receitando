"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";

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
      <label className={styles.label} htmlFor={inputId}>
        Adicione um ingrediente
      </label>
      <div className={styles.controls}>
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          className={styles.input}
          disabled={disabled}
          id={inputId}
          name="ingredient"
          onChange={(event) => {
            setValue(event.target.value);
            onValueChange?.();
          }}
          placeholder="Ex.: ovo, banana ou farinha"
          type="text"
          value={value}
        />
        <Button disabled={disabled} type="submit" variant="secondary">
          Adicionar
        </Button>
      </div>
      {error ? (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
