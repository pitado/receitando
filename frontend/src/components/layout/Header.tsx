import Link from "next/link";

import { AuthControls } from "./AuthControls";
import { HeaderNav } from "./HeaderNav";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link aria-label="Receitando — início" className={styles.brand} href="/">
          <span className={styles.brandWord}>Receitando</span>
          <span className={styles.brandTag}>cozinha possível</span>
        </Link>
        <HeaderNav />
        <AuthControls />
      </div>
    </header>
  );
}
