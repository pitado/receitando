import Link from "next/link";

import styles from "./Header.module.css";

const links = [
  { href: "/receitas", label: "Receitas" },
  { href: "/despensa", label: "Despensa" },
  { href: "/favoritos", label: "Favoritos" },
];

export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link aria-label="Receitando — página inicial" className={styles.brand} href="/">
          <span aria-hidden="true" className={styles.brandMark}>
            R
          </span>
          Receitando
        </Link>

        <nav aria-label="Navegação principal" className={styles.navigation}>
          {links.map((link) => (
            <Link className={styles.navLink} href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <Link aria-label="Entrar — disponível em breve" className={styles.login} href="/favoritos">
          Entrar
        </Link>
      </div>
    </header>
  );
}
