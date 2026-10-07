import type { Metadata } from "next";

import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre na sua conta do Receitando.",
};

const waitingItems = [
  {
    icon: "fridge",
    title: "Sua despensa",
    description: "Os ingredientes e as validades que você salvou.",
  },
  {
    icon: "heart",
    title: "Seus favoritos",
    description: "As receitas que você guardou pra fazer depois.",
  },
  {
    icon: "cutlery",
    title: "Suas combinações",
    description: "O que dá pra fazer hoje, priorizando o que vence antes.",
  },
] as const;

function WaitingIcon({ type }: { type: (typeof waitingItems)[number]["icon"] }) {
  if (type === "heart") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
      </svg>
    );
  }

  if (type === "cutlery") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M6 3v7m3-7v7M6 7h3m8-4v18m0-11c2.5 0 4-1.6 4-3.7S19.5 3 17 3" />
        <path d="M7.5 10v11M17 10v11" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect height="18" rx="2" width="12" x="6" y="3" />
      <path d="M6 11h12M9 7h1M9 15h1" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.intro} aria-labelledby="login-title">
          <h1 id="login-title">
            Sua cozinha continua{" "}
            <span>do jeito que você deixou.</span>
          </h1>
          <p>
            Entre para voltar às suas receitas, à sua despensa e às ideias com o
            que você já tem em casa.
          </p>
        </section>

        <section className={styles.waitingCard} aria-labelledby="waiting-title">
          <h2 id="waiting-title">Te esperando lá dentro</h2>
          <ul>
            {waitingItems.map((item) => (
              <li key={item.title}>
                <span className={styles.waitingIcon}>
                  <WaitingIcon type={item.icon} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.formCard} aria-label="Formulário de entrada">
          <h2>Entrar na sua conta</h2>
          <p className={styles.formIntro}>Use seu e-mail e sua senha.</p>
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
