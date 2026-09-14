"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { MouseEvent } from "react";

import styles from "./RecipeCard.module.css";

type TransitionDocument = Document & {
  startViewTransition?: (callback: () => Promise<void> | void) => { finished: Promise<void> };
};

type RecipeTransitionLinkProps = {
  href: string;
  title: string;
};

function waitForRoute(pathname: string) {
  return new Promise<void>((resolve) => {
    const started = performance.now();
    function check() {
      if (window.location.pathname === pathname || performance.now() - started > 1200) {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
        return;
      }
      window.requestAnimationFrame(check);
    }
    check();
  });
}

export function RecipeTransitionLink({ href, title }: RecipeTransitionLinkProps) {
  const router = useRouter();

  useEffect(() => {
    router.prefetch(href);
  }, [href, router]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    const transitionDocument = document as TransitionDocument;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!transitionDocument.startViewTransition || reduceMotion) {
      event.preventDefault();
      router.push(href);
      return;
    }

    event.preventDefault();
    try {
      transitionDocument.startViewTransition(async () => {
        router.push(href);
        await waitForRoute(new URL(href, window.location.href).pathname);
      });
    } catch {
      router.push(href);
    }
  }

  return <a aria-label={`Abrir receita ${title}`} className={styles.cardOverlay} href={href} onClick={handleClick} />;
}
