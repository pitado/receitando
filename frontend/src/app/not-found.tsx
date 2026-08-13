import Link from "next/link";

import { EmptyState } from "@/components/ui/EmptyState";

import styles from "./system.module.css";

export default function NotFoundPage() {
  return (
    <div className={`container ${styles.statePage}`}>
      <EmptyState
        action={
          <Link className={styles.action} href="/receitas">
            Voltar para receitas
          </Link>
        }
        description="A página ou receita que você procurou não está disponível."
        icon="404"
        title="Não encontramos essa página"
      />
    </div>
  );
}
