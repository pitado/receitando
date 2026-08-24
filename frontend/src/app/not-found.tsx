import Image from "next/image";
import Link from "next/link";

import styles from "./not-found.module.css";

export default function NotFoundPage() {
  return (
    <section className={styles.page}>
      <div className={`container ${styles.layout}`}>
        <div className={styles.copy}>
          <span className={styles.code}>404</span>
          <p className={styles.eyebrow}>RECEITA FORA DO FORNO</p>
          <h1>Ops... essa página saiu da receita.</h1>
          <p className={styles.description}>
            Mas calma: ainda dá para voltar pro começo e encontrar algo bom com o que já tem em casa.
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
          <Image
            alt=""
            className={styles.plateArt}
            height={780}
            priority
            src="/receitando-404-plate.webp"
            width={780}
          />
        </div>
      </div>
    </section>
  );
}
