"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AuthControls } from "./AuthControls";
import { GlobalHeaderSearch } from "./GlobalHeaderSearch";
import { HeaderNav, MobileBottomNav } from "./HeaderNav";
import { HeaderPantryStatus } from "./HeaderPantryStatus";
import styles from "./Header.module.css";

export function Header() {
  const pathname = usePathname();
  const [hiddenOnMobile, setHiddenOnMobile] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    function updateHeader() {
      ticking = false;
      const mobile = window.matchMedia("(max-width: 48rem)").matches;
      const currentY = window.scrollY;

      if (!mobile) {
        setHiddenOnMobile(false);
        lastScrollY.current = currentY;
        return;
      }

      const delta = currentY - lastScrollY.current;
      if (Math.abs(delta) < 8) return;

      if (currentY < 56 || delta < 0) setHiddenOnMobile(false);
      else if (delta > 0) setHiddenOnMobile(true);

      lastScrollY.current = currentY;
    }

    function handleScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateHeader);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className={`${styles.header} ${hiddenOnMobile ? styles.headerHidden : ""}`}>
        <div className={`container ${styles.inner}`}>
          <Link aria-label="Receitando — início" className={styles.brand} href="/">
            <span className={styles.brandWord}>Receitando</span>
            {pathname === "/" ? <span className={styles.brandTag}>cozinha possível</span> : null}
          </Link>

          <HeaderNav />
          <GlobalHeaderSearch />

          <div className={styles.headerActions}>
            <HeaderPantryStatus />
            <Link className={styles.submitRecipe} href="/enviar-receita">
              <span aria-hidden="true">+</span>
              <span className={styles.submitRecipeLabel}>Enviar receita</span>
            </Link>
            <AuthControls />
          </div>
        </div>
      </header>

      <MobileBottomNav />
      <div aria-hidden="true" className={styles.mobileNavSpacer} />
    </>
  );
}
