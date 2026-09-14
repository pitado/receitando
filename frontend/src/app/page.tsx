import Link from "next/link";

import { HomeHero } from "@/components/home/HomeHero";
import { HomeLiveSections } from "@/components/home/HomeLiveSections";

import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <HomeHero />

      <section aria-label="Ideias da cozinha" className={styles.editorialRibbon}>
        <div className={`container ${styles.ribbonGrid}`}>
          <article className={`${styles.kitchenNote} ${styles.noteWarm}`}>
            <span className={styles.miniEyebrow}>Saiu da despensa</span>
            <strong>um jantar possível</strong>
            <p>Às vezes a receita já estava aí. Faltava só juntar os pontos.</p>
            <span aria-hidden="true" className={styles.tomatoArt}><i /></span>
          </article>

          <article className={`${styles.kitchenNote} ${styles.noteLight}`}>
            <span className={styles.miniEyebrow}>Tá quase no ponto</span>
            <strong>falta só uma coisinha</strong>
            <p>O Receitando mostra o que já combina e o que ainda está faltando.</p>
            <span aria-hidden="true" className={styles.eggArt}><i /></span>
          </article>

          <article className={`${styles.kitchenNote} ${styles.noteGreen}`}>
            <span className={styles.miniEyebrow}>Hoje dá para fazer</span>
            <strong>com o que já tem</strong>
            <p>Menos lista de compras. Mais ideia para aproveitar a cozinha.</p>
            <span aria-hidden="true" className={styles.leafArt}><i /></span>
          </article>
        </div>
      </section>

      <HomeLiveSections />

      <section className={styles.communityCta}>
        <div className={`container ${styles.communityInner}`}>
          <div>
            <p className={styles.communityEyebrow}>Da sua cozinha para a comunidade</p>
            <h2>Tem uma receita que merece circular?</h2>
            <p>Compartilhe o prato que funciona na sua casa. Depois da revisão, ele pode entrar no catálogo e ganhar novas pitadas de outros cozinheiros.</p>
          </div>
          <Link href="/enviar-receita">Enviar minha receita <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </div>
  );
}
