"use client";

import { FormEvent, useEffect, useState } from "react";

import { FoodAvatar } from "@/components/profile/FoodAvatar";
import { getAuthToken } from "@/services/auth-storage";
import {
  createRecipeComment,
  deleteRecipeComment,
  getRecipeSocial,
  listRecipeComments,
  removeRecipeVote,
  setRecipeVote,
  updateRecipeComment,
  type RecipeComment,
  type RecipeSocialSummary,
  type RecipeVote,
} from "@/services/recipe-social.service";

import styles from "./RecipeCommunity.module.css";

interface RecipeCommunityProps {
  recipeId: string;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function RecipeCommunity({ recipeId }: RecipeCommunityProps) {
  const [summary, setSummary] = useState<RecipeSocialSummary>({ likes: 0, dislikes: 0, myVote: null });
  const [comments, setComments] = useState<RecipeComment[]>([]);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const loggedIn = Boolean(getAuthToken());

  useEffect(() => {
    let cancelled = false;
    Promise.all([getRecipeSocial(recipeId), listRecipeComments(recipeId)])
      .then(([social, recipeComments]) => {
        if (cancelled) return;
        setSummary(social);
        setComments(recipeComments);
      })
      .catch(() => {
        if (!cancelled) setMessage("Não foi possível carregar a conversa desta receita agora.");
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  async function vote(nextVote: RecipeVote) {
    if (!loggedIn) {
      setMessage("Entre na sua conta para avaliar esta receita.");
      return;
    }
    setIsBusy(true);
    setMessage(null);
    try {
      const next = summary.myVote === nextVote
        ? await removeRecipeVote(recipeId)
        : await setRecipeVote(recipeId, nextVote);
      setSummary(next);
    } catch {
      setMessage("Não foi possível registrar sua avaliação agora.");
    } finally {
      setIsBusy(false);
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loggedIn) {
      setMessage("Entre na sua conta para deixar um comentário.");
      return;
    }
    if (comment.trim().length < 2) return;
    setIsBusy(true);
    setMessage(null);
    try {
      setComments(await createRecipeComment(recipeId, comment.trim()));
      setComment("");
    } catch {
      setMessage("Não foi possível publicar seu comentário agora.");
    } finally {
      setIsBusy(false);
    }
  }

  async function saveEdit(commentId: string) {
    if (editingBody.trim().length < 2) return;
    setIsBusy(true);
    setMessage(null);
    try {
      setComments(await updateRecipeComment(commentId, editingBody.trim()));
      setEditingId(null);
      setEditingBody("");
    } catch {
      setMessage("Não foi possível editar seu comentário agora.");
    } finally {
      setIsBusy(false);
    }
  }

  async function removeComment(commentId: string) {
    setIsBusy(true);
    setMessage(null);
    try {
      setComments(await deleteRecipeComment(commentId));
    } catch {
      setMessage("Não foi possível excluir seu comentário agora.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className={styles.community} aria-labelledby="community-title">
      <div className={styles.heading}>
        <p>03 · COMUNIDADE</p>
        <h2 id="community-title">Quem fez, conta.</h2>
        <span>Uma receita fica melhor quando a cozinha conversa.</span>
      </div>

      <div className={styles.votes} aria-label="Avaliações da receita">
        <button
          type="button"
          className={summary.myVote === "LIKE" ? styles.voteActive : styles.vote}
          onClick={() => void vote("LIKE")}
          disabled={isBusy}
        >
          <span aria-hidden="true">👍</span>
          <strong>Gostei</strong>
          <small>{summary.likes}</small>
        </button>
        <button
          type="button"
          className={summary.myVote === "DISLIKE" ? styles.voteActive : styles.vote}
          onClick={() => void vote("DISLIKE")}
          disabled={isBusy}
        >
          <span aria-hidden="true">👎</span>
          <strong>Não gostei</strong>
          <small>{summary.dislikes}</small>
        </button>
      </div>

      <form className={styles.commentForm} onSubmit={submitComment}>
        <label htmlFor="recipe-comment">Deixe sua pitada</label>
        <textarea
          id="recipe-comment"
          maxLength={1200}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={loggedIn ? "O que você mudou, gostou ou faria diferente?" : "Entre na sua conta para participar da conversa."}
          disabled={!loggedIn || isBusy}
        />
        <div>
          <small>{comment.length}/1200</small>
          <button type="submit" disabled={!loggedIn || isBusy || comment.trim().length < 2}>Publicar comentário</button>
        </div>
      </form>

      {message ? <p className={styles.message}>{message}</p> : null}

      <div className={styles.comments}>
        <div className={styles.commentsTitle}>
          <h3>Comentários</h3>
          <span>{comments.length}</span>
        </div>

        {loaded && comments.length === 0 ? (
          <div className={styles.empty}>Ainda ninguém deixou uma pitada por aqui. Você pode ser o primeiro.</div>
        ) : null}

        {comments.map((item) => (
          <article className={styles.comment} key={item.id}>
            <FoodAvatar avatarKey={item.author.avatarKey} className={styles.avatar} label={`Avatar de ${item.author.name}`} />
            <div className={styles.commentBody}>
              <div className={styles.commentMeta}>
                <div>
                  <strong>{item.author.name}</strong>
                  <span>{item.author.handle ? `@${item.author.handle}` : "cozinheiro do Receitando"}</span>
                </div>
                <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
              </div>

              {editingId === item.id ? (
                <div className={styles.editBox}>
                  <textarea maxLength={1200} value={editingBody} onChange={(event) => setEditingBody(event.target.value)} />
                  <div>
                    <button type="button" onClick={() => { setEditingId(null); setEditingBody(""); }}>Cancelar</button>
                    <button type="button" onClick={() => void saveEdit(item.id)} disabled={isBusy || editingBody.trim().length < 2}>Salvar</button>
                  </div>
                </div>
              ) : (
                <p>{item.body}</p>
              )}

              {item.canEdit && editingId !== item.id ? (
                <div className={styles.commentActions}>
                  <button type="button" onClick={() => { setEditingId(item.id); setEditingBody(item.body); }}>Editar</button>
                  <button type="button" onClick={() => void removeComment(item.id)} disabled={isBusy}>Excluir</button>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
