"use client";

import { useState } from "react";
import type { CSSProperties, MouseEvent } from "react";

import styles from "./BiteWordmark.module.css";

type Bite = {
  id: number;
  x: number;
  edge: "top" | "bottom";
  size: number;
};

type BiteWordmarkProps = {
  centered?: boolean;
};

const KEYBOARD_POINTS = [18, 34, 52, 68, 82] as const;

export function BiteWordmark({ centered = false }: BiteWordmarkProps) {
  const [bites, setBites] = useState<Bite[]>([]);

  function addBite(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const isKeyboardClick = event.detail === 0;
    const x = isKeyboardClick
      ? KEYBOARD_POINTS[bites.length % KEYBOARD_POINTS.length]
      : ((event.clientX - rect.left) / rect.width) * 100;
    const y = isKeyboardClick ? 35 : ((event.clientY - rect.top) / rect.height) * 100;

    const nextBite: Bite = {
      id: Date.now() + bites.length,
      x: Math.max(9, Math.min(91, x)),
      edge: y < 50 ? "top" : "bottom",
      size: Math.max(30, Math.min(54, rect.width * 0.09)),
    };

    setBites((current) => {
      const base = current.length >= 6 ? [] : current;
      return [...base, nextBite];
    });
  }

  return (
    <div className={`${styles.wrapper} ${centered ? styles.centered : ""}`}>
      <button
        aria-label="Receitando. Clique para dar uma mordida na palavra."
        className={styles.wordmark}
        onClick={addBite}
        type="button"
      >
        <span className={styles.word}>Receitando</span>

        <span aria-hidden="true" className={styles.bites}>
          {bites.map((bite) => (
            <span
              className={`${styles.bite} ${bite.edge === "bottom" ? styles.biteBottom : styles.biteTop}`}
              key={bite.id}
              style={
                {
                  "--bite-size": `${bite.size}px`,
                  left: `${bite.x}%`,
                } as CSSProperties
              }
            >
              <i className={`${styles.tooth} ${styles.toothOne}`} />
              <i className={`${styles.tooth} ${styles.toothTwo}`} />
              <i className={`${styles.tooth} ${styles.toothThree}`} />
              <b className={`${styles.crumb} ${styles.crumbOne}`} />
              <b className={`${styles.crumb} ${styles.crumbTwo}`} />
              <b className={`${styles.crumb} ${styles.crumbThree}`} />
            </span>
          ))}
        </span>
      </button>

      <p className={styles.hint}>
        <span aria-hidden="true">↗</span>
        clique no nome e dê uma mordida
      </p>
    </div>
  );
}
