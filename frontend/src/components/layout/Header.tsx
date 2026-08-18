import Image from "next/image";
import Link from "next/link";

import { AuthControls } from "./AuthControls";
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
          <Image
            alt="Receitando"
            className={styles.brandLogo}
            height={110}
            priority
            src="/receitando-logo.svg"
            width={520}
          />
        </Link>

        <nav aria-label="Navegação principal" className={styles.navigation}>
          {links.map((link) => (
            <Link className={styles.navLink} href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <AuthControls />
      </div>
    </header>
  );
}
