import Link from "next/link";

import styles from "./not-found.module.css";

export default function NotFoundPage() {
  return (
    <section className={styles.page}>
      <div className={`container ${styles.layout}`}>
        <div className={styles.copy}>
          <span className={styles.code}>404</span>
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

        <div aria-hidden="true" className={styles.visual}>
          <div className={styles.plate}>
            <span className={`${styles.crumb} ${styles.crumbOne}`} />
            <span className={`${styles.crumb} ${styles.crumbTwo}`} />
            <span className={`${styles.crumb} ${styles.crumbThree}`} />
            <span className={`${styles.crumb} ${styles.crumbFour}`} />

            <div className={styles.note}>
              <span>404</span>
              <strong>pedido não encontrado</strong>
            </div>
          </div>

          <div className={styles.fork}>
            <span className={styles.forkHead}>
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className={styles.forkHandle} />
          </div>

          <span className={styles.leaf} />
          <span className={styles.sparkle} />
        </div>
      </div>
    </section>
  );
}
