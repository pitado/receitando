import Link from "next/link";

import { IngredientMatcher } from "@/components/ingredient/IngredientMatcher";
import { SectionTitle } from "@/components/ui/SectionTitle";

import styles from "./page.module.css";

export default function HomePage() {
  return (
    <>
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

      <section className={styles.matcherSection} id="ingredientes">
        <div className="container">
          <SectionTitle
            description="Adicione os ingredientes disponíveis. Nós comparamos com as receitas e mostramos as melhores combinações primeiro."
            eyebrow="Comece por aqui"
          >
            O que tem na sua cozinha?
          </SectionTitle>
          <IngredientMatcher />
        </div>
      </section>

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
    </>
  );
}
