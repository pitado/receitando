"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { FoodAvatar } from "@/components/profile/FoodAvatar";
import { AUTH_CHANGED_EVENT, clearAuthSession, hasAuthSessionHint } from "@/services/auth-storage";
import { getCurrentUser, logout, type AuthUser } from "@/services/auth.service";

import styles from "./HomeHeader.module.css";

type HomeAccountMenuProps = {
  searchOpen: boolean;
  onOpen: () => void;
};

export function HomeAccountMenu({ searchOpen, onOpen }: HomeAccountMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const generation = useRef(0);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const syncUser = async () => {
      const current = ++generation.current;
      const hadHint = hasAuthSessionHint();
      try {
        // Cookie HttpOnly é a sessão real, mesmo quando o indicador local sumiu.
        const result = await getCurrentUser();
        if (active && generation.current === current) setUser(result);
      } catch (cause) {
        if (active && generation.current === current) {
          setUser(null);
          if (hadHint && typeof cause === "object" && cause !== null && "status" in cause && cause.status === 401) {
            clearAuthSession();
          }
        }
      } finally {
        if (active && generation.current === current) setLoading(false);
      }
    };

    void syncUser();
    window.addEventListener(AUTH_CHANGED_EVENT, syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      active = false;
      generation.current += 1;
      window.removeEventListener(AUTH_CHANGED_EVENT, syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  useEffect(() => {
    if (searchOpen) setMenuOpen(false);
  }, [searchOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  async function endSession(destination: "/" | "/entrar") {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      // A troca de conta exige encerramento da sessão atual no servidor.
      await logout();
      setMenuOpen(false);
      window.location.assign(destination);
    } catch {
      // Não fingir que saiu: o cookie pode continuar válido em falhas de rede.
      setError("Não foi possível encerrar a sessão. Tente novamente.");
      setBusy(false);
    }
  }

  if (loading) {
    return <span className={styles.profilePlaceholder} aria-hidden="true" />;
  }

  if (!user) {
    return (
      <Link className={styles.profileLogin} href="/entrar" aria-label="Entrar na minha conta" title="Entrar na conta">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
        </svg>
        <span className={styles.profileLoginLabel}>Entrar</span>
      </Link>
    );
  }

  return (
    <div className={styles.profileRoot} ref={rootRef}>
      <button
        aria-expanded={menuOpen}
        aria-controls="receitando-profile-menu"
        aria-label={user.handle ? "Conta @" + user.handle : "Abrir minha conta"}
        className={styles.profileTrigger}
        onClick={() => {
          if (!menuOpen) onOpen();
          setMenuOpen((current) => !current);
          setError("");
        }}
        ref={triggerRef}
        type="button"
      >
        <FoodAvatar avatarKey={user.avatarKey} className={styles.profileAvatar} label={"Avatar de " + user.name} />
        <span className={styles.profileLabel}>{user.handle ? "@" + user.handle : user.name.split(/\s+/)[0]}</span>
        <svg className={styles.profileChevron} aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m4 6 4 4 4-4" /></svg>
      </button>

      {menuOpen ? (
        <div className={styles.profileMenu} id="receitando-profile-menu">
          <div className={styles.profileMenuHeader}>
            <FoodAvatar avatarKey={user.avatarKey} className={styles.profileMenuAvatar} label={"Avatar de " + user.name} />
            <div>
              <strong>{user.name}</strong>
              <span>{user.handle ? "@" + user.handle : "Definir meu @"}</span>
            </div>
          </div>
          <nav aria-label="Opções da conta" className={styles.profileMenuLinks}>
            <Link href="/conta" onClick={() => setMenuOpen(false)}>Meu perfil</Link>
            <Link href="/conta?editar=1" onClick={() => setMenuOpen(false)}>Editar @ e avatar</Link>
            <Link href="/favoritos" onClick={() => setMenuOpen(false)}>Minhas favoritas</Link>
          </nav>
          <div className={styles.profileMenuActions}>
            <button type="button" onClick={() => void endSession("/entrar")} disabled={busy}>Trocar de conta</button>
            <button type="button" onClick={() => void endSession("/")} disabled={busy}>{busy ? "Saindo…" : "Sair da conta"}</button>
            {error ? <p role="alert">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
