import type { Metadata } from "next";

import { SectionTitle } from "@/components/ui/SectionTitle";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Despensa",
  description: "Visualize os ingredientes guardados na sua despensa.",
};

const pantryItems = [
  { name: "Ovos", quantity: "6 unidades", freshness: "na geladeira" },
  { name: "Banana", quantity: "4 unidades", freshness: "na fruteira" },
  { name: "Leite", quantity: "1 litro", freshness: "na geladeira" },
];

export default function PantryPage() {
  return (
    <div className={`container page-shell ${styles.page}`}>
      <SectionTitle
        as="h1"
        description="Sua despensa vai guardar os ingredientes que você possui em casa. Por enquanto, esta é uma prévia de como ela funcionará."
        eyebrow="Em breve, conectada à sua conta"
      >
        Tudo o que já mora na sua cozinha
      </SectionTitle>

      <section aria-labelledby="pantry-preview-title" className={styles.preview}>
        <div className={styles.previewHeader}>
          <div>
            <p>Prévia da despensa</p>
            <h2 id="pantry-preview-title">Ingredientes disponíveis</h2>
          </div>
          <span>3 itens</span>
        </div>

        <ul className={styles.items}>
          {pantryItems.map((item, index) => (
            <li key={item.name}>
              <span aria-hidden="true" className={styles.itemNumber}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>{item.name}</strong>
                <span>{item.freshness}</span>
              </div>
              <p>{item.quantity}</p>
            </li>
          ))}
        </ul>

        <p className={styles.notice}>
          Estes dados são ilustrativos. Quantidades, validade e conta do usuário
          serão conectadas em uma próxima etapa.
        </p>
      </section>
    </div>
  );
}
