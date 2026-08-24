import Link from "next/link";

import styles from "./not-found.module.css";

export default function NotFoundPage() {
  return (
    <section className={styles.page}>
      <div className={`container ${styles.layout}`}>
        <span aria-hidden="true" className={styles.code}>404</span>
        <p className={styles.eyebrow}>FORA DO CARDÁPIO</p>
        <h1>Essa página não entrou no menu.</h1>
        <p className={styles.description}>
          Mas ainda dá para voltar e encontrar alguma coisa boa por aqui.
        </p>

        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="/">
            Voltar para o início <span aria-hidden="true">→</span>
          </Link>
          <Link className={styles.secondaryAction} href="/receitas">
            Ver receitas
          </Link>
        </div>
      </div>
    </section>
  );
}
