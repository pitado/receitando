import type { Metadata } from "next";

import { PantryClient } from "./PantryClient";

export const metadata: Metadata = {
  title: "Despensa",
  description: "Guarde os ingredientes que você possui em casa.",
};

export default function PantryPage() {
  return <PantryClient />;
}
