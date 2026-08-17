"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ApiError } from "@/services/api-client";
import { register } from "@/services/auth.service";

import styles from "../entrar/page.module.css";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");
    const remember = data.get("remember") === "on";

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await register(name, email, password, remember);
      router.push("/despensa");
      router.refresh();
    } catch (requestError: unknown) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError("Não foi possível criar sua conta agora. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>Nome</span>
        <input
          autoComplete="name"
          disabled={isSubmitting}
          maxLength={100}
          minLength={2}
          name="name"
          placeholder="Seu nome"
          required
          type="text"
        />
      </label>

      <label className={styles.field}>
        <span>E-mail</span>
        <input
          autoComplete="email"
          disabled={isSubmitting}
          inputMode="email"
          name="email"
          placeholder="voce@exemplo.com"
          required
          type="email"
        />
      </label>

      <label className={styles.field}>
        <span>Senha</span>
        <input
          autoComplete="new-password"
          disabled={isSubmitting}
          minLength={10}
          name="password"
          placeholder="Pelo menos 10 caracteres"
          required
          type="password"
        />
      </label>

      <label className={styles.field}>
        <span>Confirmar senha</span>
        <input
          autoComplete="new-password"
          disabled={isSubmitting}
          minLength={10}
          name="confirmPassword"
          placeholder="Repita sua senha"
          required
          type="password"
        />
      </label>

      <div className={styles.formMeta}>
        <label className={styles.remember}>
          <input defaultChecked disabled={isSubmitting} name="remember" type="checkbox" />
          <span>Continuar conectado</span>
        </label>
      </div>

      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}

      <button className={styles.submit} disabled={isSubmitting} type="submit">
        {isSubmitting ? "Criando conta…" : "Criar conta"}
      </button>
    </form>
  );
}
