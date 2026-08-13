import styles from "./IngredientChip.module.css";

interface IngredientChipProps {
  disabled?: boolean;
  name: string;
  onRemove: () => void;
}

export function IngredientChip({
  disabled = false,
  name,
  onRemove,
}: IngredientChipProps) {
  return (
    <span className={styles.chip}>
      <span>{name}</span>
      <button
        aria-label={`Remover ${name}`}
        className={styles.remove}
        disabled={disabled}
        onClick={onRemove}
        type="button"
      >
        <span aria-hidden="true">×</span>
      </button>
    </span>
  );
}
