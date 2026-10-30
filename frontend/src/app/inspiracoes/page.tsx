import type { Metadata } from "next";
import Link from "next/link";
import { apiRequest } from "@/services/api-client";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Inspirações brasileiras",
  description: "Explore receitas em sites brasileiros com crédito e link para a publicação original."
};

type Reference = {
  id: string;
  title: string;
  category: string;
  sourceName: string;
  sourceUrl: string;
  sourceAuthor: string | null;
  termsUrl: string;
  rights: "link_only";
};

export default async function InspirationsPage() {
  let references: Reference[] = [];
  let loadFailed = false;
  try {
    const response = await apiRequest<{ items: Reference[] }>("/api/recipe-references?limit=60");
    references = response.items;
  } catch {
    loadFailed = true;
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link className={styles.back} href="/receitas">← Voltar às receitas</Link>
        <div className={styles.hero}>
          <span className={styles.eyebrow}>Inspirações externas • Brasil</span>
          <h1>Outras cozinhas, <em>novas ideias.</em></h1>
          <p>Descubra receitas em sites brasileiros. Para ler os ingredientes e o preparo, você visita diretamente a fonte responsável pelo conteúdo.</p>
          <p className={styles.legal}>Os links são indicações editoriais. Não copiamos fotografias, textos ou modos de preparo de terceiros sem licença.</p>
        </div>
        {loadFailed ? <p role="alert" className={styles.status}>Não conseguimos carregar as referências agora.</p> : null}
        {!loadFailed && references.length === 0 ? <p className={styles.status}>Ainda não há referências disponíveis.</p> : null}
        <div className={styles.grid}>
          {references.map((recipe) => (
            <article className={styles.card} key={recipe.id}>
              <div className={styles.cardTop}>
                <span className={styles.category}>{recipe.category}</span>
                <span className={styles.source}>{recipe.sourceName}</span>
              </div>
              <div className={styles.illustration} aria-hidden="true">✦</div>
              <h2>{recipe.title}</h2>
              {recipe.sourceAuthor ? <p className={styles.credit}>Crédito: {recipe.sourceAuthor}</p> : <p className={styles.credit}>Fonte: {recipe.sourceName}</p>}
              <p className={styles.legalShort}>Conteúdo original no site da fonte.</p>
              <a className={styles.open} href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">Ver receita original ↗</a>
            </article>
          ))}
        </div>
        <p className={styles.footer}>Conhece uma receita sua para compartilhar? <Link href="/enviar-receita">Envie ao Receitando</Link>. Publicamos receitas completas somente com direitos de uso verificados.</p>
      </div>
    </main>
  );
}
