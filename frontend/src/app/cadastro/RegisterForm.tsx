"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";

import { ApiError } from "@/services/api-client";
import { register } from "@/services/auth.service";
import { getHomeFeed } from "@/services/home.service";

import styles from "./page.module.css";

const FALLBACK_RECIPE_COUNT = 280;

type IngredientTagProps = {
  label: string;
  ready: boolean;
};

function IngredientTag({ label, ready }: IngredientTagProps) {
  return (
    <span className={`${styles.ingredientTag} ${ready ? styles.ingredientReady : ""}`}>
      {ready ? label : `+ ${label}`}
    </span>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailValid, setEmailValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [recipeCount, setRecipeCount] = useState(FALLBACK_RECIPE_COUNT);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getHomeFeed()
      .then((feed) => {
        if (!cancelled && feed.totals.recipes > 0) {
          setRecipeCount(feed.totals.recipes);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const nameReady = name.trim().length >= 2;
  const passwordReady =
    password.length >= 10 &&
    confirmPassword.length >= 10 &&
    password === confirmPassword;
  const missingCount = [nameReady, emailValid, passwordReady].filter((ready) => !ready).length;
  const allReady = missingCount === 0;

  const counterLabel =
    missingCount === 0 ? "Tudo pronto" : missingCount === 1 ? "Falta 1" : `Faltam ${missingCount}`;

  const statusMessage =
    missingCount === 0
      ? "Tudo na bancada. É só levar ao forno."
      : missingCount === 3
        ? "Preencha ao lado e veja tudo ir pra bancada."
        : "Tá quase no ponto, falta pouco.";

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    const nextEmail = event.currentTarget.value;
    setEmail(nextEmail);
    setEmailValid(Boolean(nextEmail.trim()) && event.currentTarget.validity.valid);
    if (error) setError("");
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.currentTarget.value);
    if (error) setError("");
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.currentTarget.value);
    if (error) setError("");
  }

  function handleConfirmPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setConfirmPassword(event.currentTarget.value);
    if (error) setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await register(name.trim(), email.trim(), password, remember);
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
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.intro} aria-labelledby="register-title">
          <h1 id="register-title">
            Pra entrar,
            <br />
            você <span>já tem tudo.</span>
          </h1>

          <p className={styles.introCopy}>
            Nome, e-mail e uma senha. Nada de sair pra comprar: os ingredientes do cadastro já
            moram aí com você.
          </p>

          <div className={styles.recipeCard}>
            <div className={styles.recipeHeading}>
              <h2>Conta no receitando</h2>
              <span
                aria-live="polite"
                className={`${styles.counter} ${allReady ? styles.counterReady : ""}`}
              >
                {counterLabel}
              </span>
            </div>

            <div className={styles.recipeMeta}>
              <div>
                <span>Preparo</span>
                <strong>1 minuto</strong>
              </div>
              <div>
                <span>Rende</span>
                <strong>{recipeCount} receitas</strong>
              </div>
              <div>
                <span>Dificuldade</span>
                <strong>Nenhuma</strong>
              </div>
            </div>

            <p className={styles.ingredientsLabel}>Ingredientes</p>
            <div className={styles.ingredients}>
              <IngredientTag label="1 nome" ready={nameReady} />
              <IngredientTag label="1 e-mail" ready={emailValid} />
              <IngredientTag label="1 senha caprichada" ready={passwordReady} />
              <IngredientTag label="uma pitada de fome" ready />
            </div>

            <p aria-live="polite" className={styles.statusMessage}>
              {statusMessage}
            </p>
          </div>
        </section>

        <section className={styles.formCard} aria-label="Formulário de cadastro">
          <h2>Criar sua conta</h2>
          <p className={styles.formIntro}>Leva menos tempo que um miojo.</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="register-name">Nome</label>
              <input
                autoComplete="name"
                disabled={isSubmitting}
                id="register-name"
                maxLength={100}
                minLength={2}
                name="name"
                onChange={handleNameChange}
                placeholder="Como te chamam na cozinha?"
                required
                type="text"
                value={name}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="register-email">E-mail</label>
              <input
                autoComplete="email"
                disabled={isSubmitting}
                id="register-email"
                inputMode="email"
                name="email"
                onChange={handleEmailChange}
                placeholder="voce@exemplo.com"
                required
                type="email"
                value={email}
              />
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="register-password">Senha</label>
                <span>mín. 10 caracteres</span>
              </div>
              <input
                autoComplete="new-password"
                disabled={isSubmitting}
                id="register-password"
                minLength={10}
                name="password"
                onChange={handlePasswordChange}
                placeholder="Seu tempero secreto"
                required
                type="password"
                value={password}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="register-confirm-password">Confirmar senha</label>
              <input
                autoComplete="new-password"
                disabled={isSubmitting}
                id="register-confirm-password"
                minLength={10}
                name="confirmPassword"
                onChange={handleConfirmPasswordChange}
                placeholder="Repita o tempero"
                required
                type="password"
                value={confirmPassword}
              />
            </div>

            <label className={styles.remember} htmlFor="register-remember">
              <input
                checked={remember}
                disabled={isSubmitting}
                id="register-remember"
                name="remember"
                onChange={(event) => setRemember(event.currentTarget.checked)}
                type="checkbox"
              />
              <span>Manter o fogo aceso (continuar conectado)</span>
            </label>

            {error ? (
              <p className={styles.formError} role="alert">
                {error}
              </p>
            ) : null}

            <button
              className={`${styles.submit} ${allReady ? styles.submitReady : ""}`}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Criando sua conta…" : "Criar minha conta"}
            </button>
          </form>

          <p className={styles.loginPrompt}>
            Já é de casa? <Link href="/entrar">Entrar</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
