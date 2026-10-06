"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";

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

function buildMask(bites: Bite[], width: number, height: number) {
  if (!width || !height || bites.length === 0) return "none";

  const holes = bites.flatMap((bite) => {
    const radius = bite.radius * bite.progress;
    if (radius <= 0) return [];

    let cx = bite.x;
    let cy = bite.y;
    let startAngle = 15;
    let endAngle = 165;

    if (bite.side === "bottom") {
      cy = height + radius * 0.25;
      startAngle = 195;
      endAngle = 345;
    } else if (bite.side === "left") {
      cx = -radius * 0.25;
      startAngle = -75;
      endAngle = 75;
    } else if (bite.side === "right") {
      cx = width + radius * 0.25;
      startAngle = 105;
      endAngle = 255;
    } else {
      cy = -radius * 0.25;
    }

    const teeth = Array.from({ length: 6 }, (_, index) => {
      const angle = (startAngle + ((endAngle - startAngle) * index) / 5) * Math.PI / 180;
      return {
        cx: cx + Math.cos(angle) * radius * 0.88,
        cy: cy + Math.sin(angle) * radius * 0.88,
        r: radius * 0.22,
      };
    });

    return [
      `<circle cx="${cx}" cy="${cy}" r="${radius * 0.92}"/>`,
      ...teeth.map((tooth) => `<circle cx="${tooth.cx}" cy="${tooth.cy}" r="${tooth.r}"/>`),
    ];
  }).join("");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs><mask id="m"><rect width="100%" height="100%" fill="white"/><g fill="black">${holes}</g></mask></defs>` +
    `<rect width="100%" height="100%" fill="white" mask="url(#m)"/></svg>`;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function BiteWordmark({ centered = false, compact = false }: BiteWordmarkProps) {
  const wordRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<number | null>(null);
  const recompositionTimer = useRef<number | null>(null);
  const idRef = useRef(0);

  const [bites, setBites] = useState<Bite[]>([]);
  const [recomposing, setRecomposing] = useState(false);

  const clearTimers = useCallback(() => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    if (recompositionTimer.current !== null) window.clearTimeout(recompositionTimer.current);
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  function animateBite(id: number) {
    const startedAt = performance.now();
    const duration = 240;

    function frame(now: number) {
      const raw = clamp((now - startedAt) / duration, 0, 1);
      const eased = raw < 0.8
        ? (raw / 0.8) * 1.08
        : 1.08 - ((raw - 0.8) / 0.2) * 0.08;

      setBites((current) =>
        current.map((bite) =>
          bite.id === id ? { ...bite, progress: clamp(eased, 0, 1) } : bite,
        ),
      );

      if (raw < 1) window.requestAnimationFrame(frame);
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

    const word = wordRef.current;
    if (!word) return;

    const rect = word.getBoundingClientRect();
    const isKeyboard = "key" in event;
    const localX = isKeyboard
      ? rect.width * 0.5
      : clamp((event as MouseEvent<HTMLButtonElement>).clientX - rect.left, 0, rect.width);
    const localY = isKeyboard
      ? 0
      : clamp((event as MouseEvent<HTMLButtonElement>).clientY - rect.top, 0, rect.height);

    const side: Side = isKeyboard
      ? "top"
      : localX <= rect.width * 0.05
        ? "left"
        : localX >= rect.width * 0.95
          ? "right"
          : localY <= rect.height * 0.5
            ? "top"
            : "bottom";

    const radius = rect.height * (0.38 + Math.random() * 0.08);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bite: Bite = {
      id: ++idRef.current,
      x: side === "left" ? -radius * 0.25 : side === "right" ? rect.width + radius * 0.25 : localX,
      y: side === "top" ? -radius * 0.25 : side === "bottom" ? rect.height + radius * 0.25 : localY,
      side,
      radius,
      progress: reducedMotion ? 1 : 0,
    };

    setBites((current) => [...current, bite].slice(-MAX_BITES));
    if (!reducedMotion) animateBite(bite.id);

    scheduleRecompose(Math.min(MAX_BITES, bites.length + 1));

    if (!reducedMotion) {
      const anchorX = word.offsetLeft + bite.x;
      const anchorY = word.offsetTop + bite.y;
      setTimeout(() => {
        const wrapper = word.parentElement;
        if (!wrapper) return;
        for (let index = 0; index < 7; index += 1) {
          const crumb = document.createElement("i");
          const size = 2 + Math.random() * 3;
          crumb.className = styles.crumb;
          crumb.style.width = size + "px";
          crumb.style.height = size + "px";
          crumb.style.left = anchorX + (index - 3) * 5 + "px";
          crumb.style.top = anchorY - 8 - index * 2 + "px";
          crumb.style.setProperty("--crumb-delay", index * 28 + "ms");
          wrapper.appendChild(crumb);
          window.setTimeout(() => crumb.remove(), 1000);
        }
      }, 90);
    }
  }

  useEffect(() => {
    const word = wordRef.current;
    if (!word) return;

    const applyMask = () => {
      const mask = buildMask(bites, word.offsetWidth, word.offsetHeight);
      word.style.setProperty("-webkit-mask-image", mask);
      word.style.setProperty("mask-image", mask);
      word.style.setProperty("-webkit-mask-repeat", "no-repeat");
      word.style.setProperty("mask-repeat", "no-repeat");
      word.style.setProperty("-webkit-mask-size", "100% 100%");
      word.style.setProperty("mask-size", "100% 100%");
    };

    applyMask();

    const observer = new ResizeObserver(applyMask);
    observer.observe(word);

    return () => observer.disconnect();
  }, [bites]);

  return (
    <div className={[styles.wrapper, centered ? styles.centered : "", compact ? styles.compact : ""].join(" ")}>
      <button
        aria-label="Receitando"
        className={styles.wordmark}
        data-testid="bite-wordmark"
        onClick={handleBite}
        type="button"
      >
        <span className={styles.word} ref={wordRef}>receitando</span>
      </button>
    </div>
  );
}
