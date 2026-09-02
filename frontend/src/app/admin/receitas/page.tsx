"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  listRecipeSubmissions,
  moderateRecipeSubmission,
  type AdminRecipeSubmission,
  type RecipeSubmissionStatus,
} from "@/services/admin-recipe-submissions.service";
import { ApiError } from "@/services/api-client";
import { getCurrentUser } from "@/services/auth.service";

import styles from "./page.module.css";

type AccessState = "loading" | "admin" | "anonymous" | "forbidden";
type Filter = RecipeSubmissionStatus;

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "PENDING", label: "Pendentes" },
  { value: "APPROVED", label: "Aprovadas" },
  { value: "REJECTED", label: "Rejeitadas" },
];

const DIFFICULTY_LABEL: Record<AdminRecipeSubmission["difficulty"], string> = {
  FACIL: "Fácil",
  MEDIA: "Média",
  DIFICIL: "Difícil",
};

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusLabel(status: RecipeSubmissionStatus): string {
  if (status === "APPROVED") return "Aprovada";
  if (status === "REJECTED") return "Rejeitada";
  return "Pendente";
}

export default function AdminRecipesPage() {
  const [access, setAccess] = useState<AccessState>("loading");
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [submissions, setSubmissions] = useState<AdminRecipeSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSubmissions = useCallback(async (selectedFilter: Filter) => {
    setIsLoading(true);
    setError(null);
    try {
      setSubmissions(await listRecipeSubmissions(selectedFilter));
    } catch (caught) {
      if (caught instanceof ApiError && (caught.status === 401 || caught.status === 403)) {
        setAccess(caught.status === 401 ? "anonymous" : "forbidden");
      }
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar as receitas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      try {
        const user = await getCurrentUser();
        if (cancelled) return;
        if (user.role !== "ADMIN") {
          setAccess("forbidden");
          return;
        }
        setAccess("admin");
      } catch (caught) {
        if (!cancelled) {
          setAccess(caught instanceof ApiError && caught.status === 401 ? "anonymous" : "forbidden");
        }
      }
    }

    void checkAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (access !== "admin") return;
    const timer = window.setTimeout(() => {
      void loadSubmissions(filter);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [access, filter, loadSubmissions]);

  async function handleDecision(
    submission: AdminRecipeSubmission,
    decision: "APPROVED" | "REJECTED",
  ) {
    const verb = decision === "APPROVED" ? "aprovar" : "rejeitar";
    if (!window.confirm(`Tem certeza que deseja ${verb} “${submission.title}”?`)) return;

    setBusyId(submission.id);
    setError(null);
    setMessage(null);

    try {
      const response = await moderateRecipeSubmission(submission.id, decision);
      setMessage(response.message);
      setSubmissions((current) => current.filter((item) => item.id !== submission.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível concluir a análise.");
    } finally {
      setBusyId(null);
    }
  }

  if (access === "loading") {
    return (
      <section className={`container ${styles.page}`}>
        <div className={styles.stateCard}>Verificando acesso administrativo…</div>
      </section>
    );
  }

  if (access === "anonymous") {
    return (
      <section className={`container ${styles.page}`}>
        <div className={styles.stateCard}>
          <span className={styles.eyebrow}>Área administrativa</span>
          <h1>Entre para moderar receitas</h1>
          <p>Esta página é restrita aos administradores do Receitando.</p>
          <Link className={styles.primaryLink} href="/entrar?next=/admin/receitas">
            Entrar na conta
          </Link>
        </div>
      </section>
    );
  }

  if (access === "forbidden") {
    return (
      <section className={`container ${styles.page}`}>
        <div className={styles.stateCard}>
          <span className={styles.eyebrow}>Área administrativa</span>
          <h1>Acesso restrito</h1>
          <p>Sua conta está conectada, mas não possui permissão de administrador.</p>
          <Link className={styles.secondaryLink} href="/">
            Voltar ao Receitando
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={`container ${styles.page}`}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Moderação</span>
          <h1>Receitas da comunidade</h1>
          <p>Revise as receitas enviadas antes de colocá-las no catálogo do Receitando.</p>
        </div>
        <div className={styles.counter}>
          <strong>{submissions.length}</strong>
          <span>{FILTERS.find((item) => item.value === filter)?.label.toLowerCase()}</span>
        </div>
      </header>

      <div className={styles.toolbar} role="tablist" aria-label="Filtrar receitas por situação">
        {FILTERS.map((item) => (
          <button
            aria-selected={filter === item.value}
            className={filter === item.value ? styles.activeFilter : styles.filter}
            key={item.value}
            onClick={() => {
              setMessage(null);
              setFilter(item.value);
            }}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
        <button
          className={styles.refresh}
          disabled={isLoading}
          onClick={() => void loadSubmissions(filter)}
          type="button"
        >
          {isLoading ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      {message ? <div className={styles.success}>{message}</div> : null}
      {error ? <div className={styles.error}>{error}</div> : null}

      {isLoading && submissions.length === 0 ? (
        <div className={styles.empty}>Carregando receitas…</div>
      ) : null}

      {!isLoading && submissions.length === 0 ? (
        <div className={styles.empty}>
          <strong>Nada por aqui.</strong>
          <span>Não há receitas {FILTERS.find((item) => item.value === filter)?.label.toLowerCase()} agora.</span>
        </div>
      ) : null}

      <div className={styles.list}>
        {submissions.map((submission) => (
          <article className={styles.card} key={submission.id}>
            <div className={styles.imageWrap}>
              {submission.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- imagem dinâmica servida pela API/R2
                <img alt={`Foto enviada para ${submission.title}`} src={submission.imageUrl} />
              ) : (
                <div className={styles.noImage}>Sem foto</div>
              )}
              <span className={`${styles.status} ${styles[`status${submission.status}`]}`}>
                {statusLabel(submission.status)}
              </span>
            </div>

            <div className={styles.content}>
              <div className={styles.titleRow}>
                <div>
                  <span className={styles.author}>{submission.authorName}</span>
                  <h2>{submission.title}</h2>
                </div>
                <time dateTime={submission.createdAt}>{formatDate(submission.createdAt)}</time>
              </div>

              <p className={styles.description}>{submission.description}</p>

              <div className={styles.meta}>
                <span>{DIFFICULTY_LABEL[submission.difficulty]}</span>
                <span>{submission.prepMinutes ? `${submission.prepMinutes} min` : "Tempo não informado"}</span>
                <span>{submission.servings ? `${submission.servings} porções` : "Porções não informadas"}</span>
                {submission.mealType ? <span>{submission.mealType}</span> : null}
              </div>

              <div className={styles.detailsGrid}>
                <div>
                  <h3>Ingredientes</h3>
                  <ul>
                    {submission.ingredients.map((ingredient, index) => (
                      <li key={`${submission.id}-ingredient-${index}`}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Modo de preparo</h3>
                  <ol>
                    {submission.instructions.map((instruction, index) => (
                      <li key={`${submission.id}-instruction-${index}`}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              </div>

              {submission.authorEmail ? (
                <p className={styles.contact}>Contato informado: {submission.authorEmail}</p>
              ) : null}

              {submission.status === "PENDING" ? (
                <div className={styles.actions}>
                  <button
                    className={styles.rejectButton}
                    disabled={busyId === submission.id}
                    onClick={() => void handleDecision(submission, "REJECTED")}
                    type="button"
                  >
                    Rejeitar
                  </button>
                  <button
                    className={styles.approveButton}
                    disabled={busyId === submission.id}
                    onClick={() => void handleDecision(submission, "APPROVED")}
                    type="button"
                  >
                    {busyId === submission.id ? "Processando…" : "Aprovar e publicar"}
                  </button>
                </div>
              ) : null}

              {submission.status === "APPROVED" && submission.publishedRecipeId ? (
                <p className={styles.reviewInfo}>Publicada no catálogo.</p>
              ) : null}
              {submission.status === "REJECTED" && submission.rejectionReason ? (
                <p className={styles.reviewInfo}>Motivo: {submission.rejectionReason}</p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
