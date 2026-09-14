"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AUTH_CHANGED_EVENT } from "@/services/auth-storage";
import { getPantry, PANTRY_CHANGED_EVENT, type PantryItem } from "@/services/pantry.service";

import styles from "./Header.module.css";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(dateValue: string | null): number | null {
  if (!dateValue) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return null;

  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((Date.UTC(year, month - 1, day) - todayUtc) / DAY_MS);
}

function urgentItems(items: PantryItem[]): number {
  return items.filter((item) => {
    const days = daysUntil(item.expiresAt);
    return days !== null && days <= 3;
  }).length;
}

export function HeaderPantryStatus() {
  const [items, setItems] = useState<PantryItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function syncPantry() {
      try {
        const pantry = await getPantry();
        if (!cancelled) setItems(pantry);
      } catch {
        if (!cancelled) setItems(null);
      }
    }

    void syncPantry();
    window.addEventListener(AUTH_CHANGED_EVENT, syncPantry);
    window.addEventListener(PANTRY_CHANGED_EVENT, syncPantry);

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGED_EVENT, syncPantry);
      window.removeEventListener(PANTRY_CHANGED_EVENT, syncPantry);
    };
  }, []);

  if (items === null) return null;

  const urgent = urgentItems(items);
  const label = urgent > 0
    ? `Despensa: ${items.length} ${items.length === 1 ? "item" : "itens"}, ${urgent} ${urgent === 1 ? "precisa" : "precisam"} de atenção pela validade`
    : `Despensa: ${items.length} ${items.length === 1 ? "item" : "itens"}`;

  return (
    <Link aria-label={label} className={styles.pantryStatus} href="/despensa">
      <span aria-hidden="true" className={styles.pantryStatusIcon}>▣</span>
      <span className={styles.pantryCount}>{items.length}</span>
      {urgent > 0 ? <span aria-hidden="true" className={styles.pantryUrgency} /> : null}
    </Link>
  );
}
