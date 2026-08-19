import Link from "next/link";

import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandBlock}>
          <Link className={styles.brand} href="/">
            Receitando
          </Link>
          <p className={styles.description}>
            Menos desperdício, mais comida boa com o que já mora na sua cozinha.
          </p>
        </div>

        <nav aria-label="Navegação do rodapé" className={styles.links}>
          <Link className={styles.link} href="/receitas">
            Receitas
          </Link>
          <Link className={styles.link} href="/despensa">
            Despensa
          </Link>
          <Link className={styles.link} href="/favoritos">
            Favoritos
          </Link>
        </nav>

        <p className={styles.copyright}>
          © {new Date().getFullYear()} Receitando. Um projeto acadêmico feito para cozinhas reais.
        </p>
      </div>
    </footer>
  );
}
