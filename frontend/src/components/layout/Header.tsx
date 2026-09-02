import Link from "next/link";

import { AuthControls } from "./AuthControls";
import { InteractiveBrand } from "./InteractiveBrand";
import styles from "./Header.module.css";

const links = [
  { href: "/receitas", label: "Receitas" },
  { href: "/combinar", label: "Combinar" },
  { href: "/despensa", label: "Despensa" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/enviar-receita", label: "Enviar receita" },
];

export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandSlot}>
          <InteractiveBrand />
        </div>

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
