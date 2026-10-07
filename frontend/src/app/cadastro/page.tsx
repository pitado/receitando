import type { Metadata } from "next";

import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta no Receitando.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
