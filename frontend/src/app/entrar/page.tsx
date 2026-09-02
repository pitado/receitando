import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre na sua conta do Receitando.",
};

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={`container ${styles.shell}`}>
        <section className={styles.intro} aria-labelledby="login-title">
          <span className={styles.eyebrow}>Sua cozinha, do seu jeito</span>
          <h1 id="login-title">Continue de onde parou.</h1>
          <p>
            Salve receitas, organize sua despensa e encontre ideias que fazem
            sentido com o que você já tem em casa.
          </p>

          <div className={styles.note}>
            <span aria-hidden="true">✦</span>
            <p>Menos desperdício. Mais possibilidades para a sua cozinha.</p>
          </div>
        </section>

        <section className={styles.card} aria-label="Formulário de entrada">
          <div className={styles.cardHeader}>
            <span>Bem-vindo de volta</span>
            <h2>Entrar na sua conta</h2>
            <p>Use seu e-mail e sua senha para acessar o Receitando.</p>
          </div>

          <LoginForm />

          <div className={styles.divider}>
            <span>ou</span>
          </div>

          <p className={styles.signup}>
            Ainda não tem uma conta? <Link href="/cadastro">Criar conta</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
