import Image from "next/image";

import { HomeHero } from "@/components/home/HomeHero";
import { HomeLiveSections } from "@/components/home/HomeLiveSections";
import { SectionTitle } from "@/components/ui/SectionTitle";

import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <HomeHero />

      <section
        aria-label="Ideias da cozinha"
        className={styles.editorialRibbon}
        style={{ position: "relative" }}
      >
        <div
          aria-hidden="true"
          style={{
            left: "0.75rem",
            opacity: 0.5,
            pointerEvents: "none",
            position: "absolute",
            top: "1rem",
            transform: "rotate(-7deg)",
            width: "clamp(10rem, 15vw, 15rem)",
            zIndex: 0,
          }}
        >
          <Image
            alt=""
            height={635}
            src="/receitando-beet.webp"
            style={{ display: "block", height: "auto", width: "100%" }}
            width={408}
          />
        </div>

        <div
          className={`container ${styles.ribbonGrid}`}
          style={{ position: "relative", zIndex: 1 }}
        >
          <article className={`${styles.kitchenNote} ${styles.noteWarm}`}>
            <span className={styles.miniEyebrow}>Saiu da despensa</span>
            <strong>um jantar possível</strong>
            <p>Às vezes a receita já estava aí. Faltava só juntar os pontos.</p>
            <span aria-hidden="true" className={styles.tomatoArt}>
              <i />
            </span>
          </article>

          <article className={`${styles.kitchenNote} ${styles.noteLight}`}>
            <span className={styles.miniEyebrow}>Tá quase no ponto</span>
            <strong>falta só uma coisinha</strong>
            <p>O Receitando mostra o que já combina e o que ainda está faltando.</p>
            <span aria-hidden="true" className={styles.eggArt}>
              <i />
            </span>
          </article>

          <article className={`${styles.kitchenNote} ${styles.noteGreen}`}>
            <span className={styles.miniEyebrow}>Hoje dá para fazer</span>
            <strong>com o que já tem</strong>
            <p>Menos lista de compras. Mais ideia para aproveitar a cozinha.</p>
            <span aria-hidden="true" className={styles.leafArt}>
              <i />
            </span>
          </article>
        </div>
      </section>

      <HomeLiveSections />

      <section className={styles.howItWorks}>
        <div className="container">
          <SectionTitle align="center" eyebrow="Simples de usar">
            Da despensa para o prato
          </SectionTitle>
          <ol className={styles.steps}>
            <li className={styles.step}>
              <span>1</span>
              <strong>Conte o que você tem</strong>
              <p>Digite os ingredientes disponíveis em casa.</p>
            </li>
            <li className={styles.step}>
              <span>2</span>
              <strong>Compare as possibilidades</strong>
              <p>Veja a compatibilidade e o que ainda está faltando.</p>
            </li>
            <li className={styles.step}>
              <span>3</span>
              <strong>Escolha e cozinhe</strong>
              <p>Abra a receita completa e coloque a mão na massa.</p>
            </li>
          </ol>
        </div>
      </section>
    </main>
  );
}
