"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FoodAvatar } from "@/components/profile/FoodAvatar";
import { AUTH_CHANGED_EVENT, clearAuthSession, hasAuthSessionHint } from "@/services/auth-storage";
import { getCurrentUser, logout, type AuthUser } from "@/services/auth.service";

import styles from "./Header.module.css";

export function AuthControls() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function syncUser() {
      await Promise.resolve();
      if (cancelled) return;

      const hadSessionHint = hasAuthSessionHint();

      try {
        // O cookie HttpOnly é a fonte real da sessão. Consultar a API mesmo sem
        // o indicador local mantém login funcional em Safari/modo privado.
        const currentUser = await getCurrentUser();
        if (!cancelled) setUser(currentUser);
      } catch {
        if (!cancelled) {
          // Evita um ciclo de eventos: só dispara limpeza quando havia um hint.
          if (hadSessionHint) clearAuthSession();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    function handleAuthChange() {
      setIsLoading(true);
      void syncUser();
    }

    void syncUser();
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  async function handleLogout() {
    setIsSigningOut(true);

    try {
      await logout();
    } finally {
      setUser(null);
      setIsSigningOut(false);
      router.push("/");
      router.refresh();
    }
  }

  if (isLoading) {
    return <span className={styles.authPlaceholder} aria-hidden="true" />;
  }

  if (!user) {
    return (
      <Link aria-label="Entrar" className={styles.login} href="/entrar">
        Entrar
      </Link>
    );
  }

  const firstName = user.name.trim().split(/\s+/)[0] || "Conta";

  return (
    <div className={styles.account}>
      <Link className={styles.accountName} href="/conta" aria-label={`Abrir perfil de ${firstName}`}>
        <FoodAvatar
          avatarKey={user.avatarKey}
          className={styles.accountAvatar}
          label={`Avatar de ${firstName}`}
        />
        <span className={styles.accountCopy}>
          <strong>Olá, {firstName}</strong>
          <small>{user.handle ? `@${user.handle}` : "Meu perfil"}</small>
        </span>
        <span className={styles.accountArrow} aria-hidden="true">›</span>
      </Link>
      <button
        className={styles.logout}
        disabled={isSigningOut}
        onClick={handleLogout}
        type="button"
      >
        {isSigningOut ? "Saindo…" : "Sair"}
      </button>
    </div>
  );
}
