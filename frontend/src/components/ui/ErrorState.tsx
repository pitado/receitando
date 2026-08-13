import { Button } from "@/components/ui/Button";

import styles from "./ErrorState.module.css";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({
  message = "Não foi possível buscar receitas agora. Tente novamente.",
  onRetry,
  title = "A cozinha ficou fora do ar",
}: ErrorStateProps) {
  return (
    <div className={styles.error} role="alert">
      <span aria-hidden="true" className={styles.icon}>
        !
      </span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      {onRetry ? <Button onClick={onRetry}>Tentar novamente</Button> : null}
    </div>
  );
}
