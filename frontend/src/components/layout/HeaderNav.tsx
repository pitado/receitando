"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./Header.module.css";

const links = [
  { href: "/receitas", label: "Receitas" },
  { href: "/combinar", label: "Combinar" },
  { href: "/despensa", label: "Despensa" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/enviar-receita", label: "Enviar receita" },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className={styles.navigation}>
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
