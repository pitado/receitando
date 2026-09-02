"use client";

import { useState } from "react";
import type { CSSProperties, MouseEvent } from "react";

import styles from "./BiteWordmark.module.css";

type Bite = {
  id: number;
  x: number;
  edge: "top" | "bottom";
  size: number;
  rotation: number;
};

type BiteWordmarkProps = {
  centered?: boolean;
};

const KEYBOARD_POINTS = [16, 31, 47, 63, 79, 88] as const;
const ROTATIONS = [-10, 7, -5, 11, -8, 4] as const;

export function BiteWordmark({ centered = false }: BiteWordmarkProps) {
  const [bites, setBites] = useState<Bite[]>([]);

  function addBite(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const isKeyboardClick = event.detail === 0;
    const x = isKeyboardClick
      ? KEYBOARD_POINTS[bites.length % KEYBOARD_POINTS.length]
      : ((event.clientX - rect.left) / rect.width) * 100;
    const y = isKeyboardClick ? 28 : ((event.clientY - rect.top) / rect.height) * 100;
    const index = bites.length % ROTATIONS.length;

    const nextBite: Bite = {
      id: Date.now() + bites.length,
      x: Math.max(8, Math.min(92, x)),
      edge: y < 50 ? "top" : "bottom",
      size: Math.max(34, Math.min(64, rect.width * 0.095)),
      rotation: ROTATIONS[index],
    };

    setBites((current) => {
      const base = current.length >= 7 ? [] : current;
      return [...base, nextBite];
    });
  }

  return (
    <div className={`${styles.wrapper} ${centered ? styles.centered : ""}`}>
      <button
        aria-label="Receitando. Clique para morder a palavra."
        className={styles.wordmark}
        data-testid="bite-wordmark"
        onClick={addBite}
        type="button"
      >
        <span className={styles.word}>Receitando</span>

        <span aria-hidden="true" className={styles.bites}>
          {bites.map((bite) => (
            <span
              className={`${styles.bite} ${bite.edge === "bottom" ? styles.biteBottom : styles.biteTop}`}
              data-testid="bite-mark"
              key={bite.id}
              style={
                {
                  "--bite-size": `${bite.size}px`,
                  "--bite-rotation": `${bite.rotation}deg`,
                  left: `${bite.x}%`,
                } as CSSProperties
              }
            >
              <i className={styles.core} />
              <i className={`${styles.tooth} ${styles.toothOne}`} />
              <i className={`${styles.tooth} ${styles.toothTwo}`} />
              <i className={`${styles.tooth} ${styles.toothThree}`} />
              <i className={`${styles.tooth} ${styles.toothFour}`} />
              <b className={`${styles.crumb} ${styles.crumbOne}`} />
              <b className={`${styles.crumb} ${styles.crumbTwo}`} />
              <b className={`${styles.crumb} ${styles.crumbThree}`} />
              <b className={`${styles.crumb} ${styles.crumbFour}`} />
              <b className={`${styles.crumb} ${styles.crumbFive}`} />
            </span>
          ))}
        </span>
      </button>

      <p className={styles.hint}>
        <span aria-hidden="true">↗</span>
        clique no Receitando para morder
      </p>
    </div>
  );
}
