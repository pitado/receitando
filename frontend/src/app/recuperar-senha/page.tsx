import type { Metadata } from "next";
import Link from "next/link";

import { RecoveryForm } from "./RecoveryForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Receba um código por e-mail para redefinir sua senha do Receitando.",
};

export default function RecoverPasswordPage() {
  return (
    <div className={styles.page}>
      <div className={`container ${styles.shell}`}>
        <section className={styles.intro} aria-labelledby="recover-title">
          <span className={styles.eyebrow}>RECUPERAÇÃO SEGURA</span>
          <h1 id="recover-title">Volte para sua cozinha em poucos passos.</h1>
          <p>
            Nós enviamos um código de 6 dígitos para o seu e-mail. Ele vale por
            10 minutos e serve apenas para criar uma nova senha.
          </p>

          <div className={styles.note}>
            <span aria-hidden="true">✦</span>
            <p>O Receitando nunca envia sua senha atual por e-mail.</p>
          </div>
        </section>

        <section className={styles.card} aria-label="Recuperação de senha">
          <RecoveryForm />
          <p className={styles.backLink}>
            Lembrou da senha? <Link href="/entrar">Voltar para entrar</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
