"use client";

import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";

import { ApiError } from "@/services/api-client";
import { submitRecipe } from "@/services/recipe-submissions.service";

import styles from "./RecipeSubmissionForm.module.css";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function lines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.replace(/^[-•\d.)\s]+/, "").trim())
    .filter(Boolean);
}

export function RecipeSubmissionForm() {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageName, setImageName] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setMessage("");

    if (!file) {
      setImageName("");
      setPreviewUrl("");
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      event.currentTarget.value = "";
      setImageName("");
      setPreviewUrl("");
      setError("Use uma foto JPG, PNG ou WebP.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      event.currentTarget.value = "";
      setImageName("");
      setPreviewUrl("");
      setError("A foto pode ter no máximo 12 MB.");
      return;
    }

    setError("");
    setImageName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    setError("");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const imageEntry = form.get("image");
    const image = imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : undefined;

    if (!image) {
      setError("Escolha uma foto do prato para enviar a receita.");
      setSending(false);
      return;
    }

    try {
      const response = await submitRecipe({
        authorName: String(form.get("authorName") ?? ""),
        authorEmail: String(form.get("authorEmail") ?? ""),
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
        ingredients: lines(String(form.get("ingredients") ?? "")),
        instructions: lines(String(form.get("instructions") ?? "")),
        prepMinutes: Number(form.get("prepMinutes")) || undefined,
        servings: Number(form.get("servings")) || undefined,
        mealType: String(form.get("mealType") ?? ""),
        difficulty: String(form.get("difficulty") ?? "FACIL") as "FACIL" | "MEDIA" | "DIFICIL",
        image,
        website: String(form.get("website") ?? ""),
      });

      setMessage(response.message);
      formElement.reset();
      setImageName("");
      setPreviewUrl("");
    } catch (submitError: unknown) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Não foi possível enviar sua receita agora. Tente novamente.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.gridTwo}>
        <label>
          <span>Seu nome</span>
          <input name="authorName" required minLength={2} placeholder="Como quer aparecer" />
        </label>
        <label>
          <span>E-mail <small>(opcional)</small></span>
          <input name="authorEmail" type="email" inputMode="email" autoComplete="email" placeholder="Para contato sobre a receita" />
        </label>
      </div>

      <label>
        <span>Nome da receita</span>
        <input name="title" required minLength={3} placeholder="Ex.: Bolo de banana da vó" />
      </label>

      <label>
        <span>Conte um pouco sobre ela</span>
        <textarea
          name="description"
          required
          minLength={10}
          rows={3}
          placeholder="O que torna essa receita especial?"
        />
      </label>

      <div className={styles.gridTwo}>
        <label>
          <span>Ingredientes</span>
          <textarea
            name="ingredients"
            required
            rows={9}
            placeholder={"1 ingrediente por linha\n2 bananas maduras\n2 ovos\n1 xícara de farinha"}
          />
        </label>
        <label>
          <span>Modo de preparo</span>
          <textarea
            name="instructions"
            required
            rows={9}
            placeholder={"1 passo por linha\nAmasse as bananas\nMisture os ovos\nLeve ao forno..."}
          />
        </label>
      </div>

      <div className={styles.gridThree}>
        <label>
          <span>Tempo <small>(minutos)</small></span>
          <input name="prepMinutes" type="number" min={1} max={1440} inputMode="numeric" />
        </label>
        <label>
          <span>Porções</span>
          <input name="servings" type="number" min={1} max={100} inputMode="numeric" />
        </label>
        <label>
          <span>Dificuldade</span>
          <select defaultValue="FACIL" name="difficulty">
            <option value="FACIL">Fácil</option>
            <option value="MEDIA">Média</option>
            <option value="DIFICIL">Difícil</option>
          </select>
        </label>
      </div>

      <label>
        <span>Tipo de refeição</span>
        <input name="mealType" placeholder="Café da manhã, almoço, sobremesa..." />
      </label>

      <div className={styles.photoField}>
        <div className={styles.photoHeading}>
          <div>
            <strong>Foto do prato</strong>
            <p>No celular, toque abaixo para tirar uma foto ou escolher da galeria.</p>
          </div>
          <span>JPG, PNG ou WebP · até 12 MB</span>
        </div>

        <label className={styles.photoPicker}>
          <input
            accept="image/jpeg,image/png,image/webp"
            name="image"
            onChange={handleImageChange}
            required
            type="file"
          />
          <span className={styles.photoPickerButton}>Escolher foto</span>
          <span className={styles.photoPickerName}>{imageName || "Nenhuma foto escolhida"}</span>
        </label>

        {previewUrl ? (
          <div className={styles.photoPreview}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview before upload */}
            <img alt="Prévia da foto escolhida" src={previewUrl} />
            <span>Prévia da foto que será enviada</span>
          </div>
        ) : null}
      </div>

      <input className={styles.honeypot} name="website" tabIndex={-1} autoComplete="off" />

      <div className={styles.notice}>
        <strong>Antes de publicar</strong>
        <p>
          A receita fica em análise para evitar conteúdo duplicado, imagens sem permissão e receitas incompletas.
        </p>
      </div>

      {message ? <p className={styles.success}>{message}</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <button className={styles.submit} disabled={sending} type="submit">
        {sending ? "Enviando receita e foto..." : "Enviar minha receita"}
      </button>
    </form>
  );
}
