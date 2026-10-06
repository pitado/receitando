"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";

import styles from "./BiteWordmark.module.css";

type Side = "top" | "bottom" | "left" | "right";

type Bite = {
  id: number;
  x: number;
  y: number;
  side: Side;
  radius: number;
  progress: number;
};

type BiteWordmarkProps = {
  centered?: boolean;
  compact?: boolean;
};

const MAX_BITES = 10;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function BiteWordmark({ centered = false, compact = false }: BiteWordmarkProps) {
  const [bites, setBites] = useState<Bite[]>([]);
  const [recomposing, setRecomposing] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const recompositionTimer = useRef<number | null>(null);
  const idRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    if (recompositionTimer.current !== null) window.clearTimeout(recompositionTimer.current);
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  function animateBite(id: number) {
    const startedAt = performance.now();
    const duration = 240;

    function frame(now: number) {
      const elapsed = now - startedAt;
      const raw = clamp(elapsed / duration, 0, 1);
      const eased = raw < 0.78
        ? (raw / 0.78) * 1.08
        : 1.08 - ((raw - 0.78) / 0.22) * 0.08;

      setBites((current) =>
        current.map((bite) =>
          bite.id === id ? { ...bite, progress: clamp(eased, 0, 1) } : bite,
        ),
      );

      if (raw < 1 && !recomposing) window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  }

  function scheduleRecompose(count: number) {
    clearTimers();
    closeTimer.current = window.setTimeout(() => {
      setRecomposing(true);
      recompositionTimer.current = window.setTimeout(() => {
        setBites([]);
        setRecomposing(false);
      }, 700);
    }, count >= MAX_BITES ? 600 : 2200);
  }

  function handleBite(event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) {
    if (recomposing) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const isKeyboard = "detail" in event && event.detail === 0;
    const clientX = "clientX" in event ? event.clientX : rect.left + rect.width * 0.5;
    const clientY = "clientY" in event ? event.clientY : rect.top;
    const localX = clamp(clientX - rect.left, 0, rect.width);
    const localY = clamp(clientY - rect.top, 0, rect.height);

    const side: Side = isKeyboard
      ? "top"
      : localX <= rect.width * 0.05
        ? "left"
        : localX >= rect.width * 0.95
          ? "right"
          : localY <= rect.height * 0.5
            ? "top"
            : "bottom";

    const bite: Bite = {
      id: ++idRef.current,
      x: localX,
      y: localY,
      side,
      radius: rect.height * (0.38 + Math.random() * 0.08),
      progress: 0,
    };

    setBites((current) => [...current, bite].slice(-MAX_BITES));
    window.requestAnimationFrame(() => animateBite(bite.id));
    scheduleRecompose(Math.min(MAX_BITES, bites.length + 1));
  }

  return (
    <div className={[styles.wrapper, centered ? styles.centered : "", compact ? styles.compact : ""].join(" ")}>
      <button
        aria-label="Receitando"
        className={styles.wordmark}
        data-testid="bite-wordmark"
        onClick={handleBite}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleBite(event);
          }
        }}
        type="button"
      >
        <span className={styles.word}>receitando</span>
        <span aria-hidden="true" className={styles.bites}>
          {bites.map((bite) => {
            const r = bite.radius * bite.progress;
            const x = bite.side === "left" ? -r * 0.25 : bite.side === "right" ? 100 : bite.x;
            const y = bite.side === "top" ? -r * 0.25 : bite.side === "bottom" ? 100 : bite.y;

            return (
              <span
                className={[styles.bite, styles["bite-" + bite.side]].join(" ")}
                key={bite.id}
                style={
                  {
                    "--bite-r": r + "px",
                    "--bite-x": x + "px",
                    "--bite-y": y + "px",
                  } as CSSProperties
                }
              >
                <i className={styles.core} />
                {Array.from({ length: 6 }).map((_, index) => (
                  <i className={[styles.tooth, styles["tooth-" + (index + 1)]].join(" ")} key={index} />
                ))}
              </span>
            );
          })}
          {bites.length > 0 ? (
            <span className={styles.crumbLayer}>
              {bites.flatMap((bite) =>
                Array.from({ length: 7 }).map((_, index) => (
                  <i
                    className={styles.crumb}
                    key={bite.id + "-" + index}
                    style={
                      {
                        "--crumb-x": bite.x + (index - 3) * 6 + "px",
                        "--crumb-y": bite.y - 8 - index * 2 + "px",
                        "--crumb-delay": index * 28 + "ms",
                      } as CSSProperties
                    }
                  />
                )),
              )}
            </span>
          ) : null}
        </span>
      </button>
    </div>
  );
}
