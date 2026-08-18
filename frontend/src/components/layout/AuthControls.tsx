"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AUTH_CHANGED_EVENT, clearAuthToken, getAuthToken } from "@/services/auth-storage";
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

      const token = getAuthToken();

      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (!cancelled) setUser(currentUser);
      } catch {
        if (!cancelled) {
          clearAuthToken();
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
      <Link className={styles.accountName} href="/conta" aria-label={`Abrir conta de ${firstName}`}>
        Olá, {firstName}
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
