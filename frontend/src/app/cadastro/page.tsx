import type { Metadata } from "next";
import Link from "next/link";

import styles from "../entrar/page.module.css";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta no Receitando.",
};

export default function RegisterPage() {
  return (
    <div className={styles.page}>
      <div className={`container ${styles.shell}`}>
        <section className={styles.intro} aria-labelledby="register-title">
          <span className={styles.eyebrow}>COMECE PELA SUA DESPENSA</span>
          <h1 id="register-title">Uma conta para organizar o que já está em casa.</h1>
          <p>
            Crie sua conta para guardar receitas, montar sua despensa e receber
            sugestões cada vez mais úteis com os ingredientes que você já possui.
          </p>

          <div className={styles.note}>
            <span aria-hidden="true">✦</span>
            <p>Seu Receitando começa simples e fica mais útil conforme você usa.</p>
          </div>
        </section>

        <section className={styles.card} aria-label="Formulário de cadastro">
          <div className={styles.cardHeader}>
            <span>Primeiro acesso</span>
            <h2>Criar sua conta</h2>
            <p>Leva menos de um minuto.</p>
          </div>

          <form className={styles.form}>
            <label className={styles.field}>
              <span>Nome</span>
              <input autoComplete="name" name="name" placeholder="Seu nome" required type="text" />
            </label>

            <label className={styles.field}>
              <span>E-mail</span>
              <input autoComplete="email" inputMode="email" name="email" placeholder="voce@exemplo.com" required type="email" />
            </label>

            <label className={styles.field}>
              <span>Senha</span>
              <input autoComplete="new-password" minLength={10} name="password" placeholder="Pelo menos 10 caracteres" required type="password" />
            </label>

            <button className={styles.submit} type="submit">Criar conta</button>
          </form>

          <div className={styles.divider}><span>ou</span></div>

          <p className={styles.signup}>
            Já tem uma conta? <Link href="/entrar">Entrar</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
