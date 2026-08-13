import type { ElementType, ReactNode } from "react";

import styles from "./SectionTitle.module.css";

interface SectionTitleProps {
  align?: "left" | "center";
  as?: ElementType;
  children: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
}

export function SectionTitle({
  align = "left",
  as: Heading = "h2",
  children,
  description,
  eyebrow,
}: SectionTitleProps) {
  return (
    <div
      className={`${styles.sectionTitle} ${
        align === "center" ? styles.centered : ""
      }`}
    >
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <Heading className={styles.title}>{children}</Heading>
      {description ? (
        <p className={styles.description}>{description}</p>
      ) : null}
    </div>
  );
}
