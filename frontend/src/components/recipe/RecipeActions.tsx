"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./RecipeActions.module.css";

type WakeLockSentinelLike = { release: () => Promise<void> };
type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
};

type RecipeActionsProps = {
  steps: string[];
  title: string;
};

function copyText(value: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

export function RecipeActions({ steps, title }: RecipeActionsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [shareStatus, setShareStatus] = useState("");

  const requestWakeLock = useCallback(async () => {
    const wakeNavigator = navigator as WakeLockNavigator;
    if (!wakeNavigator.wakeLock || document.visibilityState !== "visible") return;
    try {
      wakeLockRef.current = await wakeNavigator.wakeLock.request("screen");
    } catch {
      wakeLockRef.current = null;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    const current = wakeLockRef.current;
    wakeLockRef.current = null;
    if (!current) return;
    try {
      await current.release();
    } catch {
      // A Wake Lock API pode liberar o bloqueio automaticamente ao trocar de aba.
    }
  }, []);

  const closeCookMode = useCallback(() => {
    dialogRef.current?.close();
    void releaseWakeLock();
  }, [releaseWakeLock]);

  const nextStep = useCallback(() => {
    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  }, [steps.length]);

  const previousStep = useCallback(() => {
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  useEffect(() => {
    function handleVisibility() {
      if (dialogRef.current?.open && document.visibilityState === "visible") void requestWakeLock();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      void releaseWakeLock();
    };
  }, [releaseWakeLock, requestWakeLock]);

  function openCookMode() {
    if (!steps.length) return;
    setStepIndex(0);
    dialogRef.current?.showModal();
    void requestWakeLock();
  }

  function handleCookKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nextStep();
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      previousStep();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeCookMode();
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    touchStartX.current = event.clientX;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const delta = event.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 55) return;
    if (delta < 0) nextStep();
    else previousStep();
  }

  async function shareRecipe() {
    const url = window.location.href;
    setShareStatus("");

    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        setShareStatus("Receita compartilhada.");
        return;
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else if (!copyText(url)) throw new Error("copy failed");
      setShareStatus("Link copiado.");
    } catch {
      setShareStatus("Não foi possível copiar o link.");
    }
  }

  return (
    <div className={styles.actions}>
      {steps.length > 0 ? (
        <button className={styles.primaryAction} onClick={openCookMode} type="button">
          <span aria-hidden="true">▶</span>
          Modo cozinhar
        </button>
      ) : null}
      <button className={styles.secondaryAction} onClick={() => void shareRecipe()} type="button">
        <span aria-hidden="true">↗</span>
        Compartilhar
      </button>
      <span aria-live="polite" className={styles.shareStatus}>{shareStatus}</span>

      <dialog
        aria-label={`Modo cozinhar: ${title}`}
        className={styles.cookDialog}
        onCancel={(event) => {
          event.preventDefault();
          closeCookMode();
        }}
        onClose={() => void releaseWakeLock()}
        onKeyDown={handleCookKeyDown}
        ref={dialogRef}
      >
        <div className={styles.cookShell} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
          <header className={styles.cookHeader}>
            <div>
              <span>Modo cozinhar</span>
              <strong>{title}</strong>
            </div>
            <button aria-label="Fechar modo cozinhar" className={styles.closeButton} onClick={closeCookMode} type="button">×</button>
          </header>

          <main className={styles.cookStep}>
            <p className={styles.stepCounter}>Passo {stepIndex + 1} de {steps.length}</p>
            <p className={styles.stepText}>{steps[stepIndex]}</p>
          </main>

          <footer className={styles.cookFooter}>
            <button disabled={stepIndex === 0} onClick={previousStep} type="button">
              <span aria-hidden="true">←</span> Anterior
            </button>
            <div aria-hidden="true" className={styles.progressTrack}>
              <span style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
            </div>
            {stepIndex < steps.length - 1 ? (
              <button className={styles.nextButton} onClick={nextStep} type="button">Próximo <span aria-hidden="true">→</span></button>
            ) : (
              <button className={styles.nextButton} onClick={closeCookMode} type="button">Concluir</button>
            )}
          </footer>
        </div>
      </dialog>
    </div>
  );
}
