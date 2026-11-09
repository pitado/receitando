import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { CookTogetherButton } from "@/components/recipe/CookTogetherButton";
import { RecipeArtwork } from "@/components/art/RecipeArtwork";
import { FavoriteButton } from "@/components/recipe/FavoriteButton";
import { RecipeActions } from "@/components/recipe/RecipeActions";
import { RecipeAdapter } from "@/components/recipe/RecipeAdapter";
import { RecipeCommunity } from "@/components/recipe/RecipeCommunity";
import { RecipeShoppingList } from "@/components/recipe/RecipeShoppingList";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatIngredientAmount, formatPrepTime } from "@/lib/format";
import { ApiError } from "@/services/api-client";
import { getRecipeBySlug } from "@/services/recipes.service";
import type { Recipe, RecipeDifficulty } from "@/types/recipe";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";
const BASE_URL = "https://receitando.miguelpita.com.br";
function cleanSnippet(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
}

function recipeSearchDescription(recipe: Recipe): string {
  const title = cleanSnippet(recipe.title);
  const raw = cleanSnippet(recipe.description || "");
  // Evita usar listas de etapas e marcadores de preparo como descrição de busca.
  const usable = raw && !/^(modo de preparo|ingredientes|\\d+[.)]|passo a passo\\s*[:;])/i.test(raw)
    ? raw.split(/(?:modo de preparo|ingredientes)\\s*[:;]/i)[0].trim()
    : "";
  const intro = usable.length >= 35 ? usable : `Aprenda a fazer ${title} em casa com ingredientes e modo de preparo explicados passo a passo.`;
  const extra = recipe.prepMinutes > 0 ? ` Pronto em ${recipe.prepMinutes} minutos.` : "";
  return (intro + extra).slice(0, 158).trim();
}

export async function generateMetadata({ params }: RecipeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const recipe = await getRecipeBySlug(slug);
    const description = recipeSearchDescription(recipe);
    const url = `${BASE_URL}/receitas/${encodeURIComponent(recipe.slug)}`;
    return {
      title: recipe.title,
      description,
      alternates: { canonical: url },
      openGraph: { title: `${recipe.title} | Receitando`, siteName: "Receitando", description, url, type: "article", locale: "pt_BR", images: recipe.imageUrl ? [{ url: recipe.imageUrl, alt: recipe.title }] : undefined },
      twitter: { card: "summary_large_image", title: recipe.title, description, images: recipe.imageUrl ? [recipe.imageUrl] : undefined },
      robots: { index: true, follow: true },
    };
  } catch {
    return { title: "Receita não encontrada", robots: { index: false, follow: true } };
  }
}
interface RecipeDetailPageProps { params: Promise<{ slug: string }>; }
const difficultyLabels: Record<RecipeDifficulty, string> = { FACIL: "Fácil", MEDIA: "Média", DIFICIL: "Difícil" };

function getInstructionSteps(instructions: Recipe["instructions"]): string[] {
  const rawSteps = Array.isArray(instructions) ? instructions : instructions.split(/\r?\n/);
  return rawSteps.map((step) => step.trim().replace(/^\d+[.)]\s*/, "")).filter(Boolean);
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { slug } = await params;
  let recipe: Recipe | null = null;
  try { recipe = await getRecipeBySlug(slug); } catch (error: unknown) { if (error instanceof ApiError && error.status === 404) notFound(); }
  if (!recipe) return <div className="container page-shell"><ErrorState message="Não foi possível abrir esta receita agora. Confira se a API está ligada e tente novamente." /></div>;

  const instructionSteps = getInstructionSteps(recipe.instructions);
  const isExternalRecipe = Boolean(recipe.source.externalSource || recipe.source.url);
  const imageAttribution = recipe.image;
  const hasImageCredit = Boolean(recipe.imageUrl && (imageAttribution?.author || imageAttribution?.source || imageAttribution?.license || imageAttribution?.pageUrl));
  const transitionStyle = recipe.imageUrl ? ({ viewTransitionName: `recipe-image-${recipe.id}` } as CSSProperties) : undefined;

  const structuredRecipe = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipeSearchDescription(recipe),
    url: `${BASE_URL}/receitas/${encodeURIComponent(recipe.slug)}`,
    ...(recipe.imageUrl ? { image: [recipe.imageUrl] } : {}),
    ...(recipe.prepMinutes > 0 ? { totalTime: `PT${recipe.prepMinutes}M` } : {}),
    ...(recipe.servings > 0 ? { recipeYield: `${recipe.servings} porções` } : {}),
    recipeIngredient: recipe.ingredients.map((item) => item.rawText || [item.quantity, item.unit, item.name].filter(Boolean).join(" ")),
    recipeInstructions: instructionSteps.map((text) => ({ "@type": "HowToStep", text })),
    ...(recipe.source.author ? { author: { "@type": "Person", name: recipe.source.author } } : {}),
  };
  return (
    <article className={`container page-shell ${styles.page}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredRecipe).replace(/</g, "\\u003c") }} />
      <nav aria-label="Navegação estrutural" className={styles.breadcrumb}><Link href="/receitas">Receitas</Link><span aria-hidden="true">/</span><span aria-current="page">{recipe.title}</span></nav>
      <header className={styles.header}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>{recipe.mealType} · {isExternalRecipe ? "Receita de fonte externa" : difficultyLabels[recipe.difficulty]}</p>
          <div className={styles.titleRow}><h1>{recipe.title}</h1><FavoriteButton recipeId={recipe.id} /></div>
          <p className={styles.description}>{recipe.description}</p>
          <RecipeActions steps={instructionSteps} title={recipe.title} />
          <CookTogetherButton slug={recipe.slug} title={recipe.title} steps={instructionSteps} />
          <dl className={styles.facts}>
            {recipe.prepMinutes > 0 ? <div><dt>Preparo</dt><dd>{formatPrepTime(recipe.prepMinutes)}</dd></div> : null}
            {recipe.servings > 0 ? <div><dt>Rendimento</dt><dd>{recipe.servings} {recipe.servings === 1 ? "porção" : "porções"}</dd></div> : null}
            {!isExternalRecipe ? <div><dt>Dificuldade</dt><dd>{difficultyLabels[recipe.difficulty]}</dd></div> : null}
            <div><dt>Origem</dt><dd>{recipe.source.url ? <a href={recipe.source.url} rel="noreferrer" target="_blank">{recipe.source.name} <RecipeArtwork kind="arrow" size={14} /></a> : recipe.source.name}</dd></div>
          </dl>
          {recipe.source.license ? <p className={styles.sourceNote}>Fonte atribuída a {recipe.source.author || recipe.source.name}. Conteúdo sob {recipe.source.license}{recipe.source.licenseUrl ? <> · <a href={recipe.source.licenseUrl} rel="noreferrer" target="_blank">ver licença <RecipeArtwork kind="arrow" size={14} /></a></> : null}.</p> : null}
          {recipe.tags.length > 0 ? <div className={styles.tags}>{recipe.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
        </div>
        <div aria-label={`Foto de ${recipe.title}`} className={styles.visual} style={transitionStyle}>
          {recipe.imageUrl ? <><Image alt={imageAttribution?.alt || recipe.title} className={styles.recipeImage} fill sizes="(min-width: 800px) 45vw, 100vw" src={recipe.imageUrl} />{hasImageCredit ? <p className={styles.imageCredit}>Imagem: {imageAttribution?.author || imageAttribution?.source || "Wikimedia Commons"}{imageAttribution?.pageUrl ? <> · <a href={imageAttribution.pageUrl} rel="noreferrer" target="_blank">fonte <RecipeArtwork kind="arrow" size={14} /></a></> : null}{imageAttribution?.license ? <> · {imageAttribution.license}</> : null}{imageAttribution?.licenseUrl ? <> · <a href={imageAttribution.licenseUrl} rel="noreferrer" target="_blank">licença <RecipeArtwork kind="arrow" size={14} /></a></> : null}</p> : null}</> : <><span className={styles.plate}><span /></span><p>Feita com o que já mora na sua cozinha.</p></>}
        </div>
      </header>

      <div className={styles.content}>
        <section aria-labelledby="ingredients-title" className={styles.ingredients}><p className={styles.sectionNumber}>01</p><h2 id="ingredients-title">Ingredientes</h2><ul>{recipe.ingredients.map((item) => { const amount = formatIngredientAmount(item.quantity, item.unit); return <li key={item.ingredientId}><span className={styles.check} aria-hidden="true" /><span><strong>{isExternalRecipe && item.rawText ? item.rawText : item.name}</strong>{isExternalRecipe && item.rawText ? null : <small>{item.rawText || amount || "a gosto"}{item.optional ? " · opcional" : ""}</small>}</span></li>; })}</ul></section>
        <section aria-labelledby="instructions-title" className={styles.instructions}><p className={styles.sectionNumber}>02</p><h2 id="instructions-title">Modo de preparo</h2>{instructionSteps.length > 0 ? <ol>{instructionSteps.map((step, index) => <li key={`${index}-${step}`}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol> : <p className={styles.noInstructions}>O modo de preparo desta receita será adicionado em breve.</p>}</section>
      </div>
      <section aria-label="Ferramentas da receita" className={styles.tools}><RecipeShoppingList ingredients={recipe.ingredients} /><RecipeAdapter ingredients={recipe.ingredients} recipeSlug={recipe.slug} servings={recipe.servings} /></section>
      <RecipeCommunity recipeId={recipe.id} />
    </article>
  );
}
