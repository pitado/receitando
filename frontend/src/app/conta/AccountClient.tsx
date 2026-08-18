"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { FoodAvatar, FOOD_AVATARS } from "@/components/profile/FoodAvatar";
import { ApiError } from "@/services/api-client";
import { AUTH_CHANGED_EVENT } from "@/services/auth-storage";
import { getCurrentUser, updateProfile, type AuthUser } from "@/services/auth.service";
import { listFavorites } from "@/services/favorites.service";
import { getPantry } from "@/services/pantry.service";

import styles from "./page.module.css";

const MORNING_LINES = [
  "Bora colocar uma ideia no fogo?",
  "Café passado, ideias na mesa.",
  "O dia começou — o que vai sair dessa cozinha?",
  "A primeira pitada do dia pode virar receita boa.",
  "Panela no fogo e criatividade acordada.",
];

const AFTERNOON_LINES = [
  "Tem receita boa saindo do forno.",
  "A tarde pede uma pitada de ideia.",
  "Ainda dá tempo de salvar o jantar.",
  "Que tal mexer a panela e as ideias também?",
  "A cozinha chamou para um intervalo gostoso.",
];

const NIGHT_LINES = [
  "Ainda dá tempo de temperar o dia.",
  "A cozinha ainda está aberta por aqui.",
  "Fecha o dia com alguma coisa gostosa.",
  "A noite combina com receita sem pressa.",
  "Antes de apagar o fogo, que tal mais uma ideia?",
];

function greetingForHour(hour: number, variation: number) {
  if (hour < 12) {
    return {
      label: "Bom dia",
      line: MORNING_LINES[variation % MORNING_LINES.length],
    };
  }
  if (hour < 18) {
    return {
      label: "Boa tarde",
      line: AFTERNOON_LINES[variation % AFTERNOON_LINES.length],
    };
  }
  return {
    label: "Boa noite",
    line: NIGHT_LINES[variation % NIGHT_LINES.length],
  };
}

function suggestedHandle(user: AuthUser): string {
  if (user.handle) return user.handle;
  const emailName = user.email.split("@")[0] ?? "cozinheiro";
  const normalized = emailName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
  return normalized.length >= 3 ? normalized : "cozinheiro";
}

export function AccountClient() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pantryCount, setPantryCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hour, setHour] = useState<number | null>(null);
  const [greetingVariation, setGreetingVariation] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHandle, setEditHandle] = useState("");
  const [editAvatar, setEditAvatar] = useState("tomato");
  const [editError, setEditError] = useState("");
  const [editMessage, setEditMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const currentUser = await getCurrentUser();
        const [pantry, favorites] = await Promise.all([getPantry(), listFavorites()]);
        if (cancelled) return;

        setUser(currentUser);
        setPantryCount(pantry.length);
        setFavoriteCount(favorites.length);
        setHour(new Date().getHours());
        setGreetingVariation(Math.floor(Math.random() * 5));
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.name.trim().split(/\s+/)[0] || "cozinheiro";
  const greeting = useMemo(
    () => greetingForHour(hour ?? 12, greetingVariation),
    [hour, greetingVariation],
  );

  function openEditor() {
    if (!user) return;
    setEditName(user.name);
    setEditHandle(suggestedHandle(user));
    setEditAvatar(user.avatarKey || "tomato");
    setEditError("");
    setEditMessage("");
    setIsEditing(true);
  }

  function closeEditor() {
    if (isSaving) return;
    setIsEditing(false);
    setEditError("");
    setEditMessage("");
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditError("");
    setEditMessage("");
    setIsSaving(true);

    try {
      const updated = await updateProfile(editName.trim(), editHandle.trim(), editAvatar);
      setUser(updated);
      setEditName(updated.name);
      setEditHandle(updated.handle ?? "");
      setEditAvatar(updated.avatarKey || "tomato");
      setEditMessage("Perfil salvo. Sua cozinha agora tem mais a sua cara.");
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    } catch (error: unknown) {
      setEditError(
        error instanceof ApiError
          ? error.message
          : "Não foi possível salvar seu perfil agora. Tente novamente.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className={styles.loading}>Preparando sua bancada…</div>;
  }

  if (hasError || !user) {
    return (
      <section className={styles.emptyState}>
        <p className={styles.eyebrow}>SUA CONTA</p>
        <h1>Essa bancada precisa de login.</h1>
        <p>Entre na sua conta para ver seu perfil, sua despensa e suas receitas salvas.</p>
        <Link className={styles.primaryAction} href="/entrar">Entrar</Link>
      </section>
    );
  }

  return (
    <div className={styles.shell}>
      <section className={styles.hero}>
        <FoodAvatar
          avatarKey={user.avatarKey}
          className={styles.avatar}
          label={`Avatar de ${user.name}`}
        />
        <div>
          <p className={styles.eyebrow}>MINHA COZINHA</p>
          <h1>{greeting.label}, {firstName}.</h1>
          <p className={styles.greeting}>{greeting.line}</p>
        </div>
      </section>

      <section className={styles.profileCard}>
        <div>
          <p className={styles.cardLabel}>SEU PERFIL</p>
          <h2>{user.name}</h2>
          <p className={styles.handle}>{user.handle ? `@${user.handle}` : "Escolha seu @ único"}</p>
          <p>{user.email}</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.secondaryAction} onClick={openEditor} type="button">
            Editar perfil
          </button>
          <Link className={styles.primaryAction} href="/recuperar-senha">Alterar senha</Link>
        </div>
      </section>

      {isEditing ? (
        <section className={styles.editorCard} aria-label="Editar perfil">
          <div className={styles.editorHeading}>
            <div>
              <p className={styles.cardLabel}>DEIXE COM A SUA CARA</p>
              <h2>Editar perfil</h2>
              <p>Seu @ é único no Receitando. A foto pode ser trocada quando quiser.</p>
            </div>
            <button className={styles.closeEditor} onClick={closeEditor} type="button" aria-label="Fechar edição">
              ×
            </button>
          </div>

          <form className={styles.editorForm} onSubmit={submitProfile}>
            <div className={styles.fieldsGrid}>
              <label className={styles.field}>
                <span>Nome</span>
                <input
                  disabled={isSaving}
                  maxLength={100}
                  minLength={2}
                  onChange={(event) => setEditName(event.target.value)}
                  required
                  type="text"
                  value={editName}
                />
              </label>

              <label className={styles.field}>
                <span>Seu @</span>
                <div className={styles.handleInput}>
                  <strong>@</strong>
                  <input
                    autoCapitalize="none"
                    autoCorrect="off"
                    disabled={isSaving}
                    maxLength={24}
                    minLength={3}
                    onChange={(event) => setEditHandle(event.target.value.toLowerCase().replace(/^@+/, ""))}
                    pattern="[a-z0-9][a-z0-9_]{2,23}"
                    placeholder="seunome"
                    required
                    spellCheck={false}
                    type="text"
                    value={editHandle}
                  />
                </div>
                <small>3 a 24 caracteres. Letras, números e _.</small>
              </label>
            </div>

            <fieldset className={styles.avatarPicker}>
              <legend>Escolha sua foto de perfil</legend>
              <p>Uma coleção de ingredientes abstratos feita para o Receitando.</p>
              <div className={styles.avatarGrid}>
                {FOOD_AVATARS.map((avatar) => {
                  const selected = editAvatar === avatar.key;
                  return (
                    <label
                      className={`${styles.avatarOption} ${selected ? styles.avatarOptionSelected : ""}`}
                      key={avatar.key}
                    >
                      <input
                        checked={selected}
                        disabled={isSaving}
                        name="avatar"
                        onChange={() => setEditAvatar(avatar.key)}
                        type="radio"
                        value={avatar.key}
                      />
                      <FoodAvatar avatarKey={avatar.key} className={styles.avatarPreview} label={avatar.label} />
                      <span>{avatar.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {editError ? <p className={styles.editError}>{editError}</p> : null}
            {editMessage ? <p className={styles.editSuccess}>{editMessage}</p> : null}

            <div className={styles.editorActions}>
              <button className={styles.cancelButton} disabled={isSaving} onClick={closeEditor} type="button">
                Cancelar
              </button>
              <button className={styles.saveButton} disabled={isSaving} type="submit">
                {isSaving ? "Salvando…" : "Salvar perfil"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className={styles.stats} aria-label="Resumo da conta">
        <Link className={styles.statCard} href="/despensa">
          <span>{pantryCount}</span>
          <strong>{pantryCount === 1 ? "ingrediente na despensa" : "ingredientes na despensa"}</strong>
          <small>Ver o que já está na cozinha →</small>
        </Link>
        <Link className={styles.statCard} href="/favoritos">
          <span>{favoriteCount}</span>
          <strong>{favoriteCount === 1 ? "receita favorita" : "receitas favoritas"}</strong>
          <small>Abrir seu caderno →</small>
        </Link>
      </section>

      <section className={styles.tip}>
        <span aria-hidden="true">✦</span>
        <div>
          <strong>Uma pitada de organização ajuda.</strong>
          <p>Quanto mais completa sua despensa, melhores ficam as sugestões de receitas para o que você já tem em casa.</p>
        </div>
      </section>
    </div>
  );
}
