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
          <span className={styles.eyebrow}>SUA COZINHA, DO SEU JEITO</span>
          <h1 id="login-title">Entre e continue de onde parou.</h1>
          <p>
            Salve suas receitas favoritas, organize sua despensa e deixe o
            Receitando entender melhor o que você tem em casa.
          </p>

          <div className={styles.note}>
            <span aria-hidden="true">✦</span>
            <p>Menos desperdício. Mais ideias para o que já está na cozinha.</p>
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
