import type { Metadata } from "next";

import { RecoveryForm } from "./RecoveryForm";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Receba um código por e-mail para redefinir sua senha do Receitando.",
};

export default function RecoverPasswordPage() {
  return <RecoveryForm />;
}
