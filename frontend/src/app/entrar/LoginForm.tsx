"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ApiError } from "@/services/api-client";
import { login } from "@/services/auth.service";

import styles from "./page.module.css";

function destinationAfterLogin(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/despensa";
  }
  return next;
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const remember = data.get("remember") === "on";

    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password, remember);
      router.replace(destinationAfterLogin());
      router.refresh();
    } catch (requestError: unknown) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError("Não foi possível entrar agora. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>E-mail</span>
        <input
          autoCapitalize="none"
          autoComplete="email"
          disabled={isSubmitting}
          enterKeyHint="next"
          inputMode="email"
          name="email"
          placeholder="voce@exemplo.com"
          required
          spellCheck={false}
          type="email"
        />
      </label>

      <label className={styles.field}>
        <span>Senha</span>
        <input
          autoComplete="current-password"
          disabled={isSubmitting}
          enterKeyHint="go"
          minLength={10}
          name="password"
          placeholder="Sua senha"
          required
          type="password"
        />
      </label>

      <div className={styles.formMeta}>
        <label className={styles.remember}>
          <input disabled={isSubmitting} name="remember" type="checkbox" />
          <span>Lembrar de mim</span>
        </label>
        <Link className={styles.comingSoon} href="/recuperar-senha">
          Esqueci minha senha
        </Link>
      </div>

      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}

      <button className={styles.submit} disabled={isSubmitting} type="submit">
        {isSubmitting ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
