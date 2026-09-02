"use client";

import { useState } from "react";
import type { MouseEvent } from "react";

import styles from "./BiteWordmark.module.css";

type Bite = {
  id: number;
  x: number;
  y: number;
  size: number;
};

const KEYBOARD_POINTS = [
  [82, 26],
  [18, 62],
  [57, 74],
  [36, 30],
  [72, 58],
] as const;

export function BiteWordmark() {
  const [bites, setBites] = useState<Bite[]>([]);

  function addBite(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const isKeyboardClick = event.detail === 0;
    const keyboardPoint = KEYBOARD_POINTS[bites.length % KEYBOARD_POINTS.length];

    const x = isKeyboardClick
      ? keyboardPoint[0]
      : ((event.clientX - rect.left) / rect.width) * 100;
    const y = isKeyboardClick
      ? keyboardPoint[1]
      : ((event.clientY - rect.top) / rect.height) * 100;

    const nextBite: Bite = {
      id: Date.now(),
      x: Math.max(4, Math.min(96, x)),
      y: Math.max(8, Math.min(92, y)),
      size: Math.max(34, Math.min(70, rect.width * 0.065)),
    };

    setBites((current) => {
      const base = current.length >= 7 ? [] : current;
      return [...base, nextBite];
    });
  }

  return (
    <div className={styles.wrapper}>
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
              className={styles.bite}
              key={bite.id}
              style={{
                height: `${bite.size}px`,
                left: `${bite.x}%`,
                top: `${bite.y}%`,
                width: `${bite.size}px`,
              }}
            />
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
