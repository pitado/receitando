import styles from "./LoadingState.module.css";

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({
  label = "Carregando receitas…",
}: LoadingStateProps) {
  return (
    <div aria-live="polite" className={styles.loading} role="status">
      <span aria-hidden="true" className={styles.spinner} />
      <span>{label}</span>
    </div>
  );
}
