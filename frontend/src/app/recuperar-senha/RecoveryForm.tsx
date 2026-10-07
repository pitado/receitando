"use client";

import Link from "next/link";
import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { ApiError } from "@/services/api-client";
import {
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetCode,
} from "@/services/auth.service";

import styles from "./page.module.css";

type Step = "email" | "code" | "password" | "done";

const CODE_TTL_SECONDS = 10 * 60;
const CODE_LENGTH = 6;

function stepNumber(step: Step) {
  if (step === "email") return 1;
  if (step === "code") return 2;
  if (step === "password") return 3;
  return 4;
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

type PreparationStepProps = {
  index: number;
  current: number;
  title: string;
  description: string;
};

function PreparationStep({
  index,
  current,
  title,
  description,
}: PreparationStepProps) {
  const done = current > index;
  const active = current === index;

  return (
    <div
      className={`${styles.prepStep} ${done ? styles.prepDone : ""} ${active ? styles.prepCurrent : ""}`}
    >
      <span className={styles.prepDot} aria-hidden="true">
        {done ? (
          <svg viewBox="0 0 24 24">
            <path d="m5 12.5 4.2 4.2L19 7" />
          </svg>
        ) : (
          index
        )}
      </span>
      <div>
        <p className={styles.prepTitle}>{title}</p>
        <p className={styles.prepDescription}>{description}</p>
      </div>
    </div>
  );
}

export function RecoveryForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetId, setResetId] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(CODE_TTL_SECONDS);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);
  const passwordRef = useRef<HTMLInputElement>(null);

  const currentStep = stepNumber(step);

  useEffect(() => {
    if (step === "email") {
      emailRef.current?.focus();
    } else if (step === "code") {
      codeRefs.current[0]?.focus();
    } else if (step === "password") {
      passwordRef.current?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (step !== "code" || secondsLeft <= 0) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [step, secondsLeft]);

  function clearFeedback() {
    if (error) setError("");
    if (message) setMessage("");
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();
    const input = emailRef.current;

    if (!normalizedEmail || !input?.validity.valid) {
      setError("Digite um e-mail válido, tipo voce@exemplo.com.");
      setMessage("");
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset(normalizedEmail);
      setResetId(result.resetId);
      setDigits(Array(CODE_LENGTH).fill(""));
      setSecondsLeft(CODE_TTL_SECONDS);
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

    const code = digits.join("");
    if (code.length !== CODE_LENGTH) {
      setError("O código tem 6 dígitos. Confere de novo o e-mail.");
      setMessage("");
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const result = await verifyPasswordResetCode(resetId, code);
      setResetToken(result.resetToken);
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
    setError("");
    setMessage("");

    if (password.length < 10) {
      setError("A senha precisa ter pelo menos 10 caracteres.");
      return;
    }

    if (password !== confirmation) {
      setError("As senhas não estão iguais. Repita o tempero.");
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
      setDigits(Array(CODE_LENGTH).fill(""));
      setSecondsLeft(CODE_TTL_SECONDS);
      setMessage("Código novo a caminho. Confira sua caixa de entrada.");
      window.requestAnimationFrame(() => codeRefs.current[0]?.focus());
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

  function changeEmail() {
    setError("");
    setMessage("");
    setResetId("");
    setResetToken("");
    setDigits(Array(CODE_LENGTH).fill(""));
    setSecondsLeft(CODE_TTL_SECONDS);
    setStep("email");
  }

  function updateDigit(index: number, value: string) {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = nextValue;
    setDigits(nextDigits);
    clearFeedback();

    if (nextValue && codeRefs.current[index + 1]) {
      codeRefs.current[index + 1]?.focus();
    }
  }

  function handleCodeKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      codeRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      codeRefs.current[index + 1]?.focus();
    }
  }

  function handleCodePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;

    event.preventDefault();
    const nextDigits = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((digit, index) => {
      nextDigits[index] = digit;
    });
    setDigits(nextDigits);
    clearFeedback();

    const nextIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    window.requestAnimationFrame(() => codeRefs.current[nextIndex]?.focus());
  }

  const timerLabel =
    secondsLeft > 0
      ? `esfria em ${formatTimer(secondsLeft)}`
      : "código esfriou, peça outro";

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.intro} aria-labelledby="recover-title">
          <h1 id="recover-title">
            Esqueceu o <span>tempero secreto?</span>
          </h1>

          <p className={styles.introCopy}>
            Acontece até nas melhores cozinhas. A gente te manda um código e, em poucos passos,
            você cria uma senha novinha.
          </p>

          <div className={styles.preparationCard}>
            <div className={styles.preparationHeading}>
              <h2>Modo de preparo</h2>
              <span
                aria-live="polite"
                className={`${styles.stepBadge} ${step === "done" ? styles.stepBadgeReady : ""}`}
              >
                {step === "done" ? "Pronto" : `Passo ${currentStep} de 3`}
              </span>
            </div>

            <div className={styles.preparationList}>
              <PreparationStep
                current={currentStep}
                description="Pra gente saber de quem é a cozinha."
                index={1}
                title="Informe seu e-mail"
              />
              <PreparationStep
                current={currentStep}
                description="Chega no seu e-mail e vale por 10 minutos."
                index={2}
                title="Digite o código"
              />
              <PreparationStep
                current={currentStep}
                description="Mínimo de 10 caracteres, bem temperada."
                index={3}
                title="Crie uma senha nova"
              />
            </div>

            <div className={styles.securityNote}>
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M7.5 10V7.8a4.5 4.5 0 0 1 9 0V10m-10 0h11v9h-11z" />
              </svg>
              <p>O Receitando nunca envia sua senha atual por e-mail.</p>
            </div>
          </div>
        </section>

        <section className={styles.formCard} aria-label="Recuperação de senha">
          {step === "email" ? (
            <>
              <h2>
                Qual é o seu <span className={styles.noWrap}>e-mail?</span>
              </h2>
              <p className={styles.formIntro}>Digite o e-mail cadastrado na sua conta.</p>

              <form className={styles.form} noValidate onSubmit={submitEmail}>
                <div className={styles.field}>
                  <label htmlFor="recovery-email">E-mail</label>
                  <input
                    autoComplete="email"
                    disabled={isSubmitting}
                    id="recovery-email"
                    inputMode="email"
                    onChange={(event) => {
                      setEmail(event.currentTarget.value);
                      clearFeedback();
                    }}
                    placeholder="voce@exemplo.com"
                    ref={emailRef}
                    required
                    type="email"
                    value={email}
                  />
                </div>

                {error ? (
                  <p aria-live="polite" className={styles.formError}>
                    {error}
                  </p>
                ) : null}

                <button className={styles.submit} disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Enviando…" : "Enviar código"}
                </button>
              </form>

              <p className={styles.formFooter}>
                Lembrou da senha?{" "}
                <Link href="/entrar">
                  Voltar para <span className={styles.noWrap}>entrar</span>
                </Link>
              </p>
            </>
          ) : null}

          {step === "code" ? (
            <>
              <h2>Confere a caixa de entrada</h2>
              <p className={styles.formIntro}>
                Mandamos um código de 6 dígitos para{" "}
                <strong className={styles.noWrap}>{email}</strong>.
              </p>

              <form className={styles.form} onSubmit={submitCode}>
                <div className={styles.codeField}>
                  <div className={styles.labelRow}>
                    <span className={styles.fieldLabel}>Código</span>
                    <span aria-live="polite" className={styles.timer}>
                      {timerLabel}
                    </span>
                  </div>

                  <div className={styles.codeInputs}>
                    {digits.map((digit, index) => (
                      <input
                        aria-label={`Dígito ${index + 1}`}
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        className={styles.codeInput}
                        disabled={isSubmitting}
                        inputMode="numeric"
                        key={index}
                        maxLength={1}
                        onChange={(event) => updateDigit(index, event.currentTarget.value)}
                        onKeyDown={(event) => handleCodeKeyDown(index, event)}
                        onPaste={handleCodePaste}
                        ref={(node) => {
                          codeRefs.current[index] = node;
                        }}
                        type="text"
                        value={digit}
                      />
                    ))}
                  </div>
                </div>

                {message ? (
                  <p aria-live="polite" className={styles.formMessage}>
                    {message}
                  </p>
                ) : null}

                {error ? (
                  <p aria-live="polite" className={styles.formError}>
                    {error}
                  </p>
                ) : null}

                <button className={styles.submit} disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Confirmando…" : "Confirmar código"}
                </button>

                <div className={styles.secondaryLinks}>
                  <button
                    className={styles.textButton}
                    disabled={isSubmitting}
                    onClick={() => void resendCode()}
                    type="button"
                  >
                    Reenviar código
                  </button>
                  <button
                    className={styles.textButton}
                    disabled={isSubmitting}
                    onClick={changeEmail}
                    type="button"
                  >
                    Trocar <span className={styles.noWrap}>e-mail</span>
                  </button>
                </div>
              </form>
            </>
          ) : null}

          {step === "password" ? (
            <>
              <h2>Crie um tempero novo</h2>
              <p className={styles.formIntro}>
                Escolha uma senha que você vá lembrar, mas que ninguém adivinhe.
              </p>

              <form className={styles.form} noValidate onSubmit={submitPassword}>
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label htmlFor="recovery-password">Nova senha</label>
                    <span className={styles.hint}>mín. 10 caracteres</span>
                  </div>
                  <input
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    id="recovery-password"
                    minLength={10}
                    name="password"
                    onChange={(event) => {
                      setPassword(event.currentTarget.value);
                      clearFeedback();
                    }}
                    placeholder="Seu novo tempero secreto"
                    ref={passwordRef}
                    required
                    type="password"
                    value={password}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="recovery-confirmation">Confirmar nova senha</label>
                  <input
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    id="recovery-confirmation"
                    minLength={10}
                    name="confirmation"
                    onChange={(event) => {
                      setConfirmation(event.currentTarget.value);
                      clearFeedback();
                    }}
                    placeholder="Repita o tempero"
                    required
                    type="password"
                    value={confirmation}
                  />
                </div>

                {error ? (
                  <p aria-live="polite" className={styles.formError}>
                    {error}
                  </p>
                ) : null}

                <button className={styles.submit} disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Salvando…" : "Salvar nova senha"}
                </button>
              </form>
            </>
          ) : null}

          {step === "done" ? (
            <div className={styles.successState}>
              <span className={styles.successIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="m5 12.5 4.2 4.2L19 7" />
                </svg>
              </span>
              <h2>Tudo no ponto!</h2>
              <p>Sua senha nova já está valendo. É só voltar pra cozinha.</p>
              <Link className={`${styles.submit} ${styles.successButton}`} href="/entrar">
                Entrar
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
