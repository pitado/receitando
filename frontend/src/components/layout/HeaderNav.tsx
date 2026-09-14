"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import styles from "./Header.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

const links: NavItem[] = [
  {
    href: "/receitas",
    label: "Receitas",
    icon: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 4.5h14v15H5zM8 8h8M8 12h8M8 16h5" /></svg>,
  },
  {
    href: "/combinar",
    label: "Combinar",
    icon: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 5v14M17 5v14M4 9h6M14 15h6" /></svg>,
  },
  {
    href: "/despensa",
    label: "Despensa",
    icon: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 8h14v11H5zM7 5h10v3M9 12h6" /></svg>,
  },
  {
    href: "/favoritos",
    label: "Favoritos",
    icon: <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 19s-7-4.2-7-9.1A3.9 3.9 0 0 1 12 7.4a3.9 3.9 0 0 1 7 2.5C19 14.8 12 19 12 19Z" /></svg>,
  },
];

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className={styles.desktopNavigation}>
      {links.map((link) => {
        const active = isCurrent(pathname, link.href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
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

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação móvel" className={styles.bottomNavigation}>
      {links.map((link) => {
        const active = isCurrent(pathname, link.href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`${styles.bottomNavLink} ${active ? styles.bottomNavLinkActive : ""}`}
            href={link.href}
            key={link.href}
          >
            <span className={styles.bottomNavIcon}>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
