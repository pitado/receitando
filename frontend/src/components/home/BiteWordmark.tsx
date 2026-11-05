"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";

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
type Crumb = { id: number; x: number; y: number; dx: number; dy: number; size: number; delay: number };
type BiteWordmarkProps = { centered?: boolean; compact?: boolean };

const MAX_BITES = 9;
const BITE_DURATION = 250;
const RESTORE_DURATION = 580;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Máscara alfa em SVG: as mordidas são recortes reais nas letras. */
function buildMask(bites: Bite[], width: number, height: number) {
  if (width <= 0 || height <= 0 || bites.length === 0) return "none";

  const holes = bites.flatMap((bite) => {
    const radius = bite.radius * bite.progress;
    if (radius <= 0) return [];

    const x = bite.x * width;
    const y = bite.y * height;
    const cx = bite.side === "left" ? -radius * 0.22 :
      bite.side === "right" ? width + radius * 0.22 : x;
    const cy = bite.side === "top" ? -radius * 0.22 :
      bite.side === "bottom" ? height + radius * 0.22 : y;
    const angle = bite.side === "left" ? 0 :
      bite.side === "right" ? 180 :
      bite.side === "bottom" ? 270 : 90;

    const teeth = Array.from({ length: 6 }, (_, index) => {
      const radians = ((angle - 62 + index * 24.8) * Math.PI) / 180;
      const tx = cx + Math.cos(radians) * radius * 0.86;
      const ty = cy + Math.sin(radians) * radius * 0.86;
      return `<circle cx="${tx}" cy="${ty}" r="${radius * 0.21}"/>`;
    }).join("");

    return [`<circle cx="${cx}" cy="${cy}" r="${radius * 0.91}"/>${teeth}`];
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><mask id="bite" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="white"/><g fill="black">${holes}</g></mask></defs><rect width="${width}" height="${height}" fill="white" mask="url(#bite)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function BiteWordmark({ centered = false, compact = false }: BiteWordmarkProps) {
  const pathname = usePathname();
  const wordRef = useRef<HTMLSpanElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const bitesRef = useRef<Bite[]>([]);
  const biteIdRef = useRef(0);
  const crumbIdRef = useRef(0);
  const activeFrames = useRef<Set<number>>(new Set());
  const crumbTimers = useRef<Set<number>>(new Set());
  const settleTimer = useRef<number | null>(null);
  const restoreFrame = useRef<number | null>(null);
  const restoringRef = useRef(false);
  const [bites, setBites] = useState<Bite[]>([]);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);

  const applyMask = useCallback(() => {
    const word = wordRef.current;
    if (!word) return;
    const mask = buildMask(bitesRef.current, word.offsetWidth, word.offsetHeight);
    word.style.setProperty("-webkit-mask-image", mask);
    word.style.setProperty("mask-image", mask);
    word.style.setProperty("-webkit-mask-repeat", "no-repeat");
    word.style.setProperty("mask-repeat", "no-repeat");
  }, []);

  useEffect(() => {
    bitesRef.current = bites;
    applyMask();
  }, [bites, applyMask]);

  useEffect(() => {
    const word = wordRef.current;
    if (!word) return;
    const observer = new ResizeObserver(applyMask);
    observer.observe(word);
    return () => {
      observer.disconnect();
      if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
      if (restoreFrame.current !== null) window.cancelAnimationFrame(restoreFrame.current);
      for (const frame of activeFrames.current) window.cancelAnimationFrame(frame);
      for (const timer of crumbTimers.current) window.clearTimeout(timer);
      activeFrames.current.clear();
      crumbTimers.current.clear();
    };
  }, [applyMask]);

  function animateBite(id: number) {
    const start = performance.now();
    function step(now: number) {
      const raw = clamp((now - start) / BITE_DURATION, 0, 1);
      const eased = 1 - Math.pow(1 - raw, 3);
      setBites((current) => current.map((bite) =>
        bite.id === id ? { ...bite, progress: eased } : bite,
      ));
      if (raw < 1) {
        const frame = window.requestAnimationFrame(step);
        activeFrames.current.add(frame);
      }
    }
    const frame = window.requestAnimationFrame(step);
    activeFrames.current.add(frame);
  }

  function restoreBites(reducedMotion: boolean) {
    restoringRef.current = true;
    for (const frame of activeFrames.current) window.cancelAnimationFrame(frame);
    activeFrames.current.clear();
    if (reducedMotion) {
      setBites([]);
      restoringRef.current = false;
      return;
    }
    const start = performance.now();
    function step(now: number) {
      const raw = clamp((now - start) / RESTORE_DURATION, 0, 1);
      const eased = 1 - Math.pow(1 - raw, 3);
      setBites((current) => current.map((bite) => ({ ...bite, progress: 1 - eased })));
      if (raw < 1) {
        restoreFrame.current = window.requestAnimationFrame(step);
      } else {
        restoreFrame.current = null;
        setBites([]);
        restoringRef.current = false;
      }
    }
    restoreFrame.current = window.requestAnimationFrame(step);
  }

  function scatterCrumbs(x: number, y: number) {
    const next = Array.from({ length: 6 }, (_, index): Crumb => ({
      id: ++crumbIdRef.current,
      x, y,
      dx: (index - 2.5) * 7 + Math.random() * 6,
      dy: 12 + Math.random() * 18,
      size: 2 + Math.random() * 3,
      delay: index * 24,
    }));
    setCrumbs((current) => [...current, ...next].slice(-42));
    const timer = window.setTimeout(() => {
      setCrumbs((current) => current.filter((crumb) => !next.some((item) => item.id === crumb.id)));
      crumbTimers.current.delete(timer);
    }, 1100);
    crumbTimers.current.add(timer);
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    // Fora da home, a marca continua sendo um link normal para a página inicial.
    if (pathname !== "/") return;
    event.preventDefault();
    if (restoringRef.current) return;

    const word = wordRef.current;
    const link = linkRef.current;
    if (!word || !link) return;
    const rect = word.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const keyboard = event.detail === 0;
    const x = keyboard ? rect.width * 0.5 :
      clamp(event.clientX - rect.left, 0, rect.width);
    const y = keyboard ? rect.height * 0.2 :
      clamp(event.clientY - rect.top, 0, rect.height);
    const side: Side = keyboard ? "top" :
      x < rect.width * 0.13 ? "left" :
      x > rect.width * 0.87 ? "right" :
      y < rect.height * 0.5 ? "top" : "bottom";
    const radius = clamp(rect.height * (0.37 + Math.random() * 0.07), 8, 25);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const bite: Bite = {
      id: ++biteIdRef.current,
      x: x / rect.width,
      y: y / rect.height,
      side,
      radius,
      progress: reducedMotion ? 1 : 0,
    };
    setBites((current) => [...current, bite].slice(-MAX_BITES));
    if (!reducedMotion) {
      animateBite(bite.id);
      scatterCrumbs(word.offsetLeft + x, word.offsetTop + (side === "bottom" ? rect.height : 0));
    }

    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    const count = Math.min(MAX_BITES, bitesRef.current.length + 1);
    settleTimer.current = window.setTimeout(
      () => restoreBites(reducedMotion),
      count >= MAX_BITES ? 850 : 2350,
    );
  }

  return (
    <span className={[styles.wrapper, centered ? styles.centered : "", compact ? styles.compact : ""].join(" ")}>
      <Link
        aria-label="Receitando — início"
        className={styles.wordmark}
        data-testid="bite-wordmark"
        href="/"
        onClick={handleClick}
        ref={linkRef}
        title="Receitando: toque na marca para dar uma mordida"
      >
        <span className={styles.word} ref={wordRef}>receitando</span>
        <span aria-hidden="true" className={styles.crumbLayer}>
          {crumbs.map((crumb) => (
            <i
              className={styles.crumb}
              key={crumb.id}
              style={{
                left: crumb.x,
                top: crumb.y,
                width: crumb.size,
                height: crumb.size,
                "--crumb-dx": crumb.dx + "px",
                "--crumb-dy": crumb.dy + "px",
                "--crumb-delay": crumb.delay + "ms",
              } as CSSProperties}
            />
          ))}
        </span>
      </Link>
    </span>
  );
}
