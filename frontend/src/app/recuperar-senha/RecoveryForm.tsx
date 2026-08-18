"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { ApiError } from "@/services/api-client";
import {
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetCode,
} from "@/services/auth.service";

import styles from "./page.module.css";

type Step = "email" | "code" | "password" | "done";

export function RecoveryForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetId, setResetId] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset(email.trim());
      setResetId(result.resetId);
      setMessage("");
      setStep("code");
    } catch (requestError: unknown) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Não foi possível enviar o código agora. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const code = String(data.get("code") ?? "").trim();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await verifyPasswordResetCode(resetId, code);
      setResetToken(result.resetToken);
      setMessage("");
      setStep("password");
    } catch (requestError: unknown) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Não foi possível validar o código agora.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("confirmation") ?? "");

    setError("");
    if (password !== confirmation) {
      setError("As duas senhas precisam ser iguais.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetPassword(resetId, resetToken, password);
      setMessage(result.message);
      setStep("done");
    } catch (requestError: unknown) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Não foi possível alterar sua senha agora.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendCode() {
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setResetId(result.resetId);
      setMessage("Código reenviado. Confira sua caixa de entrada e também a pasta de spam.");
    } catch (requestError: unknown) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Não foi possível reenviar o código agora.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "done") {
    return (
      <div className={styles.successState}>
        <span aria-hidden="true">✓</span>
        <div>
          <p className={styles.stepLabel}>Tudo certo</p>
          <h2>Senha alterada.</h2>
          <p>{message}</p>
        </div>
        <Link className={styles.submitLink} href="/entrar">
          Entrar com a nova senha
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className={styles.cardHeader}>
        <span>Passo {step === "email" ? "1" : step === "code" ? "2" : "3"} de 3</span>
        <h2>
          {step === "email"
            ? "Qual é o seu e-mail?"
            : step === "code"
              ? "Digite o código"
              : "Crie uma nova senha"}
        </h2>
        <p>
          {step === "email"
            ? "Digite o e-mail cadastrado na sua conta. Se encontrarmos sua conta, enviaremos o código na hora."
            : step === "code"
              ? `Código enviado para ${email}.`
              : "Use pelo menos 10 caracteres e escolha uma senha que você não reutilize em outros sites."}
        </p>
      </div>

      {step === "email" ? (
        <form className={styles.form} onSubmit={submitEmail}>
          <label className={styles.field}>
            <span>E-mail</span>
            <input
              autoComplete="email"
              disabled={isSubmitting}
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@exemplo.com"
              required
              type="email"
              value={email}
            />
          </label>
          {error ? <p className={styles.formError}>{error}</p> : null}
          <button className={styles.submit} disabled={isSubmitting} type="submit">
            {isSubmitting ? "Verificando…" : "Continuar"}
          </button>
        </form>
      ) : null}

      {step === "code" ? (
        <form className={styles.form} onSubmit={submitCode}>
          <label className={styles.field}>
            <span>Código de 6 dígitos</span>
            <input
              autoComplete="one-time-code"
              disabled={isSubmitting}
              inputMode="numeric"
              maxLength={6}
              minLength={6}
              name="code"
              pattern="[0-9]{6}"
              placeholder="000000"
              required
              type="text"
            />
          </label>
          {message ? <p className={styles.formMessage}>{message}</p> : null}
          {error ? <p className={styles.formError}>{error}</p> : null}
          <button className={styles.submit} disabled={isSubmitting} type="submit">
            {isSubmitting ? "Validando…" : "Validar código"}
          </button>
          <button
            className={styles.secondaryButton}
            disabled={isSubmitting}
            onClick={() => void resendCode()}
            type="button"
          >
            Reenviar código
          </button>
        </form>
      ) : null}

      {step === "password" ? (
        <form className={styles.form} onSubmit={submitPassword}>
          <label className={styles.field}>
            <span>Nova senha</span>
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
            <span>Confirmar nova senha</span>
            <input
              autoComplete="new-password"
              disabled={isSubmitting}
              minLength={10}
              name="confirmation"
              placeholder="Repita a nova senha"
              required
              type="password"
            />
          </label>
          {error ? <p className={styles.formError}>{error}</p> : null}
          <button className={styles.submit} disabled={isSubmitting} type="submit">
            {isSubmitting ? "Alterando…" : "Salvar nova senha"}
          </button>
        </form>
      ) : null}
    </>
  );
}
