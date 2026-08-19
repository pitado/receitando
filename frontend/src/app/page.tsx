import Image from "next/image";
import Link from "next/link";

import { HomeLiveSections } from "@/components/home/HomeLiveSections";
import { SectionTitle } from "@/components/ui/SectionTitle";

import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section
        className={styles.hero}
        style={{
          background:
            "radial-gradient(ellipse at 16% 48%, rgba(226, 154, 122, 0.28) 0%, rgba(244, 199, 177, 0.16) 30%, rgba(255, 246, 233, 0) 66%), radial-gradient(ellipse at 94% 20%, rgba(226, 154, 122, 0.2) 0%, rgba(244, 199, 177, 0.12) 30%, rgba(255, 246, 233, 0) 64%)",
        }}
      >
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Sua cozinha, novas possibilidades</p>
            <h1 className={styles.title}>
              Você já tem os ingredientes. <em>Faltava a receita.</em>
            </h1>
            <p className={styles.description}>
              Diga o que tem em casa. O Receitando encontra receitas possíveis,
              mostra o que está faltando e ajuda você a aproveitar melhor os
              alimentos.
            </p>
            <Link className={styles.cta} href="/combinar">
              Ver o que posso fazer
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div aria-hidden="true" className={styles.heroVisual}>
            <div className={styles.note}>
              <span className={styles.noteLabel}>Hoje dá para fazer</span>
              <strong>algo gostoso</strong>
              <span>com o que já está na despensa.</span>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Ideias da cozinha"
        className={styles.editorialRibbon}
        style={{ position: "relative" }}
      >
        <div
          aria-hidden="true"
          style={{
            left: "-3.5rem",
            opacity: 0.34,
            pointerEvents: "none",
            position: "absolute",
            top: "-6.5rem",
            transform: "rotate(-8deg)",
            width: "min(12rem, 34vw)",
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
