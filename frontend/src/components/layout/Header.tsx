import { AuthControls } from "./AuthControls";
import { HeaderNav } from "./HeaderNav";
import { InteractiveBrand } from "./InteractiveBrand";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandSlot}>
          <InteractiveBrand />
        </div>

        <HeaderNav />

        <AuthControls />
      </div>
    </header>
  );
}
