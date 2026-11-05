import type { ReactNode } from "react";
import { RecipeArtwork } from "@/components/art/RecipeArtwork";

import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  action?: ReactNode;
  description: string;
  icon?: ReactNode;
  title: string;
}

export function EmptyState({
  action,
  description,
  icon = <RecipeArtwork kind="heart" size={35} />,
  title,
}: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <span aria-hidden="true" className={styles.icon}>
        {icon}
      </span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
