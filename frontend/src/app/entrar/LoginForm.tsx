"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

import { ApiError } from "@/services/api-client";
import { login } from "@/services/auth.service";

import styles from "./page.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function destinationAfterLogin(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/despensa";
  }
  return next;
}

export function LoginForm() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [credentialsRejected, setCredentialsRejected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearRequestError() {
    if (requestError) setRequestError("");
    if (credentialsRejected) setCredentialsRejected(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();
    const nextEmailError = !normalizedEmail
      ? "Digite seu e-mail."
      : !EMAIL_PATTERN.test(normalizedEmail)
        ? "Digite um e-mail válido, tipo voce@exemplo.com."
        : "";
    const nextPasswordError = !password ? "Digite sua senha." : "";

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setRequestError("");
    setCredentialsRejected(false);

    if (nextEmailError || nextPasswordError) {
      if (nextEmailError) emailRef.current?.focus();
      else passwordRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      await login(normalizedEmail, password, remember);
      router.replace(destinationAfterLogin());
      router.refresh();
    } catch (requestErrorValue: unknown) {
      if (requestErrorValue instanceof ApiError) {
        if (requestErrorValue.status === 401) {
          setCredentialsRejected(true);
          setRequestError(
            "E-mail ou senha incorretos. Confira os dados ou crie uma senha nova.",
          );
          setPassword("");
          window.requestAnimationFrame(() => passwordRef.current?.focus());
        } else {
          setRequestError(requestErrorValue.message);
        }
      } else {
        setRequestError("Não foi possível entrar agora. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {requestError ? (
        <div className={styles.authAlert} role="alert">
          <span className={styles.alertIcon} aria-hidden="true">
            !
          </span>
          <p>
            {credentialsRejected ? (
              <>
                E-mail ou senha incorretos. Confira os dados ou{" "}
                <Link href="/recuperar-senha">crie uma senha nova</Link>.
              </>
            ) : (
              requestError
            )}
          </p>
        </div>
      ) : null}

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="login-email">E-mail</label>
          <input
            aria-describedby="login-email-error"
            aria-invalid={Boolean(emailError)}
            autoCapitalize="none"
            autoComplete="email"
            disabled={isSubmitting}
            enterKeyHint="next"
            id="login-email"
            inputMode="email"
            name="email"
            onChange={(event) => {
              setEmail(event.currentTarget.value);
              if (emailError) setEmailError("");
              clearRequestError();
            }}
            placeholder="voce@exemplo.com"
            ref={emailRef}
            spellCheck={false}
            type="email"
            value={email}
          />
          <p
            aria-live="polite"
            className={styles.fieldError}
            id="login-email-error"
          >
            {emailError}
          </p>
        </div>

        <div className={styles.field}>
          <label htmlFor="login-password">Senha</label>
          <div className={styles.passwordField}>
            <input
              aria-describedby="login-password-error"
              aria-invalid={Boolean(passwordError)}
              autoComplete="current-password"
              disabled={isSubmitting}
              enterKeyHint="go"
              id="login-password"
              minLength={10}
              name="password"
              onChange={(event) => {
                setPassword(event.currentTarget.value);
                if (passwordError) setPasswordError("");
                clearRequestError();
              }}
              placeholder="Sua senha"
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              value={password}
            />

            <button
              aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              className={styles.passwordToggle}
              disabled={isSubmitting}
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? (
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.7 10.7 0 0 1 12 4c5.5 0 9 5 9 5a15.2 15.2 0 0 1-3.1 3.6M6.1 6.2C4.2 7.5 3 9 3 9s3.5 5 9 5c.8 0 1.6-.1 2.3-.3" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" />
                  <circle cx="12" cy="12" r="2.4" />
                </svg>
              )}
            </button>
          </div>

          <p
            aria-live="polite"
            className={styles.fieldError}
            id="login-password-error"
          >
            {passwordError}
          </p>
        </div>

        <div className={styles.formMeta}>
          <label className={styles.remember} htmlFor="login-remember">
            <input
              checked={remember}
              disabled={isSubmitting}
              id="login-remember"
              name="remember"
              onChange={(event) => setRemember(event.currentTarget.checked)}
              type="checkbox"
            />
            <span>Lembrar de mim</span>
          </label>

          <Link className={styles.textLink} href="/recuperar-senha">
            Esqueci minha senha
          </Link>
        </div>

        <button
          aria-busy={isSubmitting}
          className={styles.submit}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              Entrando…
            </>
          ) : (
            "Entrar"
          )}
        </button>
      </form>

      <div className={styles.divider}>
        <span>ou</span>
      </div>

      <p className={styles.signup}>
        Ainda não tem conta? <Link href="/cadastro">Criar conta</Link>
      </p>
    </>
  );
}
