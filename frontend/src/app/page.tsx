import Link from "next/link";

import { HomeLiveSections } from "@/components/home/HomeLiveSections";
import { IngredientMatcher } from "@/components/ingredient/IngredientMatcher";
import { SectionTitle } from "@/components/ui/SectionTitle";

import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
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
            <Link className={styles.cta} href="#ingredientes">
              Ver o que posso fazer
              <span aria-hidden="true">↓</span>
            </Link>
          </div>

          <div aria-hidden="true" className={styles.heroVisual}>
            <div className={styles.note}>
              <span className={styles.noteLabel}>Hoje dá para fazer</span>
              <strong>algo gostoso</strong>
              <span>com o que já está na despensa.</span>
            </div>
            <span className={`${styles.ingredientShape} ${styles.shapeOne}`} />
            <span className={`${styles.ingredientShape} ${styles.shapeTwo}`} />
            <span className={`${styles.ingredientShape} ${styles.shapeThree}`} />
          </div>
        </div>
      </section>

      <section aria-label="Ideias da cozinha" className={styles.editorialRibbon}>
        <div className={`container ${styles.ribbonGrid}`}>
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

      <section className={styles.matcherSection} id="ingredientes">
        <div className={`container ${styles.matcherShell}`}>
          <div className={styles.matcherIntro}>
            <SectionTitle
              description="Adicione os ingredientes disponíveis. Aqui mostramos só as melhores ideias; a busca completa fica na página Combinar."
              eyebrow="Comece por aqui"
            >
              O que tem na sua cozinha?
            </SectionTitle>

            <div aria-hidden="true" className={styles.matcherSketch}>
              <span className={styles.sketchPlate}>
                <i />
              </span>
              <span className={styles.sketchCard}>
                <small>3 ingredientes</small>
                <strong>já viram ideia</strong>
              </span>
            </div>
          </div>
          <div className={styles.matcherCard}>
            <IngredientMatcher previewLimit={3} />
          </div>
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
