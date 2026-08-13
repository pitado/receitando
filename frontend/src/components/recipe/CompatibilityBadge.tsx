import styles from "./CompatibilityBadge.module.css";

interface CompatibilityBadgeProps {
  value: number;
}

export function CompatibilityBadge({ value }: CompatibilityBadgeProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <span
      aria-label={`${safeValue}% compatível`}
      className={`${styles.badge} ${safeValue === 100 ? styles.complete : ""}`}
    >
      <span className={styles.score}>{safeValue}%</span>
      compatível
    </span>
  );
}
