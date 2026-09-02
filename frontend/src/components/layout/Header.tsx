import { AuthControls } from "./AuthControls";
import { HeaderNav } from "./HeaderNav";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <HeaderNav />
        <AuthControls />
      </div>
    </header>
  );
}
