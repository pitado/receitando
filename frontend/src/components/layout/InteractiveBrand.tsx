"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { MouseEvent } from "react";

import styles from "./InteractiveBrand.module.css";

type Bite = {
  id: number;
  x: number;
  edge: "top" | "bottom";
  size: number;
};

const KEYBOARD_POINTS = [24, 48, 72, 36, 62] as const;

export function InteractiveBrand() {
  const pathname = usePathname();
  const router = useRouter();
  const [bites, setBites] = useState<Bite[]>([]);

  function handleBrandClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    const isKeyboardClick = event.detail === 0;
    const rawX = isKeyboardClick
      ? KEYBOARD_POINTS[bites.length % KEYBOARD_POINTS.length]
      : ((event.clientX - rect.left) / rect.width) * 100;
    const rawY = isKeyboardClick ? 32 : ((event.clientY - rect.top) / rect.height) * 100;

    const nextBite: Bite = {
      id: Date.now(),
      x: Math.max(8, Math.min(92, rawX)),
      edge: rawY < 50 ? "top" : "bottom",
      size: Math.max(24, Math.min(38, rect.width * 0.12)),
    };

    setBites((current) => {
      const base = current.length >= 5 ? [] : current;
      return [...base, nextBite];
    });

    if (pathname !== "/") {
      window.setTimeout(() => router.push("/"), 230);
    }
  }

  return (
    <a
      aria-label="Receitando — página inicial. Clique para dar uma mordida no logo."
      className={styles.brand}
      href="/"
      onClick={handleBrandClick}
    >
      <Image
        alt="Receitando"
        className={styles.logo}
        height={110}
        priority
        src="/receitando-logo.svg"
        width={520}
      />

      <span aria-hidden="true" className={styles.bites}>
        {bites.map((bite) => (
          <span
            className={`${styles.bite} ${bite.edge === "bottom" ? styles.biteBottom : styles.biteTop}`}
            key={bite.id}
            style={{
              "--bite-size": `${bite.size}px`,
              left: `${bite.x}%`,
            } as React.CSSProperties}
          >
            <i className={styles.mouth} />
            <i className={`${styles.tooth} ${styles.toothOne}`} />
            <i className={`${styles.tooth} ${styles.toothTwo}`} />
            <i className={`${styles.tooth} ${styles.toothThree}`} />
            <b className={`${styles.crumb} ${styles.crumbOne}`} />
            <b className={`${styles.crumb} ${styles.crumbTwo}`} />
          </span>
        ))}
      </span>
    </a>
  );
}
