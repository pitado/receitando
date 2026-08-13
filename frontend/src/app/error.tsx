"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/ErrorState";

import styles from "./system.module.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={`container ${styles.statePage}`}>
      <ErrorState
        message="Não foi possível abrir esta página agora. Tente novamente."
        onRetry={reset}
      />
    </div>
  );
}
