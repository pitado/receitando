"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./Footer.module.css";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/cadastro" || pathname === "/recuperar-senha" || pathname === "/despensa" || pathname === "/receitas") {
    return null;
  }

  if (pathname === "/") {
    return (
      <footer className={styles.homeFooter}>
        <div className={"home-container " + styles.homeInner}>
          <div className={styles.homeBrandBlock}>
            <Link className={styles.homeBrand} href="/">receitando</Link>
            <p>Menos desperdício, mais comida boa com o que já mora na sua cozinha.</p>
          </div>

          <nav aria-label="Navegação do rodapé" className={styles.homeLinks}>
            <Link href="/receitas">Receitas</Link>
            <Link href="/combinar">Combinar</Link>
            <Link href="/despensa">Despensa</Link>
            <Link href="/favoritos">Favoritos</Link>
          </nav>

          <p className={styles.homeCopyright}>© 2026 Receitando. Um projeto acadêmico feito para cozinhas reais.</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className={styles.footer}>
      <div className={"container " + styles.inner}>
        <div className={styles.brandBlock}>
          <Link className={styles.brand} href="/">
            Receitando
          </Link>
          <p className={styles.description}>
            Menos desperdício, mais comida boa com o que já mora na sua cozinha.
          </p>
        </div>

        <nav aria-label="Navegação do rodapé" className={styles.links}>
          <Link className={styles.link} href="/receitas">
            Receitas
          </Link>
          <Link className={styles.link} href="/despensa">
            Despensa
          </Link>
          <Link className={styles.link} href="/favoritos">
            Favoritos
          </Link>
        </nav>

        <p className={styles.copyright}>
          © {new Date().getFullYear()} Receitando. Um projeto acadêmico feito para cozinhas reais.
        </p>
      </div>
    </footer>
  );
}
