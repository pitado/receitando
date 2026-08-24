import Link from "next/link";

import styles from "./not-found.module.css";

export default function NotFoundPage() {
  return (
    <section className={styles.page}>
      <div className={`container ${styles.layout}`}>
        <div className={styles.copy}>
          <span className={styles.code}>404</span>
          <p className={styles.eyebrow}>ESSA PÁGINA NÃO ESTÁ NO CADERNO</p>
          <h1>Essa receita se perdeu pela cozinha.</h1>
          <p className={styles.description}>
            O endereço pode ter mudado, ou talvez essa página nunca tenha saído
            do rascunho. Volte para o Receitando e continue procurando algo bom
            para fazer com o que você já tem em casa.
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
            <span className={styles.crumbOne} />
            <span className={styles.crumbTwo} />
            <span className={styles.crumbThree} />
          </div>
          <div className={styles.note}>
            <span>faltou um ingrediente:</span>
            <strong>a página.</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
