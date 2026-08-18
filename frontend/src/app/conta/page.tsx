import type { Metadata } from "next";

import { AccountClient } from "./AccountClient";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Sua conta e seus atalhos no Receitando.",
};

export default function AccountPage() {
  return (
    <main className={`container page-shell ${styles.page}`}>
      <AccountClient />
    </main>
  );
}
